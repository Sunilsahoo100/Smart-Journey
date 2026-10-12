import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPinOff } from "lucide-react";
import { googleMapsSearchUrl } from "@/service/GlobalApi";
import { HOTEL_COLOR, dayColor } from "@/lib/trip";
import { cn } from "@/lib/utils";

// Official OpenStreetMap tiles: free, open data, no API key. Attribution is required.
// See https://operations.osmfoundation.org/policies/tiles/ before heavy production use.
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const iconCache = new Map();
function pinIcon(label, color, hotel = false) {
  const key = `${label}|${color}|${hotel}`;
  if (!iconCache.has(key)) {
    iconCache.set(
      key,
      L.divIcon({
        className: "",
        html: `<div class="map-pin${hotel ? " map-pin--hotel" : ""}" style="--pin:${color};box-sizing:border-box"><span>${label}</span></div>`,
        iconSize: hotel ? [30, 30] : [32, 32],
        iconAnchor: hotel ? [15, 15] : [16, 38],
        popupAnchor: hotel ? [0, -16] : [0, -34],
      })
    );
  }
  return iconCache.get(key);
}

function FitBounds({ points, fallbackCenter }) {
  const map = useMap();
  const signature = points.map((p) => `${p.lat},${p.lng}`).join("|");

  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [48, 48], maxZoom: 15 });
    } else if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14);
    } else if (fallbackCenter) {
      map.setView([fallbackCenter.lat, fallbackCenter.lng], 11);
    }
    // Only refit when the set of points actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature]);

  return null;
}

function FocusOnMarker({ focus, markers }) {
  const map = useMap();
  useEffect(() => {
    if (!focus?.coords) return;
    map.flyTo([focus.coords.lat, focus.coords.lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
    const timer = setTimeout(() => markers.current[focus.key]?.openPopup(), 850);
    return () => clearTimeout(timer);
  }, [focus, map, markers]);
  return null;
}

function PopupBody({ title, subtitle, details, query }) {
  return (
    <div className="min-w-[180px] max-w-[240px]">
      {subtitle && <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{subtitle}</p>}
      <p className="text-sm font-bold text-foreground">{title}</p>
      {details && <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{details}</p>}
      <a
        href={googleMapsSearchUrl(...query)}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
      >
        Open in Google Maps →
      </a>
    </div>
  );
}

/**
 * Interactive trip map. `activeDay` is a day index, or "all".
 * `focus` = { key, coords } flies to and opens that marker.
 */
function TripMap({ trip, activeDay = "all", focus, interactive = true, showHotels = true, className }) {
  const markers = useRef({});

  const days = useMemo(
    () => (trip?.days ?? []).filter((d) => activeDay === "all" || d.dayIndex === activeDay),
    [trip, activeDay]
  );
  const hotels = useMemo(
    () => (showHotels ? (trip?.hotels ?? []).filter((h) => h.coords) : []),
    [trip, showHotels]
  );

  const points = useMemo(() => {
    const placePoints = days.flatMap((d) => d.places.filter((p) => p.coords).map((p) => p.coords));
    // When looking at a single day, frame that day's stops rather than every hotel.
    return placePoints.length && activeDay !== "all" ? placePoints : [...placePoints, ...hotels.map((h) => h.coords)];
  }, [days, hotels, activeDay]);

  const center = points[0] ?? trip?.location?.coords;

  if (!center) {
    return (
      <div className={cn("grid place-items-center rounded-2xl border bg-muted/60 text-center text-sm text-muted-foreground", className)}>
        <div className="flex flex-col items-center gap-2 p-6">
          <MapPinOff className="h-8 w-8" />
          No map coordinates for this trip.
        </div>
      </div>
    );
  }

  const label = trip?.location?.name;

  return (
    <div className={cn("relative isolate overflow-hidden rounded-2xl border shadow-soft", className)}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        scrollWheelZoom={false}
        dragging={interactive}
        zoomControl={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        keyboard={interactive}
        boxZoom={interactive}
        className="h-full w-full"
      >
        <TileLayer url={TILE_URL} attribution={ATTRIBUTION} maxZoom={19} />
        <FitBounds points={points} fallbackCenter={trip?.location?.coords} />
        {interactive && <FocusOnMarker focus={focus} markers={markers} />}

        {days.map((day) => {
          const path = day.places.filter((p) => p.coords).map((p) => [p.coords.lat, p.coords.lng]);
          return path.length > 1 ? (
            <Polyline
              key={`route-${day.dayIndex}`}
              positions={path}
              pathOptions={{ color: dayColor(day.dayIndex), weight: 3, opacity: 0.75, dashArray: "6 8" }}
            />
          ) : null;
        })}

        {hotels.map((hotel) => (
          <Marker
            key={hotel.key}
            position={[hotel.coords.lat, hotel.coords.lng]}
            icon={pinIcon("🏨", HOTEL_COLOR, true)}
            ref={(ref) => {
              markers.current[hotel.key] = ref;
            }}
          >
            {interactive && (
              <Popup>
                <PopupBody title={hotel.name} subtitle="Hotel" details={hotel.address} query={[hotel.name, hotel.address || label]} />
              </Popup>
            )}
          </Marker>
        ))}

        {days.flatMap((day) =>
          day.places
            .filter((p) => p.coords)
            .map((place) => (
              <Marker
                key={place.key}
                position={[place.coords.lat, place.coords.lng]}
                icon={pinIcon(place.order, dayColor(day.dayIndex))}
                ref={(ref) => {
                  markers.current[place.key] = ref;
                }}
              >
                {interactive && (
                  <Popup>
                    <PopupBody
                      title={place.name}
                      subtitle={`Day ${day.day} · Stop ${place.order}`}
                      details={place.time}
                      query={[place.name, label]}
                    />
                  </Popup>
                )}
              </Marker>
            ))
        )}
      </MapContainer>
    </div>
  );
}

export default TripMap;
