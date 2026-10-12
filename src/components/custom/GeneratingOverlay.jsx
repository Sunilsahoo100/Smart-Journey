import { useEffect, useState } from "react";
import { Plane } from "lucide-react";

const STEPS = [
  "Scouting the best neighbourhoods…",
  "Picking hotels that fit your budget…",
  "Finding must-see places…",
  "Planning an efficient route for each day…",
  "Checking ticket prices and timings…",
  "Adding local tips…",
  "Almost there — polishing your itinerary…",
];

function GeneratingOverlay({ destination }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-background/85 p-4 backdrop-blur-md animate-in fade-in-0">
      <div role="status" aria-live="polite" className="card-surface w-full max-w-md p-8 text-center shadow-lift">
        <div className="relative mx-auto h-20 overflow-hidden">
          <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-primary/25" />
          <div className="absolute inset-0 grid place-items-center animate-fly">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-primary text-white shadow-lg shadow-primary/30">
              <Plane className="h-7 w-7 rotate-45" />
            </span>
          </div>
        </div>
        <h2 className="mt-6 text-xl font-bold">Crafting your trip{destination ? ` to ${destination}` : ""}</h2>
        <p key={step} className="mt-2 min-h-6 text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-1">
          {STEPS[step]}
        </p>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 via-primary to-coral transition-all ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 92}%`, transitionDuration: "3500ms" }}
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">This usually takes 15–40 seconds.</p>
      </div>
    </div>
  );
}

export default GeneratingOverlay;
