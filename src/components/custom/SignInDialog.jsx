import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { isGoogleSignInAvailable, useAuth } from "@/context/AuthContext";
import Logo from "./Logo";

function SignInDialog({ open, onOpenChange }) {
  const { signInWithGoogle, continueAsGuest } = useAuth();
  const [pending, setPending] = useState(null);

  const run = async (kind, action) => {
    setPending(kind);
    try {
      const profile = await action();
      if (profile && kind === "google") toast.success(`Welcome, ${profile.name.split(" ")[0]}!`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPending(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-w-md rounded-2xl p-8">
        <DialogHeader className="items-center text-center sm:text-center">
          <Logo className="mb-4" />
          <DialogTitle className="text-2xl font-bold">Sign in to save your trips</DialogTitle>
          <DialogDescription className="text-base">
            Keep every itinerary in one place and come back to it anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-3">
          {isGoogleSignInAvailable && (
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-full gap-3 rounded-xl text-base"
              disabled={Boolean(pending)}
              onClick={() => run("google", signInWithGoogle)}
            >
              {pending === "google" ? <Loader2 className="animate-spin" /> : <FcGoogle className="!h-5 !w-5" />}
              Continue with Google
            </Button>
          )}
          <Button
            size="lg"
            variant={isGoogleSignInAvailable ? "ghost" : "default"}
            className="h-12 w-full gap-3 rounded-xl text-base"
            disabled={Boolean(pending)}
            onClick={() => run("guest", continueAsGuest)}
          >
            {pending === "guest" ? <Loader2 className="animate-spin" /> : <UserRound />}
            Continue as guest
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {isGoogleSignInAvailable
              ? "Guest trips are tied to this browser. Sign in with Google later to keep them."
              : "Guest trips are saved in this browser only."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SignInDialog;
