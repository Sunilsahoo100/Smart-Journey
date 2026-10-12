import { CalendarDays } from "lucide-react";
import { dayColor } from "@/lib/trip";
import PlaceCardItem from "./PlaceCardItem";
import DayTabs from "./DayTabs";

function PlacesToVisit({ trip, activeDay, onDayChange, onShowOnMap }) {
  const days = trip.days.filter((d) => activeDay === "all" || d.dayIndex === activeDay);

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <CalendarDays className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your itinerary</h2>
          <p className="text-sm text-muted-foreground">Day-by-day plan with the best time to visit each stop</p>
        </div>
      </div>

      <DayTabs days={trip.days} value={activeDay} onChange={onDayChange} className="mt-6 print:hidden" />

      <div className="mt-6 space-y-10">
        {days.map((day) => (
          <div key={day.dayIndex}>
            <div className="flex items-baseline gap-3">
              <span
                className="rounded-full px-3 py-1 text-sm font-bold text-white"
                style={{ background: dayColor(day.dayIndex) }}
              >
                Day {day.day}
              </span>
              {day.theme && <h3 className="text-lg font-bold">{day.theme}</h3>}
            </div>

            <ol className="relative mt-5 space-y-5 pl-10">
              <span
                aria-hidden
                className="absolute bottom-4 left-[13px] top-4 w-0.5 rounded-full opacity-30"
                style={{ background: dayColor(day.dayIndex) }}
              />
              {day.places.map((place) => (
                <li key={place.key} className="relative">
                  <span
                    className="absolute -left-10 top-5 grid h-7 w-7 place-items-center rounded-full border-[3px] border-background text-xs font-bold text-white shadow"
                    style={{ background: dayColor(day.dayIndex) }}
                  >
                    {place.order}
                  </span>
                  <PlaceCardItem place={place} locationName={trip.location.name} onShowOnMap={onShowOnMap} />
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}

export default PlacesToVisit;
