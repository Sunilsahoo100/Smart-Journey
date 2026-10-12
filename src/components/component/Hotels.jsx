import { BedDouble, Plus } from "lucide-react";
import HotelCardItem from "./HotelCardItem";

function Hotels({ trip, onShowOnMap, editing, editor }) {
  if (!trip.hotels.length && !editing) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-coral/10 text-coral">
          <BedDouble className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Where to stay</h2>
          <p className="text-sm text-muted-foreground">Hand-picked for a {trip.budget?.toLowerCase() || "great"} budget</p>
        </div>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {trip.hotels.map((hotel) => (
          <HotelCardItem
            key={hotel.key}
            hotel={hotel}
            locationName={trip.location.name}
            onShowOnMap={onShowOnMap}
            editing={editing}
            editor={editor}
          />
        ))}
        {editing && (
          <button
            type="button"
            onClick={editor.addHotel}
            className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-sm font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-primary"
          >
            <Plus className="h-6 w-6" /> Add your own hotel
          </button>
        )}
      </div>
    </section>
  );
}

export default Hotels;
