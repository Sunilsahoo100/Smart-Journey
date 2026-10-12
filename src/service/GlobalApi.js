import { cleanPlaceName } from "@/lib/trip";

// Free, key-less APIs used across the app:
//  - Photon (OpenStreetMap data, by Komoot) for destination autocomplete
//  - Wikipedia for place photos
// Google Maps "search" links are plain URLs and need no API key either.

const PHOTON_URL = "https://photon.komoot.io/api/";
const WIKI_API_URL = "https://en.wikipedia.org/w/api.php";

const DESTINATION_LAYERS = ["city", "locality", "county", "state", "country"];

function formatPhotonFeature(feature) {
  const p = feature.properties ?? {};
  const [lon, lat] = feature.geometry?.coordinates ?? [];
  const name = cleanPlaceName(p.name ?? p.city ?? p.state ?? p.country ?? "");
  const parts = [name, p.state, p.country].filter(
    (part, i, all) => part && all.indexOf(part) === i
  );
  return {
    id: `${p.osm_type ?? ""}${p.osm_id ?? Math.random()}`,
    name,
    label: parts.join(", "),
    country: p.country ?? "",
    type: p.type ?? p.osm_value ?? "place",
    lat,
    lon,
  };
}

/** Search cities / regions / countries by name (OpenStreetMap via Photon). */
export async function searchDestinations(query, { signal } = {}) {
  const q = query.trim();
  if (q.length < 2) return [];
  const params = new URLSearchParams({ q, limit: "12", lang: "en" });
  DESTINATION_LAYERS.forEach((layer) => params.append("layer", layer));

  const res = await fetch(`${PHOTON_URL}?${params}`, { signal });
  if (!res.ok) throw new Error(`Place search failed (${res.status})`);
  const data = await res.json();

  const seen = new Set();
  return (data.features ?? [])
    // Keep real places; drop industrial sites, depots, etc. that share a layer.
    .filter((f) => ["place", "boundary"].includes(f.properties?.osm_key))
    .map(formatPhotonFeature)
    .filter((place) => {
      if (!place.name || seen.has(place.label)) return false;
      seen.add(place.label);
      return true;
    })
    .slice(0, 7);
}

/**
 * Search any place — attractions, restaurants, hotels, streets — biased
 * towards `near` ({ lat, lng }) so results around the trip come first.
 */
export async function searchPlacesNear(query, { near, signal } = {}) {
  const q = query.trim();
  if (q.length < 2) return [];
  const params = new URLSearchParams({ q, limit: "8", lang: "en" });
  if (near) {
    params.set("lat", String(near.lat));
    params.set("lon", String(near.lng));
    params.set("zoom", "12"); // favour results within roughly a city's reach
    params.set("location_bias_scale", "0.1");
  }

  const res = await fetch(`${PHOTON_URL}?${params}`, { signal });
  if (!res.ok) throw new Error(`Place search failed (${res.status})`);
  const data = await res.json();

  const seen = new Set();
  return (data.features ?? [])
    .map((feature) => {
      const p = feature.properties ?? {};
      const [lon, lat] = feature.geometry?.coordinates ?? [];
      const name = p.name ?? p.street ?? p.city ?? "";
      const street = p.street ? [p.housenumber, p.street].filter(Boolean).join(" ") : "";
      const parts = [name, street, p.city ?? p.county, p.country].filter(
        (part, i, all) => part && all.indexOf(part) === i
      );
      return {
        id: `${p.osm_type ?? ""}${p.osm_id ?? Math.random()}`,
        name,
        label: parts.join(", "),
        country: p.country ?? "",
        type: (p.osm_value ?? p.type ?? "place").replaceAll("_", " "),
        lat,
        lon,
      };
    })
    .filter((place) => {
      if (!place.name || seen.has(place.label)) return false;
      seen.add(place.label);
      return true;
    });
}

// ---------------------------------------------------------------------------
// Place photos (Wikipedia)
// ---------------------------------------------------------------------------

const PHOTO_CACHE_KEY = "sj:photo-cache:v1";
const photoCache = new Map(loadPhotoCache());
const inFlight = new Map();

function loadPhotoCache() {
  try {
    return Object.entries(JSON.parse(sessionStorage.getItem(PHOTO_CACHE_KEY)) ?? {});
  } catch {
    return [];
  }
}

function persistPhotoCache() {
  try {
    sessionStorage.setItem(
      PHOTO_CACHE_KEY,
      JSON.stringify(Object.fromEntries([...photoCache].slice(-300)))
    );
  } catch {
    // sessionStorage may be full or unavailable – caching is best effort.
  }
}

const GENERIC_WORDS = new Set([
  "the", "and", "for", "with", "near", "from", "into", "local", "visit", "explore",
  "hotel", "hotels", "resort", "inn", "suites", "stay", "lodge", "hostel",
  "restaurant", "restaurants", "cafe", "dinner", "lunch", "breakfast", "food",
  "street", "market", "area", "city", "tour", "trip", "walk", "evening", "morning",
]);

function keywords(text) {
  return (text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !GENERIC_WORDS.has(w));
}

async function wikiSearchImages(search, size) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrsearch: search,
    gsrlimit: "5",
    gsrnamespace: "0",
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: String(size),
  });
  const res = await fetch(`${WIKI_API_URL}?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Object.values(data?.query?.pages ?? {}).sort((a, b) => a.index - b.index);
}

async function findPhoto(name, context, size) {
  const required = keywords(name);
  if (!required.length) return null; // too generic ("Lunch at a local restaurant")

  const searches = context ? [`${name} ${context}`, name] : [name];
  for (const search of searches) {
    const pages = await wikiSearchImages(search, size);
    const match = pages.find((page) => {
      const src = page.thumbnail?.source;
      if (!src || /\.svg/i.test(src)) return false; // skip flags, maps and logos
      const title = keywords(page.title);
      return required.some((word) => title.includes(word));
    });
    if (match) return match.thumbnail.source;
  }
  return null;
}

/**
 * Returns a photo URL for a place (or null). `context` (e.g. the city) helps
 * disambiguate the search. Results are cached for the browser session.
 */
export function getPlacePhoto(name, { context = "", size = 800 } = {}) {
  if (!name) return Promise.resolve(null);
  const key = `${name}|${context}|${size}`;
  if (photoCache.has(key)) return Promise.resolve(photoCache.get(key));
  if (inFlight.has(key)) return inFlight.get(key);

  const promise = findPhoto(name, context, size)
    .catch(() => null)
    .then((url) => {
      photoCache.set(key, url);
      persistPhotoCache();
      inFlight.delete(key);
      return url;
    });
  inFlight.set(key, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// Outbound links (no API key needed)
// ---------------------------------------------------------------------------

export function googleMapsSearchUrl(...parts) {
  const query = parts.filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function googleMapsDirectionsUrl(...parts) {
  const destination = parts.filter(Boolean).join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export function bookingSearchUrl(hotelName, location) {
  const query = [hotelName, location].filter(Boolean).join(", ");
  return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(query)}`;
}
