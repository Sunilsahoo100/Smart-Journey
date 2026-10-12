import {
  ArrowDown,
  ArrowUp,
  Car,
  Clock,
  ExternalLink,
  Landmark,
  Navigation,
  Pencil,
  Star,
  StickyNote,
  Ticket,
  Trash2,
  UserRound,
} from "lucide-react";
import PlaceImage from "@/components/custom/PlaceImage";
import { googleMapsDirectionsUrl } from "@/service/GlobalApi";
import { cn } from "@/lib/utils";

function IconButton({ label, onClick, disabled, danger, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full border bg-card text-foreground/70 transition disabled:pointer-events-none disabled:opacity-35",
        danger ? "hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive" : "hover:border-primary/40 hover:text-primary"
      )}
    >
      {children}
    </button>
  );
}

function PlaceCardItem({ place, locationName, onShowOnMap, editing, editor, days, canMoveUp, canMoveDown }) {
  return (
    <article
      className={cn(
        "card-surface flex flex-col gap-4 p-3 transition sm:flex-row",
        editing ? "ring-1 ring-primary/15" : "hover:shadow-lift"
      )}
    >
      <PlaceImage
        name={place.name}
        context={locationName}
        size={500}
        icon={Landmark}
        className="h-44 w-full shrink-0 rounded-xl sm:h-auto sm:min-h-36 sm:w-40"
      />
      <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {place.time && (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-coral">
              <Clock className="h-3.5 w-3.5" /> {place.time}
            </p>
          )}
          {place.custom && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              <UserRound className="h-3 w-3" /> Added by you
            </span>
          )}
        </div>
        <h4 className="mt-1 text-lg font-bold leading-snug">{place.name}</h4>
        {place.details && <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{place.details}</p>}

        <div className="mt-3 flex flex-wrap gap-2">
          {place.ticket && (
            <span className="chip"><Ticket className="h-3.5 w-3.5 text-primary" /> {place.ticket}</span>
          )}
          {place.rating > 0 && (
            <span className="chip"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {place.rating.toFixed(1)}</span>
          )}
          {place.travelTime && (
            <span className="chip"><Car className="h-3.5 w-3.5 text-primary" /> {place.travelTime}</span>
          )}
        </div>

        {place.notes && (
          <p className="mt-3 flex gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            <StickyNote className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="whitespace-pre-line">{place.notes}</span>
          </p>
        )}

        {editing ? (
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
            <IconButton label="Move up" disabled={!canMoveUp} onClick={() => editor.moveStop(place.uid, -1)}>
              <ArrowUp className="h-4 w-4" />
            </IconButton>
            <IconButton label="Move down" disabled={!canMoveDown} onClick={() => editor.moveStop(place.uid, 1)}>
              <ArrowDown className="h-4 w-4" />
            </IconButton>
            {days.length > 1 && (
              <select
                aria-label="Move to another day"
                value={place.dayIndex}
                onChange={(e) => editor.moveStopToDay(place.uid, Number(e.target.value))}
                className="h-8 rounded-full border bg-card px-3 text-xs font-semibold outline-none transition hover:border-primary/40 focus:border-primary"
              >
                {days.map((d) => (
                  <option key={d.dayIndex} value={d.dayIndex}>
                    {d.dayIndex === place.dayIndex ? `Day ${d.day}` : `Move to Day ${d.day}`}
                  </option>
                ))}
              </select>
            )}
            <span className="flex-1" />
            <IconButton label="Edit stop" onClick={() => editor.editStop(place.uid, place.dayIndex)}>
              <Pencil className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton label="Remove stop" danger onClick={() => editor.removeStop(place.uid)}>
              <Trash2 className="h-3.5 w-3.5" />
            </IconButton>
          </div>
        ) : (
          <div className="mt-auto flex flex-wrap gap-2 pt-3 print:hidden">
            {place.coords && (
              <button
                type="button"
                onClick={() => onShowOnMap(place)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/15"
              >
                <Navigation className="h-3.5 w-3.5" /> Show on map
              </button>
            )}
            <a
              href={googleMapsDirectionsUrl(place.name, locationName)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:border-primary/40 hover:text-primary"
            >
              Directions <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </article>
  );
}

export default PlaceCardItem;
