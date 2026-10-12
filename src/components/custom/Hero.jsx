import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BedDouble, CalendarDays, Clock, Map, Share2, Sparkles, Star, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import TripMap from "@/components/component/TripMap";
import { dayColor } from "@/lib/trip";
import DestinationSearch from "./DestinationSearch";
import PlaceImage from "./PlaceImage";

const place = (dayIndex, i, name, time, lat, lng) => ({
  key: `s${dayIndex}-${i}`,
  dayIndex,
  order: i + 1,
  name,
  time,
  coords: { lat, lng },
});

// A small hand-made sample so the hero shows a real, live map.
const SAMPLE_TRIP = {
  location: { name: "Paris", label: "Paris, France" },
  hotels: [{ key: "h1", name: "Hôtel Le Marais", coords: { lat: 48.8592, lng: 2.3622 } }],
  days: [
    {
      day: 1,
      dayIndex: 0,
      places: [
        place(0, 0, "Eiffel Tower", "9:00 AM", 48.8584, 2.2945),
        place(0, 1, "Arc de Triomphe", "12:30 PM", 48.8738, 2.295),
        place(0, 2, "Louvre Museum", "3:00 PM", 48.8606, 2.3376),
      ],
    },
    {
      day: 2,
      dayIndex: 1,
      places: [
        place(1, 0, "Notre-Dame", "9:30 AM", 48.853, 2.3499),
        place(1, 1, "Musée d'Orsay", "1:00 PM", 48.86, 2.3266),
        place(1, 2, "Sacré-Cœur", "6:00 PM", 48.8867, 2.3431),
      ],
    },
  ],
};

const DESTINATIONS = [
  { name: "Kyoto", country: "Japan" },
  { name: "Venice", country: "Italy" },
  { name: "Lisbon", country: "Portugal" },
  { name: "Jaipur", country: "India" },
  { name: "Cape Town", country: "South Africa" },
  { name: "Reykjavík", country: "Iceland" },
];

const STEPS = [
  { icon: Map, title: "Pick a destination", text: "Search any city, region or country in the world." },
  { icon: Wallet, title: "Set your style", text: "Choose days, budget, who's coming and what you love." },
  { icon: Sparkles, title: "Get your plan", text: "AI builds a day-by-day itinerary with hotels and a live map." },
];

const FEATURES = [
  { icon: CalendarDays, title: "Day-by-day itinerary", text: "Timed stops ordered for an efficient route, with ticket prices and travel times." },
  { icon: Map, title: "Interactive maps", text: "Every stop and hotel pinned on a free OpenStreetMap map, colour-coded by day." },
  { icon: BedDouble, title: "Hotel picks", text: "Stays that match your budget with ratings, prices and quick booking links." },
  { icon: Share2, title: "Save & share", text: "Keep all your trips in one place and share them with your travel buddies." },
];

function Hero() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState(null);

  const startPlanning = (place) => {
    const params = new URLSearchParams();
    if (place) params.set("destination", place.label);
    navigate(`/create-trip${place ? `?${params}` : ""}`);
  };

  return (
    <div className="overflow-x-clip">
      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-500/10" />
          <div className="absolute -right-24 top-40 h-[26rem] w-[26rem] rounded-full bg-coral/20 blur-3xl dark:bg-coral/10" />
        </div>

        <div className="container grid items-center gap-12 pb-16 pt-12 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
            <span className="chip border-primary/20 bg-primary/5 text-primary">
              <Sparkles className="h-3.5 w-3.5" /> AI-powered trip planning · 100% free
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Discover your next adventure with <span className="text-gradient">AI</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Your personal trip planner and travel curator. Get custom itineraries, hotel picks and an
              interactive map tailored to your interests and budget in seconds.
            </p>

            <form
              className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                startPlanning(destination);
              }}
            >
              <DestinationSearch
                value={destination}
                onChange={setDestination}
                placeholder="Where do you want to go?"
                className="flex-1"
              />
              <Button type="submit" size="lg" className="h-14 rounded-2xl px-6 text-base shadow-lg shadow-primary/30">
                Plan my trip <ArrowRight />
              </Button>
            </form>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> Ready in under a minute</span>
              <span className="flex items-center gap-1.5"><Map className="h-4 w-4 text-primary" /> Live maps</span>
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-primary" /> No credit card</span>
            </div>
          </div>

          {/* Preview */}
          <div className="relative mx-auto w-full max-w-xl animate-in fade-in-0 zoom-in-95 duration-700 lg:max-w-none">
            <TripMap trip={SAMPLE_TRIP} interactive={false} className="h-[360px] rounded-3xl shadow-lift sm:h-[440px]" />

            <div className="absolute -left-2 top-6 w-60 rounded-2xl border bg-card/95 p-4 shadow-lift backdrop-blur animate-float sm:-left-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Day 1 · Iconic Paris</p>
              <ol className="mt-3 space-y-2.5">
                {SAMPLE_TRIP.days[0].places.map((p) => (
                  <li key={p.key} className="flex items-center gap-3 text-sm">
                    <span
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: dayColor(0) }}
                    >
                      {p.order}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.time}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="absolute -bottom-6 left-4 flex items-center gap-3 rounded-2xl border bg-card/95 p-3 pr-5 shadow-lift backdrop-blur animate-float [animation-delay:1.5s] sm:left-10">
              <PlaceImage name="Louvre" size={200} className="h-12 w-12 rounded-xl" />
              <div>
                <p className="text-sm font-bold">2 days in Paris</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> 6 stops · Couple · Moderate
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Plan a trip in three steps</h2>
          <p className="mt-3 text-muted-foreground">No spreadsheets, no endless tabs. Just tell us what you like.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="card-surface relative p-6 transition hover:-translate-y-1 hover:shadow-lift">
              <span className="absolute right-5 top-4 text-5xl font-extrabold text-muted">{i + 1}</span>
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-1.5 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Destinations */}
      <section className="container py-16">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Need inspiration?</h2>
            <p className="mt-3 text-muted-foreground">Tap a destination to start planning instantly.</p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/create-trip">
              Choose your own <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          {DESTINATIONS.map((d) => (
            <button
              key={d.name}
              type="button"
              onClick={() => startPlanning({ label: `${d.name}, ${d.country}` })}
              className="group text-left focus-visible:outline-none"
            >
              <PlaceImage
                name={d.name}
                size={900}
                className="aspect-[4/3] rounded-2xl shadow-soft ring-primary ring-offset-2 transition group-hover:shadow-lift group-focus-visible:ring-2"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 text-white">
                  <div>
                    <p className="text-lg font-bold leading-tight sm:text-xl">{d.name}</p>
                    <p className="text-sm text-white/80">{d.country}</p>
                  </div>
                  <span className="grid h-9 w-9 shrink-0 translate-y-1 place-items-center rounded-full bg-white/20 opacity-0 backdrop-blur transition group-hover:translate-y-0 group-hover:opacity-100">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </PlaceImage>
            </button>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl p-2">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-coral/10 text-coral">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pt-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-primary to-indigo-700 px-6 py-14 text-center text-white shadow-lift sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-coral/30 blur-3xl" />
          <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">Your next trip is one click away</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/80">
            Get a complete plan with hotels, places and a map — free.
          </p>
          <Button asChild size="lg" variant="secondary" className="relative mt-8 h-12 rounded-full px-7 text-base">
            <Link to="/create-trip">
              Get started, it&apos;s free <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

export default Hero;
