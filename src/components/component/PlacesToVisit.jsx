import { CalendarDays, CalendarPlus, MapPinPlus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dayColor } from "@/lib/trip";
import PlaceCardItem from "./PlaceCardItem";
import DayTabs from "./DayTabs";

function PlacesToVisit({ trip, activeDay, onDayChange, onShowOnMap, editing, editor }) {
  const days = trip.days.filter((d) => activeDay === "all" || d.dayIndex === activeDay);
  const lastDayIndex = trip.days.length - 1;

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <CalendarDays className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your itinerary</h2>
          <p className="text-sm text-muted-foreground">
            {editing ? "Reorder, edit or re-plan each day" : "Day-by-day plan with the best time to visit each stop"}
          </p>
        </div>
      </div>

      <DayTabs days={trip.days} value={activeDay} onChange={onDayChange} className="mt-6 print:hidden" />

      <div className="mt-6 space-y-10">
        {days.map((day) => (
          <div key={day.uid ?? day.dayIndex}>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="shrink-0 rounded-full px-3 py-1 text-sm font-bold text-white"
                style={{ background: dayColor(day.dayIndex) }}
              >
                Day {day.day}
              </span>
              {editing ? (
                <>
                  <input
                    aria-label={`Day ${day.day} title`}
                    value={day.theme}
                    placeholder="Add a title for this day"
                    onChange={(e) => editor.setDayTheme(day.dayIndex, e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-lg font-bold outline-none transition placeholder:font-medium placeholder:text-muted-foreground hover:border-border focus:border-primary"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => editor.regenerateDay(day.dayIndex)}>
                      <Sparkles className="text-primary" /> Re-plan with AI
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      disabled={trip.days.length <= 1}
                      onClick={() => editor.removeDay(day.dayIndex)}
                      aria-label={`Remove day ${day.day}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </>
              ) : (
                day.theme && <h3 className="text-lg font-bold">{day.theme}</h3>
              )}
            </div>

            <ol className="relative mt-5 space-y-5 pl-10">
              {day.places.length > 0 && (
                <span
                  aria-hidden
                  className="absolute bottom-4 left-[13px] top-4 w-0.5 rounded-full opacity-30"
                  style={{ background: dayColor(day.dayIndex) }}
                />
              )}
              {day.places.map((place, i) => (
                <li key={place.key} className="relative">
                  <span
                    className="absolute -left-10 top-5 grid h-7 w-7 place-items-center rounded-full border-[3px] border-background text-xs font-bold text-white shadow"
                    style={{ background: dayColor(day.dayIndex) }}
                  >
                    {place.order}
                  </span>
                  <PlaceCardItem
                    place={place}
                    locationName={trip.location.name}
                    onShowOnMap={onShowOnMap}
                    editing={editing}
                    editor={editor}
                    days={trip.days}
                    canMoveUp={i > 0 || day.dayIndex > 0}
                    canMoveDown={i < day.places.length - 1 || day.dayIndex < lastDayIndex}
                  />
                </li>
              ))}
              {!day.places.length && (
                <li className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No stops planned for this day yet.
                </li>
              )}
            </ol>

            {editing && (
              <button
                type="button"
                onClick={() => editor.addStop(day.dayIndex)}
                className="ml-10 mt-4 flex w-[calc(100%-2.5rem)] items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-3 text-sm font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-primary"
              >
                <MapPinPlus className="h-4 w-4" /> Add a stop to Day {day.day}
              </button>
            )}
          </div>
        ))}

        {editing && activeDay === "all" && (
          <button
            type="button"
            onClick={editor.addDay}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-4 font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-primary"
          >
            <CalendarPlus className="h-5 w-5" /> Add another day
          </button>
        )}
      </div>
    </section>
  );
}

export default PlacesToVisit;
