import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useBlocker, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Compass, Copy, PencilLine, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import InfoSection from "@/components/component/InfoSection";
import Hotels from "@/components/component/Hotels";
import PlacesToVisit from "@/components/component/PlacesToVisit";
import TripMap from "@/components/component/TripMap";
import DayTabs from "@/components/component/DayTabs";
import EditToolbar from "@/components/component/EditToolbar";
import ItemDialog from "@/components/component/ItemDialog";
import RegenerateDayDialog from "@/components/component/RegenerateDayDialog";
import { useAuth } from "@/context/AuthContext";
import { isAIConfigured, regenerateDay } from "@/service/AIModel";
import { isFirebaseConfigured } from "@/service/firebaseConfig";
import { getTrip, saveTrip } from "@/service/tripStore";
import { normalizeTrip } from "@/lib/trip";
import * as E from "@/lib/tripEditor";

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

const ownsTrip = (trip, user) =>
  Boolean(user && trip) && (trip.userId ? trip.userId === user.uid : Boolean(user.email) && trip.userEmail === user.email);

function Viewtrip() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user, ready, requireUser } = useAuth();
  const [status, setStatus] = useState("loading");
  const [saved, setSaved] = useState(null); // trip as stored
  const [draft, setDraft] = useState(null); // working copy while customizing
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState(null); // { kind: "stop" | "hotel", uid?, dayIndex? }
  const [regenDayIndex, setRegenDayIndex] = useState(null);
  const [activeDay, setActiveDay] = useState("all");
  const [focus, setFocus] = useState(null);
  const mapRef = useRef(null);

  const editing = draft !== null;
  const current = draft ?? saved;
  const trip = useMemo(() => normalizeTrip(current), [current]);
  const isOwner = ready && ownsTrip(saved, user);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setDraft(null);
    setDirty(false);
    setActiveDay("all");
    getTrip(tripId)
      .then((raw) => {
        if (!active) return;
        setSaved(raw);
        setStatus(raw ? "ready" : "missing");
      })
      .catch((error) => {
        console.error(error);
        if (active) setStatus("missing");
      });
    return () => {
      active = false;
    };
  }, [tripId]);

  // Keep the day filter valid when days are added or removed.
  useEffect(() => {
    if (activeDay !== "all" && trip && activeDay >= trip.days.length) setActiveDay("all");
  }, [activeDay, trip]);

  // Warn before losing unsaved edits (tab close and in-app navigation).
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (window.confirm("You have unsaved changes to this trip. Leave without saving?")) blocker.proceed();
    else blocker.reset();
  }, [blocker]);

  const showOnMap = useCallback((item) => {
    if (item.dayIndex !== undefined) {
      setActiveDay((day) => (day === "all" || day === item.dayIndex ? day : item.dayIndex));
    }
    setFocus({ key: item.key, coords: item.coords, at: Date.now() });
    // On small screens the map sits above the content; bring it into view.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      mapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // ----- editing ---------------------------------------------------------------

  const applyEdit = useCallback((fn) => {
    setDraft((d) => ({ ...d, tripData: fn(d.tripData) }));
    setDirty(true);
  }, []);

  const startEditing = () => {
    setDraft({ ...saved, tripData: E.withIds(saved.tripData) });
    setDirty(false);
  };

  const discard = () => {
    if (dirty && !window.confirm("Discard all changes you've made?")) return;
    setDraft(null);
    setDirty(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const next = {
        ...draft,
        // Trips made before Firebase sign-in only have an email; stamp the
        // owner's uid so the Firestore rules accept the write.
        userId: user.uid,
        userEmail: user.email ?? draft.userEmail ?? null,
        createdAt: draft.createdAt ?? (Number(draft.id) || Date.now()),
        userSelection: { ...draft.userSelection, noOfDays: draft.tripData.itinerary.length },
        updatedAt: Date.now(),
      };
      const { cloud, reason } = await saveTrip(next);
      setSaved(JSON.parse(JSON.stringify(next)));
      setDraft(null);
      setDirty(false);
      if (isFirebaseConfigured && !cloud) {
        toast.warning("Saved on this device only — cloud sync failed.", { description: reason, duration: 10000 });
      }
      else toast.success("Your changes are saved");
    } catch (error) {
      console.error(error);
      toast.error("Couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveCopy = () =>
    requireUser(async (u) => {
      const id = crypto.randomUUID();
      await saveTrip({
        ...saved,
        id,
        userId: u.uid,
        userEmail: u.email ?? null,
        createdAt: Date.now(),
        copiedFrom: saved.id,
      });
      toast.success("Saved to your trips — customize it however you like.");
      navigate(`/view-trip/${id}`);
    });

  const editor = useMemo(
    () => ({
      moveStop: (uid, delta) => applyEdit((td) => E.moveStop(td, uid, delta)),
      moveStopToDay: (uid, dayIndex) => applyEdit((td) => E.moveStopToDay(td, uid, dayIndex)),
      removeStop: (uid) => {
        applyEdit((td) => E.removeStop(td, uid));
        toast("Stop removed", { description: "Discard changes to bring it back." });
      },
      editStop: (uid, dayIndex) => setDialog({ kind: "stop", uid, dayIndex }),
      addStop: (dayIndex) => setDialog({ kind: "stop", dayIndex }),
      setDayTheme: (dayIndex, theme) => applyEdit((td) => E.setDayTheme(td, dayIndex, theme)),
      addDay: () => {
        applyEdit(E.addDay);
        toast.success("New day added — add stops or re-plan it with AI.");
      },
      removeDay: (dayIndex) => {
        if (!window.confirm(`Remove Day ${dayIndex + 1} and all its stops?`)) return;
        applyEdit((td) => E.removeDay(td, dayIndex));
        setActiveDay("all");
      },
      regenerateDay: (dayIndex) => {
        if (!isAIConfigured) return toast.error("Add VITE_GEMINI_API_KEY to .env to use AI re-planning.");
        setRegenDayIndex(dayIndex);
      },
      editHotel: (uid) => setDialog({ kind: "hotel", uid }),
      addHotel: () => setDialog({ kind: "hotel" }),
      removeHotel: (uid) => applyEdit((td) => E.removeHotel(td, uid)),
    }),
    [applyEdit]
  );

  const onSaveItem = (values) => {
    const { kind, uid, dayIndex } = dialog;
    if (kind === "stop") {
      applyEdit((td) => (uid ? E.updateStop(td, uid, values) : E.addStop(td, dayIndex, values)));
    } else {
      applyEdit((td) => (uid ? E.updateHotel(td, uid, values) : E.addHotel(td, values)));
    }
    setDialog(null);
  };

  const onRegenerate = async (instruction) => {
    const dayIndex = regenDayIndex;
    try {
      const result = await regenerateDay({ trip: draft, dayIndex, instruction });
      applyEdit((td) => E.replaceDay(td, dayIndex, result));
      setRegenDayIndex(null);
      setActiveDay(dayIndex);
      toast.success(`Day ${dayIndex + 1} re-planned`, { description: "Review it, then save or discard." });
    } catch (error) {
      toast.error(error.message || "Couldn't re-plan this day.");
    }
  };

  const searchNear = useMemo(
    () => trip?.location.coords ?? trip?.days.flatMap((d) => d.places).find((p) => p.coords)?.coords ?? null,
    [trip]
  );

  if (status === "loading") return <TripSkeleton />;
  if (status === "missing") return <TripNotFound />;

  const bannerActions = editing ? null : isOwner ? (
    <Button size="sm" className="rounded-full shadow-md" onClick={startEditing}>
      <PencilLine /> Customize
    </Button>
  ) : ready ? (
    <Button size="sm" className="rounded-full shadow-md" onClick={saveCopy}>
      <Copy /> Save a copy
    </Button>
  ) : null;

  return (
    <div className="container py-8">
      {editing && <EditToolbar dirty={dirty} saving={saving} onDiscard={discard} onSave={save} />}

      <InfoSection trip={trip} actions={bannerActions} />

      <div className="mt-2 grid items-start gap-x-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <div className="order-2 lg:order-1">
          <Hotels trip={trip} onShowOnMap={showOnMap} editing={editing} editor={editor} />
          <PlacesToVisit
            trip={trip}
            activeDay={activeDay}
            onDayChange={setActiveDay}
            onShowOnMap={showOnMap}
            editing={editing}
            editor={editor}
          />
        </div>

        <div ref={mapRef} className={`order-1 mt-12 lg:sticky lg:order-2 print:hidden ${editing ? "lg:top-44" : "lg:top-24"}`}>
          <div className="relative">
            <TripMap
              trip={trip}
              activeDay={activeDay}
              focus={focus}
              className={editing ? "h-[380px] lg:h-[calc(100vh-12rem)]" : "h-[380px] lg:h-[calc(100vh-8rem)]"}
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

      {dialog && (
        <ItemDialog
          key={`${dialog.kind}-${dialog.uid ?? "new"}-${dialog.dayIndex ?? ""}`}
          kind={dialog.kind}
          initial={
            dialog.uid
              ? dialog.kind === "stop"
                ? E.findStop(draft.tripData, dialog.uid)
                : E.findHotel(draft.tripData, dialog.uid)
              : null
          }
          near={searchNear}
          dayLabel={dialog.kind === "stop" ? `Day ${dialog.dayIndex + 1}` : ""}
          onSave={onSaveItem}
          onOpenChange={(open) => !open && setDialog(null)}
        />
      )}

      {regenDayIndex !== null && trip.days[regenDayIndex] && (
        <RegenerateDayDialog
          day={trip.days[regenDayIndex]}
          onRegenerate={onRegenerate}
          onOpenChange={(open) => !open && setRegenDayIndex(null)}
        />
      )}
    </div>
  );
}

export default Viewtrip;
