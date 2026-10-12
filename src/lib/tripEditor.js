// Pure, immutable edit operations on a stored `tripData` object
// ({ hotelOptions: [...], itinerary: [{ day, theme, plan: [...] }], ... }).
// Every stop, day and hotel gets a stable `uid` so edits survive reordering.

const newId = () => crypto.randomUUID().slice(0, 8);

function toItineraryArray(itinerary) {
  if (Array.isArray(itinerary)) return itinerary;
  if (!itinerary || typeof itinerary !== "object") return [];
  return Object.keys(itinerary)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((key) => itinerary[key]);
}

const renumber = (days) => days.map((day, i) => ({ ...day, day: i + 1 }));

/** Adds stable ids and normalises legacy shapes. Call once before editing. */
export function withIds(tripData = {}) {
  return {
    ...tripData,
    hotelOptions: (tripData.hotelOptions ?? tripData.hotels ?? []).map((h) => (h.uid ? h : { ...h, uid: newId() })),
    itinerary: renumber(
      toItineraryArray(tripData.itinerary ?? tripData.dailyPlan).map((day) => ({
        ...day,
        uid: day.uid ?? newId(),
        plan: (day.plan ?? day.places ?? day.activities ?? []).map((p) => (p.uid ? p : { ...p, uid: newId() })),
      }))
    ),
  };
}

function locate(tripData, uid) {
  for (let d = 0; d < tripData.itinerary.length; d++) {
    const s = tripData.itinerary[d].plan.findIndex((p) => p.uid === uid);
    if (s >= 0) return { d, s };
  }
  return null;
}

function updateDays(tripData, fn) {
  return { ...tripData, itinerary: renumber(fn(tripData.itinerary.map((day) => ({ ...day, plan: [...day.plan] })))) };
}

/** Moves a stop up (-1) or down (+1); crosses into the previous/next day at the edges. */
export function moveStop(tripData, uid, delta) {
  const pos = locate(tripData, uid);
  if (!pos) return tripData;
  return updateDays(tripData, (days) => {
    const { d, s } = pos;
    const plan = days[d].plan;
    const target = s + delta;
    if (target >= 0 && target < plan.length) {
      [plan[s], plan[target]] = [plan[target], plan[s]];
    } else if (target < 0 && d > 0) {
      days[d - 1].plan.push(plan.splice(s, 1)[0]);
    } else if (target >= plan.length && d < days.length - 1) {
      days[d + 1].plan.unshift(plan.splice(s, 1)[0]);
    }
    return days;
  });
}

export function moveStopToDay(tripData, uid, toDayIndex) {
  const pos = locate(tripData, uid);
  if (!pos || pos.d === toDayIndex) return tripData;
  return updateDays(tripData, (days) => {
    const [stop] = days[pos.d].plan.splice(pos.s, 1);
    days[toDayIndex].plan.push(stop);
    return days;
  });
}

export function updateStop(tripData, uid, patch) {
  const pos = locate(tripData, uid);
  if (!pos) return tripData;
  return updateDays(tripData, (days) => {
    days[pos.d].plan[pos.s] = { ...days[pos.d].plan[pos.s], ...patch };
    return days;
  });
}

export function removeStop(tripData, uid) {
  const pos = locate(tripData, uid);
  if (!pos) return tripData;
  return updateDays(tripData, (days) => {
    days[pos.d].plan.splice(pos.s, 1);
    return days;
  });
}

export function addStop(tripData, dayIndex, stop) {
  return updateDays(tripData, (days) => {
    days[dayIndex].plan.push({ ...stop, uid: newId(), custom: true });
    return days;
  });
}

export function addDay(tripData) {
  return updateDays(tripData, (days) => [...days, { uid: newId(), theme: "", plan: [] }]);
}

export function removeDay(tripData, dayIndex) {
  return updateDays(tripData, (days) => days.filter((_, i) => i !== dayIndex));
}

export function setDayTheme(tripData, dayIndex, theme) {
  return updateDays(tripData, (days) => {
    days[dayIndex] = { ...days[dayIndex], theme };
    return days;
  });
}

/** Replaces a day's theme and stops (e.g. with an AI-regenerated plan). */
export function replaceDay(tripData, dayIndex, { theme, plan }) {
  return updateDays(tripData, (days) => {
    days[dayIndex] = { ...days[dayIndex], theme, plan: plan.map((p) => ({ ...p, uid: newId() })) };
    return days;
  });
}

export function addHotel(tripData, hotel) {
  return { ...tripData, hotelOptions: [...tripData.hotelOptions, { ...hotel, uid: newId(), custom: true }] };
}

export function updateHotel(tripData, uid, patch) {
  return { ...tripData, hotelOptions: tripData.hotelOptions.map((h) => (h.uid === uid ? { ...h, ...patch } : h)) };
}

export function removeHotel(tripData, uid) {
  return { ...tripData, hotelOptions: tripData.hotelOptions.filter((h) => h.uid !== uid) };
}

export function findStop(tripData, uid) {
  const pos = locate(tripData, uid);
  return pos ? tripData.itinerary[pos.d].plan[pos.s] : null;
}

export function findHotel(tripData, uid) {
  return tripData.hotelOptions.find((h) => h.uid === uid) ?? null;
}
