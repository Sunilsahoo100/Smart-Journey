import { Car, Clock, ExternalLink, Landmark, Navigation, Star, Ticket } from "lucide-react";
import PlaceImage from "@/components/custom/PlaceImage";
import { googleMapsDirectionsUrl } from "@/service/GlobalApi";

function PlaceCardItem({ place, locationName, onShowOnMap }) {
  return (
    <article className="card-surface flex flex-col gap-4 p-3 transition hover:shadow-lift sm:flex-row">
      <PlaceImage
        name={place.name}
        context={locationName}
        size={500}
        icon={Landmark}
        className="h-44 w-full shrink-0 rounded-xl sm:h-auto sm:min-h-36 sm:w-40"
      />
      <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
        {place.time && (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-coral">
            <Clock className="h-3.5 w-3.5" /> {place.time}
          </p>
        )}
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
      </div>
    </article>
  );
}

export default PlaceCardItem;
