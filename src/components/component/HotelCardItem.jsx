import { BedDouble, ExternalLink, MapPin, Navigation, Pencil, Star, StickyNote, Trash2, UserRound } from "lucide-react";
import PlaceImage from "@/components/custom/PlaceImage";
import { bookingSearchUrl, googleMapsSearchUrl } from "@/service/GlobalApi";

function HotelCardItem({ hotel, locationName, onShowOnMap, editing, editor }) {
  return (
    <article className="card-surface group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
      <PlaceImage name={hotel.name} context={locationName} size={700} icon={BedDouble} className="h-44">
        {hotel.rating > 0 && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 text-xs font-bold text-card-foreground shadow">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {hotel.rating.toFixed(1)}
          </span>
        )}
        {hotel.custom && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow">
            <UserRound className="h-3 w-3" /> Added by you
          </span>
        )}
        {hotel.price && (
          <span className="absolute bottom-3 right-3 max-w-[80%] truncate rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {hotel.price}
          </span>
        )}
      </PlaceImage>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-bold leading-snug">{hotel.name}</h3>
        {hotel.address && (
          <p className="mt-1 flex gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {hotel.address}
          </p>
        )}
        {hotel.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{hotel.description}</p>}
        {hotel.notes && (
          <p className="mt-3 flex gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            <StickyNote className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="whitespace-pre-line">{hotel.notes}</span>
          </p>
        )}

        {editing ? (
          <div className="mt-auto flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => editor.editHotel(hotel.uid)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:border-primary/40 hover:text-primary"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              type="button"
              onClick={() => editor.removeHotel(hotel.uid)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        ) : (
        <div className="mt-auto flex flex-wrap gap-2 pt-4 print:hidden">
          {hotel.coords && (
            <button
              type="button"
              onClick={() => onShowOnMap(hotel)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/15"
            >
              <Navigation className="h-3.5 w-3.5" /> Show on map
            </button>
          )}
          <a
            href={bookingSearchUrl(hotel.name, locationName)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:border-primary/40 hover:text-primary"
          >
            Check prices <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href={googleMapsSearchUrl(hotel.name, hotel.address || locationName)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:border-primary/40 hover:text-primary"
          >
            Google Maps <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        )}
      </div>
    </article>
  );
}

export default HotelCardItem;
