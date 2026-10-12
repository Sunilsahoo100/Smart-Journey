export const SelectTravelesList = [
  {
    id: 1,
    title: "Just Me",
    desc: "A solo traveller in exploration",
    icon: "🎒",
    people: "1 Person",
  },
  {
    id: 2,
    title: "A Couple",
    desc: "Two travellers in tandem",
    icon: "🥂",
    people: "2 People",
  },
  {
    id: 3,
    title: "Family",
    desc: "A group of fun-loving adventurers",
    icon: "🏡",
    people: "3 to 5 People",
  },
  {
    id: 4,
    title: "Friends",
    desc: "A bunch of thrill-seekers",
    icon: "⛵",
    people: "5 to 10 People",
  },
];

export const SelectBudgetOptions = [
  {
    id: 1,
    title: "Cheap",
    desc: "Stay conscious of costs",
    icon: "💵",
  },
  {
    id: 2,
    title: "Moderate",
    desc: "Keep costs on the average side",
    icon: "💰",
  },
  {
    id: 3,
    title: "Luxury",
    desc: "Don't worry about the cost",
    icon: "💸",
  },
];

export const SelectInterestOptions = [
  { id: "culture", title: "Culture & History", icon: "🏛️" },
  { id: "food", title: "Food & Drinks", icon: "🍜" },
  { id: "nature", title: "Nature & Outdoors", icon: "🌿" },
  { id: "adventure", title: "Adventure", icon: "🧗" },
  { id: "beaches", title: "Beaches", icon: "🏖️" },
  { id: "shopping", title: "Shopping", icon: "🛍️" },
  { id: "nightlife", title: "Nightlife", icon: "🌃" },
  { id: "art", title: "Art & Museums", icon: "🎨" },
  { id: "relax", title: "Relax & Wellness", icon: "🧘" },
  { id: "hidden", title: "Hidden Gems", icon: "💎" },
];

export const MIN_DAYS = 1;
export const MAX_DAYS = 10;

export const AI_PROMPT =
  "Generate a travel plan for Location: {location}, for {totalDays} days for {traveler} with a {budget} budget. " +
  "{interests}" +
  "Give 3–4 hotel options with hotel name, address, price per night, accurate geo coordinates, rating and a short description. " +
  "Then give an itinerary for exactly {totalDays} days. Each day has a short theme and 3–5 places in visiting order, " +
  "each with place name, details, accurate geo coordinates, ticket pricing, rating, travel time from the previous stop " +
  "and the best time of day to visit. Also include a short trip summary, the best season to visit, an estimated total cost " +
  "and up to 5 practical local travel tips.";

export function buildPrompt({ location, days, traveler, budget, interests }) {
  const interestText = interests?.length
    ? `The travellers are especially interested in: ${interests.join(", ")}. `
    : "";
  return AI_PROMPT.replaceAll("{location}", location)
    .replaceAll("{totalDays}", String(days))
    .replace("{traveler}", traveler)
    .replace("{budget}", budget)
    .replace("{interests}", interestText);
}
