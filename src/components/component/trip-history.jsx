import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, LogIn, Plane, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { deleteTrip, getUserTrips } from "@/service/tripStore";
import UserTripCardItem from "./UserTripCardItem";

function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="card-surface mx-auto mt-10 flex max-w-lg flex-col items-center px-6 py-14 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-8 w-8" />
      </span>
      <h2 className="mt-5 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-muted-foreground">{text}</p>
      <div className="mt-6">{action}</div>
    </div>
  );
}

function Mytrips() {
  const { user, ready, openSignIn } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getUserTrips(user)
      .then((result) => active && setTrips(result))
      .catch(() => toast.error("Couldn't load your trips."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user, ready]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteTrip(pendingDelete.id);
      setTrips((current) => current.filter((t) => t.id !== pendingDelete.id));
      toast.success("Trip deleted");
      setPendingDelete(null);
    } catch (error) {
      console.error(error);
      toast.error("Couldn't delete the trip from the cloud. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container py-10 md:py-14">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">My trips</h1>
          <p className="mt-2 text-muted-foreground">
            {user ? "All the adventures you've planned so far." : "Sign in to see your saved trips."}
          </p>
        </div>
        {user && trips.length > 0 && (
          <Button asChild className="rounded-full shadow-md shadow-primary/25">
            <Link to="/create-trip"><Plus /> Plan a new trip</Link>
          </Button>
        )}
      </div>

      {ready && !user ? (
        <EmptyState
          icon={LogIn}
          title="You're not signed in"
          text="Sign in or continue as a guest to view and manage your trips."
          action={<Button className="rounded-full" onClick={openSignIn}>Sign in</Button>}
        />
      ) : loading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="card-surface overflow-hidden">
              <div className="skeleton aspect-[16/10]" />
              <div className="space-y-2 p-4">
                <div className="skeleton h-5 w-2/3 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          icon={Plane}
          title="No trips yet"
          text="Your planned trips will show up here. Let's create the first one!"
          action={
            <Button asChild className="rounded-full">
              <Link to="/create-trip"><Plus /> Plan a trip</Link>
            </Button>
          }
        />
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <UserTripCardItem key={trip.id} trip={trip} onDelete={setPendingDelete} />
          ))}
        </div>
      )}

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && !deleting && setPendingDelete(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete this trip?</DialogTitle>
            <DialogDescription>
              Your trip to {pendingDelete?.userSelection?.location?.label ?? "this destination"} will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={deleting} onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleting} onClick={confirmDelete}>
              {deleting && <Loader2 className="animate-spin" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Mytrips;
