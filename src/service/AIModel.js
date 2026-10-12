const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Google retires Gemini model IDs regularly (gemini-1.5-flash is gone), so we
// try the "latest" alias first and fall back to pinned Flash models.
const MODELS = [
  import.meta.env.VITE_GEMINI_MODEL,
  "gemini-flash-latest",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-flash-lite-latest",
].filter((model, i, all) => model && all.indexOf(model) === i);

export const isAIConfigured = Boolean(apiKey);

const SYSTEM_INSTRUCTION = `You are an expert local travel planner.
Create realistic, well-paced itineraries using real, currently operating places.
Order each day's stops so the route is geographically efficient.
Coordinates must be accurate decimal latitude/longitude for the exact place.
Prices should be in the destination's local currency (add the USD equivalent in brackets).
Keep descriptions vivid but concise (1–2 sentences).`;

const coordinates = {
  type: "object",
  properties: {
    latitude: { type: "number" },
    longitude: { type: "number" },
  },
  required: ["latitude", "longitude"],
};

// Field names match the format saved by earlier versions of the app so old
// trips keep rendering.
const DAY_SCHEMA = {
  type: "object",
  properties: {
    day: { type: "integer" },
    theme: { type: "string", description: "Short title for the day, e.g. 'Old Town & Riverside'." },
    plan: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          time: { type: "string", description: "e.g. 'Morning (9:00 AM – 11:30 AM)'." },
          placeName: { type: "string" },
          placeDetails: { type: "string" },
          ticketPricing: { type: "string" },
          rating: { type: "number" },
          timeTravel: { type: "string", description: "Travel time from the previous stop." },
          geoCoordinates: coordinates,
        },
        required: ["time", "placeName", "placeDetails", "ticketPricing", "rating", "timeTravel", "geoCoordinates"],
      },
    },
  },
  required: ["day", "theme", "plan"],
};

const TRIP_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "2–3 sentence overview of the trip." },
    bestTimeToVisit: { type: "string" },
    estimatedTotalCost: { type: "string", description: "Rough total for the whole group." },
    hotelOptions: {
      type: "array",
      minItems: 3,
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          hotelName: { type: "string" },
          hotelAddress: { type: "string" },
          price: { type: "string", description: "Price per night." },
          rating: { type: "number", description: "Out of 5." },
          description: { type: "string" },
          geoCoordinates: coordinates,
        },
        required: ["hotelName", "hotelAddress", "price", "rating", "description", "geoCoordinates"],
      },
    },
    itinerary: {
      type: "array",
      items: DAY_SCHEMA,
    },
    travelTips: {
      type: "array",
      maxItems: 5,
      items: { type: "string" },
    },
  },
  required: ["summary", "bestTimeToVisit", "estimatedTotalCost", "hotelOptions", "itinerary", "travelTips"],
};

let client;
async function getClient() {
  if (!apiKey) {
    throw new Error(
      "Gemini API key missing. Add VITE_GEMINI_API_KEY to your .env file and restart the dev server."
    );
  }
  if (!client) {
    // Loaded on demand so the SDK isn't part of the initial page load.
    const { GoogleGenAI } = await import("@google/genai");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

function parseJson(text) {
  const cleaned = (text ?? "").replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("The AI returned an unreadable response. Please try again.");
  }
}

function friendlyError(error) {
  const message = error?.message ?? "";
  if (/api key/i.test(message)) {
    return new Error("Your Gemini API key was rejected. Check VITE_GEMINI_API_KEY in .env.");
  }
  if (error?.status === 429 || /quota|rate/i.test(message)) {
    return new Error("Gemini rate limit reached. Wait a minute and try again.");
  }
  if (error?.status >= 500) {
    return new Error("Gemini is busy right now. Please try again in a moment.");
  }
  return error instanceof Error ? error : new Error("Could not generate the trip.");
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 429 / 5xx are usually temporary ("model overloaded"), so retry once before
// moving on to the next model.
const isTransient = (error) => error?.status === 429 || error?.status >= 500;

/** Calls Gemini for JSON matching `schema`, with retries and model fallback. */
async function generateStructured(prompt, schema, validate) {
  const ai = await getClient();
  let lastError;

  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseJsonSchema: schema,
          },
        });
        const result = parseJson(response.text);
        validate(result);
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`[Gemini] ${model} attempt ${attempt} failed:`, error?.status, error?.message);
        // A bad key or bad request won't be fixed by switching models.
        const unrecoverable =
          [400, 401, 403].includes(error?.status) && !/model|not found|not supported/i.test(error?.message);
        if (unrecoverable) throw friendlyError(error);
        if (!isTransient(error) || attempt === 2) break;
        await sleep(2000);
      }
    }
  }
  throw friendlyError(lastError);
}

/** Generates a structured trip plan. Returns the parsed JSON object. */
export function generateTrip(prompt) {
  return generateStructured(prompt, TRIP_SCHEMA, (trip) => {
    if (!trip?.itinerary?.length) throw new Error("The AI returned an empty itinerary.");
  });
}

/**
 * Re-plans a single day of an existing trip, following the user's instruction
 * and avoiding places already planned on other days. Returns { theme, plan }.
 */
export async function regenerateDay({ trip, dayIndex, instruction }) {
  const selection = trip.userSelection ?? {};
  const days = trip.tripData.itinerary;
  const current = days[dayIndex];
  const elsewhere = days
    .filter((_, i) => i !== dayIndex)
    .flatMap((d) => d.plan.map((p) => p.placeName))
    .filter(Boolean);
  const hotels = (trip.tripData.hotelOptions ?? []).map((h) => h.hotelName).filter(Boolean);

  const prompt = [
    `Destination: ${selection.location?.label}.`,
    `Travellers: ${selection.traveler || "not specified"}. Budget: ${selection.budget || "not specified"}.`,
    selection.interests?.length ? `Interests: ${selection.interests.join(", ")}.` : "",
    `This is day ${dayIndex + 1} of a ${days.length}-day trip.`,
    hotels.length ? `They are staying at: ${hotels.join(", ")}.` : "",
    elsewhere.length ? `Already planned on other days (do NOT repeat these): ${elsewhere.join("; ")}.` : "",
    current?.plan?.length
      ? `Current plan for this day: ${current.plan.map((p) => `${p.placeName} (${p.time})`).join("; ")}.`
      : "This day currently has no stops.",
    `Traveller's request: "${instruction?.trim() || "Suggest a fresh alternative plan for this day."}"`,
    `Return a new plan for day ${dayIndex + 1} only: a short theme and 3–5 places in visiting order with times, details, ticket pricing, rating, travel time from the previous stop and accurate coordinates.`,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await generateStructured(prompt, DAY_SCHEMA, (day) => {
    if (!day?.plan?.length) throw new Error("The AI returned an empty day plan.");
  });
  return { theme: result.theme ?? "", plan: result.plan };
}
