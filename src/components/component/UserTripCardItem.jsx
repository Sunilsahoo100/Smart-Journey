import { Link } from "react-router-dom";
import { CalendarDays, Trash2, Users, Wallet } from "lucide-react";
import PlaceImage from "@/components/custom/PlaceImage";
import { cleanPlaceName, formatDate } from "@/lib/trip";

function UserTripCardItem({ trip, onDelete }) {
  const location = trip.userSelection?.location ?? {};
  const label = (location.label ?? "Trip").split(",").map((part) => cleanPlaceName(part.trim())).join(", ");
  const name = cleanPlaceName(location.name) || label.split(",")[0].trim();
  const country = label.split(",").at(-1)?.trim();
  const days = trip.userSelection?.noOfDays;
  const created = formatDate(trip.createdAt ?? Number(trip.id));

  return (
    <article className="group relative">
      <Link
        to={`/view-trip/${trip.id}`}
        className="card-surface block overflow-hidden transition hover:-translate-y-1 hover:shadow-lift focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
      >
        <PlaceImage name={name} context={country !== name ? country : ""} size={800} className="aspect-[16/10]">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {days && (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1 text-xs font-bold text-card-foreground shadow">
              <CalendarDays className="h-3.5 w-3.5 text-primary" /> {days} {Number(days) === 1 ? "day" : "days"}
            </span>
          )}
        </PlaceImage>
        <div className="p-4">
          <h3 className="truncate text-lg font-bold">{label}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {trip.userSelection?.budget && (
              <span className="flex items-center gap-1.5"><Wallet className="h-4 w-4" /> {trip.userSelection.budget}</span>
            )}
            {trip.userSelection?.traveler && (
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {trip.userSelection.traveler}</span>
            )}
          </div>
          {created && <p className="mt-3 text-xs text-muted-foreground">Created {created}</p>}
        </div>
      </Link>

      <button
        type="button"
        aria-label={`Delete trip to ${label}`}
        onClick={() => onDelete(trip)}
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-card/90 text-foreground/70 opacity-100 shadow transition hover:bg-destructive hover:text-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </article>
  );
}

export default UserTripCardItem;
