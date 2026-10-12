// Turns a stored trip document (old or new format) into one predictable shape
// for the UI.

export const DAY_COLORS = ["#0f6fd8", "#f56551", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6", "#6366f1", "#ef4444", "#84cc16"];
export const HOTEL_COLOR = "#0f172a";

export const dayColor = (dayIndex) => DAY_COLORS[dayIndex % DAY_COLORS.length];

/** "Bhubaneswar (M.Corp.)" / "Pune Municipal Corporation" → "Bhubaneswar" / "Pune". */
export function cleanPlaceName(name) {
  const cleaned = (name ?? "")
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s+(Municipal Corporation|City Corporation|Municipality|Metropolitan Region)$/i, "")
    .trim();
  return cleaned || name || "";
}

const toNumber = (value) => {
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
};

const validCoords = (lat, lng) =>
  lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)
    ? { lat, lng }
    : null;

/** Accepts {latitude, longitude}, {lat, lng}, or strings like "36.17° N, 115.14° W". */
export function parseCoordinates(value) {
  if (!value) return null;
  if (typeof value === "object") {
    return validCoords(
      toNumber(value.latitude ?? value.lat),
      toNumber(value.longitude ?? value.lng ?? value.lon)
    );
  }
  const match = String(value).match(
    /(-?\d+(?:\.\d+)?)\s*°?\s*([NS])?\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*°?\s*([EW])?/i
  );
  if (!match) return null;
  let lat = toNumber(match[1]);
  let lng = toNumber(match[3]);
  if (match[2]?.toUpperCase() === "S") lat = -Math.abs(lat);
  if (match[4]?.toUpperCase() === "W") lng = -Math.abs(lng);
  return validCoords(lat, lng);
}

function normalizeHotel(h, i) {
  return {
    key: h.uid ?? `hotel-${i}`,
    uid: h.uid,
    custom: Boolean(h.custom),
    notes: h.userNotes ?? "",
    name: h.hotelName ?? h.name ?? h.HotelName ?? "Hotel",
    address: h.hotelAddress ?? h.address ?? h.HotelAddress ?? "",
    price: h.price ?? h.Price ?? "",
    rating: toNumber(h.rating ?? h.Rating),
    description: h.description ?? h.descriptions ?? h.Description ?? "",
    coords: parseCoordinates(h.geoCoordinates ?? h.coordinates),
  };
}

function normalizePlace(p, dayIndex, i) {
  return {
    key: p.uid ?? `d${dayIndex}-p${i}`,
    uid: p.uid,
    custom: Boolean(p.custom),
    notes: p.userNotes ?? "",
    dayIndex,
    order: i + 1,
    time: p.time ?? p.bestTimeToVisit ?? "",
    name: p.placeName ?? p.name ?? p.PlaceName ?? "Stop",
    details: p.placeDetails ?? p.details ?? p.description ?? "",
    ticket: p.ticketPricing ?? p.ticketPrice ?? "",
    rating: toNumber(p.rating),
    travelTime: p.timeTravel ?? p.travelTime ?? "",
    coords: parseCoordinates(p.geoCoordinates ?? p.coordinates),
  };
}

export function normalizeTrip(raw) {
  if (!raw) return null;
  const selection = raw.userSelection ?? {};
  const data = raw.tripData ?? {};
  const location = selection.location ?? {};

  let itinerary = data.itinerary ?? data.dailyPlan ?? [];
  if (!Array.isArray(itinerary)) {
    itinerary = Object.keys(itinerary)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((key) => itinerary[key]);
  }

  const label = (location.label ?? location.display_name ?? "Your trip")
    .split(",")
    .map((part) => cleanPlaceName(part.trim()))
    .join(", ");
  const locationCoords = validCoords(toNumber(location.lat), toNumber(location.lon ?? location.lng));

  return {
    id: raw.id,
    createdAt: raw.createdAt ?? (Number(raw.id) || null),
    userEmail: raw.userEmail,
    location: {
      label,
      name: cleanPlaceName(location.name) || label.split(",")[0].trim(),
      coords: locationCoords,
    },
    noOfDays: itinerary.length || Number(selection.noOfDays) || 0,
    budget: selection.budget ?? "",
    traveler: selection.traveler ?? "",
    interests: selection.interests ?? [],
    summary: data.summary ?? "",
    bestTimeToVisit: data.bestTimeToVisit ?? "",
    estimatedTotalCost: data.estimatedTotalCost ?? "",
    tips: data.travelTips ?? [],
    hotels: (data.hotelOptions ?? data.hotels ?? []).map(normalizeHotel),
    days: itinerary.map((day, dayIndex) => ({
      day: Number(day.day) || dayIndex + 1,
      uid: day.uid,
      dayIndex,
      theme: day.theme ?? "",
      places: (day.plan ?? day.places ?? day.activities ?? []).map((p, i) => normalizePlace(p, dayIndex, i)),
    })),
  };
}

export function formatDate(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
