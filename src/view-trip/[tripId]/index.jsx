import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Compass, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import InfoSection from "@/components/component/InfoSection";
import Hotels from "@/components/component/Hotels";
import PlacesToVisit from "@/components/component/PlacesToVisit";
import TripMap from "@/components/component/TripMap";
import DayTabs from "@/components/component/DayTabs";
import { getTrip } from "@/service/tripStore";
import { normalizeTrip } from "@/lib/trip";

function TripSkeleton() {
  return (
    <div className="container py-8">
      <div className="skeleton h-[300px] rounded-3xl md:h-[400px]" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-4">
          <div className="skeleton h-32 rounded-2xl" />
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="skeleton h-72 rounded-2xl" />
            <div className="skeleton h-72 rounded-2xl" />
          </div>
        </div>
        <div className="skeleton hidden h-[500px] rounded-2xl lg:block" />
      </div>
    </div>
  );
}

function TripNotFound() {
  return (
    <div className="container grid min-h-[60vh] place-items-center py-16 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Compass className="h-8 w-8" />
        </span>
        <h1 className="mt-6 text-2xl font-bold">We couldn&apos;t find this trip</h1>
        <p className="mt-2 text-muted-foreground">
          It may have been deleted, or it was saved in another browser.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/my-trips"><ArrowLeft /> My trips</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link to="/create-trip"><Plus /> Plan a new trip</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Viewtrip() {
  const { tripId } = useParams();
  const [state, setState] = useState({ status: "loading", trip: null });
  const [activeDay, setActiveDay] = useState("all");
  const [focus, setFocus] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    let active = true;
    setState({ status: "loading", trip: null });
    setActiveDay("all");
    getTrip(tripId)
      .then((raw) => active && setState(raw ? { status: "ready", trip: normalizeTrip(raw) } : { status: "missing" }))
      .catch((error) => {
        console.error(error);
        if (active) setState({ status: "missing" });
      });
    return () => {
      active = false;
    };
  }, [tripId]);

  const showOnMap = useCallback((item) => {
    if (item.dayIndex !== undefined) {
      setActiveDay((current) => (current === "all" || current === item.dayIndex ? current : item.dayIndex));
    }
    setFocus({ key: item.key, coords: item.coords, at: Date.now() });
    // On small screens the map sits above the content; bring it into view.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      mapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  if (state.status === "loading") return <TripSkeleton />;
  if (state.status === "missing") return <TripNotFound />;

  const { trip } = state;

  return (
    <div className="container py-8">
      <InfoSection trip={trip} />

      <div className="mt-2 grid items-start gap-x-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <div className="order-2 lg:order-1">
          <Hotels trip={trip} onShowOnMap={showOnMap} />
          <PlacesToVisit trip={trip} activeDay={activeDay} onDayChange={setActiveDay} onShowOnMap={showOnMap} />
        </div>

        <div ref={mapRef} className="order-1 mt-12 lg:sticky lg:top-24 lg:order-2 print:hidden">
          <div className="relative">
            <TripMap
              trip={trip}
              activeDay={activeDay}
              focus={focus}
              className="h-[380px] lg:h-[calc(100vh-8rem)]"
            />
            {trip.days.length > 1 && (
              <div className="pointer-events-none absolute inset-x-3 top-3 z-[500] flex justify-end">
                <DayTabs
                  days={trip.days}
                  value={activeDay}
                  onChange={setActiveDay}
                  size="sm"
                  className="pointer-events-auto max-w-full rounded-full bg-card/90 p-1 shadow-soft backdrop-blur"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Viewtrip;
