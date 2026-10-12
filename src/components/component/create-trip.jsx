import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, CalendarDays, Check, MapPin, Minus, Plus, Sparkles, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import DestinationSearch from "@/components/custom/DestinationSearch";
import GeneratingOverlay from "@/components/custom/GeneratingOverlay";
import PlaceImage from "@/components/custom/PlaceImage";
import { useAuth } from "@/context/AuthContext";
import { generateTrip, isAIConfigured } from "@/service/AIModel";
import { isFirebaseConfigured } from "@/service/firebaseConfig";
import { searchDestinations } from "@/service/GlobalApi";
import { saveTrip } from "@/service/tripStore";
import { cn } from "@/lib/utils";
import {
  MAX_DAYS,
  MIN_DAYS,
  SelectBudgetOptions,
  SelectInterestOptions,
  SelectTravelesList,
  buildPrompt,
} from "./options";

function Section({ step, title, hint, children }) {
  return (
    <section className="card-surface p-5 sm:p-7">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {step}
        </span>
        <div>
          <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
          {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function OptionCard({ selected, onClick, icon, title, desc }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "relative flex flex-col items-start rounded-2xl border-2 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20",
        selected ? "border-primary bg-primary/5 shadow-soft" : "border-border bg-card"
      )}
    >
      {selected && (
        <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      )}
      <span className="text-3xl">{icon}</span>
      <span className="mt-3 font-bold">{title}</span>
      <span className="text-sm text-muted-foreground">{desc}</span>
    </button>
  );
}

function SummaryRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <span className={cn("truncate text-right font-semibold", !value && "font-normal text-muted-foreground/70")}>
        {value || "Not set"}
      </span>
    </div>
  );
}

function CreateTrip() {
  const [searchParams] = useSearchParams();
  const [destination, setDestination] = useState(null);
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState("");
  const [traveler, setTraveler] = useState("");
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const { requireUser } = useAuth();
  const navigate = useNavigate();

  // Prefill from "?destination=…" (home page search and destination cards).
  const presetDestination = searchParams.get("destination");
  useEffect(() => {
    if (!presetDestination) return;
    const fallback = { label: presetDestination, name: presetDestination.split(",")[0].trim() };
    setDestination(fallback);
    searchDestinations(presetDestination)
      .then(([best]) => best && setDestination((current) => (current === fallback ? best : current)))
      .catch(() => {});
  }, [presetDestination]);

  const toggleInterest = (title) =>
    setInterests((current) =>
      current.includes(title) ? current.filter((i) => i !== title) : [...current, title]
    );

  const runGeneration = async (user) => {
    setLoading(true);
    try {
      const prompt = buildPrompt({ location: destination.label, days, traveler, budget, interests });
      const tripData = await generateTrip(prompt);
      const id = `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
      const { cloud } = await saveTrip({
        id,
        createdAt: Date.now(),
        userEmail: user.email,
        userSelection: {
          location: {
            label: destination.label,
            name: destination.name,
            country: destination.country,
            lat: destination.lat,
            lon: destination.lon,
          },
          noOfDays: days,
          budget,
          traveler,
          interests,
        },
        tripData,
      });
      if (isFirebaseConfigured && !cloud) {
        toast.warning("Cloud sync failed, so the trip was saved on this device only.");
      }
      toast.success("Your trip is ready! 🎉");
      navigate(`/view-trip/${id}`);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Something went wrong while generating your trip.");
    } finally {
      setLoading(false);
    }
  };

  const onGenerate = () => {
    if (!isAIConfigured) return toast.error("Add VITE_GEMINI_API_KEY to your .env file first.");
    if (!destination) return toast.error("Choose a destination to continue.");
    if (!budget) return toast.error("Pick a budget for your trip.");
    if (!traveler) return toast.error("Tell us who's travelling.");
    requireUser(runGeneration);
  };

  const travelerTitle = SelectTravelesList.find((t) => t.people === traveler)?.title;

  return (
    <div className="container py-10 md:py-14">
      {loading && <GeneratingOverlay destination={destination?.name} />}

      <div className="max-w-3xl">
        <span className="chip border-primary/20 bg-primary/5 text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Trip builder
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Tell us your travel preferences</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Share a few basics and our AI planner will craft a day-by-day itinerary just for you.
        </p>
      </div>

      {!isAIConfigured && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            <strong>Gemini API key missing.</strong> Copy <code>.env.example</code> to <code>.env</code>, add your free key
            from{" "}
            <a className="font-semibold underline" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">
              Google AI Studio
            </a>{" "}
            as <code>VITE_GEMINI_API_KEY</code>, then restart <code>npm run dev</code>.
          </p>
        </div>
      )}

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <Section step={1} title="Where do you want to go?" hint="Search any city, region or country.">
            <DestinationSearch value={destination} onChange={setDestination} autoFocus={!presetDestination} />
          </Section>

          <Section step={2} title="How many days?" hint={`Between ${MIN_DAYS} and ${MAX_DAYS} days.`}>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-2xl border bg-card p-1.5 shadow-soft">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Fewer days"
                  className="rounded-xl"
                  disabled={days <= MIN_DAYS}
                  onClick={() => setDays((d) => Math.max(MIN_DAYS, d - 1))}
                >
                  <Minus />
                </Button>
                <span className="w-24 text-center text-lg font-bold tabular-nums">
                  {days} {days === 1 ? "day" : "days"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="More days"
                  className="rounded-xl"
                  disabled={days >= MAX_DAYS}
                  onClick={() => setDays((d) => Math.min(MAX_DAYS, d + 1))}
                >
                  <Plus />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[2, 3, 5, 7].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDays(n)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                      days === n ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/50"
                    )}
                  >
                    {n === 7 ? "1 week" : n === 2 ? "Weekend" : `${n} days`}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section step={3} title="What's your budget?" hint="This shapes hotel picks and activities.">
            <div className="grid gap-3 sm:grid-cols-3">
              {SelectBudgetOptions.map((item) => (
                <OptionCard
                  key={item.id}
                  selected={budget === item.title}
                  onClick={() => setBudget(item.title)}
                  icon={item.icon}
                  title={item.title}
                  desc={item.desc}
                />
              ))}
            </div>
          </Section>

          <Section step={4} title="Who's coming along?">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {SelectTravelesList.map((item) => (
                <OptionCard
                  key={item.id}
                  selected={traveler === item.people}
                  onClick={() => setTraveler(item.people)}
                  icon={item.icon}
                  title={item.title}
                  desc={item.desc}
                />
              ))}
            </div>
          </Section>

          <Section step={5} title="What do you love?" hint="Optional — pick as many as you like.">
            <div className="flex flex-wrap gap-2.5">
              {SelectInterestOptions.map((item) => {
                const selected = interests.includes(item.title);
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleInterest(item.title)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-medium transition",
                      selected ? "border-coral bg-coral/10 text-foreground" : "border-border bg-card hover:border-coral/40"
                    )}
                  >
                    <span>{item.icon}</span> {item.title}
                  </button>
                );
              })}
            </div>
          </Section>
        </div>

        {/* Summary */}
        <aside className="card-surface overflow-hidden lg:sticky lg:top-24">
          {destination ? (
            <PlaceImage name={destination.name} context={destination.country} className="h-40">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <p className="absolute bottom-3 left-4 right-4 truncate text-xl font-bold text-white">{destination.name}</p>
            </PlaceImage>
          ) : (
            <div className="grid h-40 place-items-center bg-gradient-to-br from-sky-100 to-primary/20 text-primary dark:from-sky-950 dark:to-primary/20">
              <MapPin className="h-10 w-10" />
            </div>
          )}
          <div className="p-5">
            <h3 className="font-bold">Trip summary</h3>
            <div className="mt-2 divide-y">
              <SummaryRow icon={MapPin} label="Destination" value={destination?.label} />
              <SummaryRow icon={CalendarDays} label="Duration" value={`${days} ${days === 1 ? "day" : "days"}`} />
              <SummaryRow icon={Wallet} label="Budget" value={budget} />
              <SummaryRow icon={Users} label="Travellers" value={travelerTitle} />
            </div>
            {interests.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {interests.map((i) => (
                  <span key={i} className="chip">{i}</span>
                ))}
              </div>
            )}
            <Button
              size="lg"
              className="mt-5 h-12 w-full rounded-xl text-base shadow-lg shadow-primary/25"
              disabled={loading}
              onClick={onGenerate}
            >
              <Sparkles /> Generate my trip
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">Free · takes about 30 seconds</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default CreateTrip;
