import { useCallback, useState } from "react";
import { MapPin, MapPinOff } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DestinationSearch from "@/components/custom/DestinationSearch";
import { searchPlacesNear } from "@/service/GlobalApi";
import { parseCoordinates } from "@/lib/trip";

// Form fields per item type, mapped to the stored trip format.
const FIELDS = {
  stop: [
    { name: "placeName", label: "Place name", required: true, placeholder: "e.g. Lingaraj Temple" },
    { name: "time", label: "When", placeholder: "e.g. Morning (9:00 AM – 11:00 AM)" },
    { name: "placeDetails", label: "Details", textarea: true, placeholder: "What to see or do here" },
    { name: "ticketPricing", label: "Ticket price", placeholder: "e.g. Free / ₹50" },
    { name: "timeTravel", label: "Travel time from previous stop", placeholder: "e.g. 15 min by auto" },
    { name: "userNotes", label: "Your notes", textarea: true, placeholder: "Reminders, bookings, things to pack…" },
  ],
  hotel: [
    { name: "hotelName", label: "Hotel name", required: true, placeholder: "e.g. Mayfair Lagoon" },
    { name: "hotelAddress", label: "Address" },
    { name: "price", label: "Price per night", placeholder: "e.g. ₹6,000 per night" },
    { name: "description", label: "Description", textarea: true },
    { name: "userNotes", label: "Your notes", textarea: true, placeholder: "Booking reference, check-in time…" },
  ],
};

/** Add or edit a stop / hotel. `initial` is the stored item (or null to add). */
function ItemDialog({ kind, initial, near, dayLabel, onSave, onOpenChange }) {
  const fields = FIELDS[kind];
  const [form, setForm] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.name, initial?.[f.name] ?? ""]))
  );
  const [coords, setCoords] = useState(() => parseCoordinates(initial?.geoCoordinates));
  const [picked, setPicked] = useState(null);

  const search = useCallback((query, options) => searchPlacesNear(query, { ...options, near }), [near]);

  const nameField = fields[0].name;
  const isEdit = Boolean(initial);
  const noun = kind === "stop" ? "stop" : "hotel";

  const onPick = (place) => {
    setPicked(place);
    if (!place) return;
    setCoords({ lat: place.lat, lng: place.lon });
    setForm((current) => ({
      ...current,
      [nameField]: place.name,
      ...(kind === "hotel" ? { hotelAddress: place.label.split(", ").slice(1).join(", ") } : {}),
    }));
  };

  const submit = (e) => {
    e.preventDefault();
    const values = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, String(v).trim()]));
    onSave({
      ...values,
      geoCoordinates: coords ? { latitude: coords.lat, longitude: coords.lng } : null,
    });
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${noun}` : `Add a ${noun}`}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the details below." : `Search for a real place to pin it on the map${dayLabel ? ` · ${dayLabel}` : ""}.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Find on map</label>
            <DestinationSearch
              value={picked}
              onChange={onPick}
              search={search}
              placeholder={kind === "stop" ? "Search attractions, restaurants…" : "Search hotels…"}
              inputClassName="h-11 rounded-xl text-sm shadow-none"
            />
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              {coords ? (
                <><MapPin className="h-3.5 w-3.5 text-primary" /> Pinned on the map</>
              ) : (
                <><MapPinOff className="h-3.5 w-3.5" /> Not on the map yet — pick a search result to pin it</>
              )}
            </p>
          </div>

          {fields.map((field) => (
            <div key={field.name}>
              <label htmlFor={`f-${field.name}`} className="mb-1.5 block text-sm font-semibold">
                {field.label}
                {field.required && <span className="text-coral"> *</span>}
              </label>
              {field.textarea ? (
                <Textarea
                  id={`f-${field.name}`}
                  rows={field.name === "userNotes" ? 2 : 3}
                  value={form[field.name]}
                  placeholder={field.placeholder}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  className="rounded-xl"
                />
              ) : (
                <Input
                  id={`f-${field.name}`}
                  required={field.required}
                  value={form[field.name]}
                  placeholder={field.placeholder}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  className="h-11 rounded-xl"
                />
              )}
            </div>
          ))}

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!String(form[nameField]).trim()}>
              {isEdit ? "Save" : `Add ${noun}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ItemDialog;
