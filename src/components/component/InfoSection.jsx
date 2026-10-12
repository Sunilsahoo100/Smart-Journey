import { CalendarDays, Lightbulb, Printer, Share2, Sun, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import PlaceImage from "@/components/custom/PlaceImage";
import { isFirebaseConfigured } from "@/service/firebaseConfig";

async function shareTrip(title) {
  const url = window.location.href;
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
    } catch {
      // User cancelled the share sheet.
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
    if (!isFirebaseConfigured) {
      toast.info("Trips are stored in this browser, so the link only opens on this device.");
    }
  } catch {
    toast.error("Couldn't copy the link");
  }
}

function Stat({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-muted/60 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-card text-primary shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-semibold leading-snug">{value}</p>
      </div>
    </div>
  );
}

function InfoSection({ trip }) {
  const { location } = trip;
  const country = location.label.split(",").at(-1)?.trim();
  const title = `${trip.noOfDays}-day trip to ${location.name}`;
  const stops = trip.days.reduce((sum, d) => sum + d.places.length, 0);

  return (
    <>
      <PlaceImage
        name={location.name}
        context={country !== location.name ? country : ""}
        size={1600}
        className="h-[300px] rounded-3xl shadow-lift md:h-[400px]"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
        <div className="absolute right-4 top-4 flex gap-2 print:hidden">
          <Button size="sm" variant="secondary" className="rounded-full bg-card/90 text-foreground backdrop-blur hover:bg-card" onClick={() => window.print()}>
            <Printer /> <span className="hidden sm:inline">Print</span>
          </Button>
          <Button size="sm" variant="secondary" className="rounded-full bg-card/90 text-foreground backdrop-blur hover:bg-card" onClick={() => shareTrip(title)}>
            <Share2 /> Share
          </Button>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
          <p className="text-sm font-medium text-white/80">Your trip to</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-5xl">{location.label}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { icon: CalendarDays, text: `${trip.noOfDays} ${trip.noOfDays === 1 ? "day" : "days"} · ${stops} stops` },
              trip.budget && { icon: Wallet, text: `${trip.budget} budget` },
              trip.traveler && { icon: Users, text: trip.traveler },
            ]
              .filter(Boolean)
              .map(({ icon: Icon, text }) => (
                <span key={text} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur-md">
                  <Icon className="h-4 w-4" /> {text}
                </span>
              ))}
          </div>
        </div>
      </PlaceImage>

      {(trip.summary || trip.tips.length > 0) && (
        <section className="card-surface mt-8 p-5 sm:p-7">
          {trip.summary && <p className="text-lg leading-relaxed text-foreground/85">{trip.summary}</p>}
          {trip.interests.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {trip.interests.map((interest) => (
                <span key={interest} className="chip">{interest}</span>
              ))}
            </div>
          )}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Stat icon={Sun} label="Best time to visit" value={trip.bestTimeToVisit} />
            <Stat icon={Wallet} label="Estimated total cost" value={trip.estimatedTotalCost} />
          </div>
          {trip.tips.length > 0 && (
            <div className="mt-6">
              <h3 className="flex items-center gap-2 font-bold">
                <Lightbulb className="h-5 w-5 text-amber-500" /> Local tips
              </h3>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {trip.tips.map((tip) => (
                  <li key={tip} className="flex gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </>
  );
}

export default InfoSection;
