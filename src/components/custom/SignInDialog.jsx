import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GOOGLE_CLIENT_ID, useAuth } from "@/context/AuthContext";
import Logo from "./Logo";

function GoogleSignInButton() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (token) => {
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${token.access_token}` },
        });
        if (!res.ok) throw new Error(`userinfo ${res.status}`);
        const profile = await res.json();
        signIn({ name: profile.name, email: profile.email, picture: profile.picture });
        toast.success(`Welcome, ${profile.given_name ?? profile.name}!`);
      } catch (error) {
        console.error(error);
        toast.error("Couldn't load your Google profile. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error(error);
      setLoading(false);
      toast.error("Google sign-in failed.");
    },
    onNonOAuthError: () => setLoading(false), // popup closed or blocked
  });

  return (
    <Button
      size="lg"
      variant="outline"
      className="h-12 w-full gap-3 rounded-xl text-base"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        login();
      }}
    >
      {loading ? <Loader2 className="animate-spin" /> : <FcGoogle className="!h-5 !w-5" />}
      Continue with Google
    </Button>
  );
}

function SignInDialog({ open, onOpenChange }) {
  const { continueAsGuest } = useAuth();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-8">
        <DialogHeader className="items-center text-center sm:text-center">
          <Logo className="mb-4" />
          <DialogTitle className="text-2xl font-bold">Sign in to save your trips</DialogTitle>
          <DialogDescription className="text-base">
            Keep every itinerary in one place and come back to it anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-3">
          {GOOGLE_CLIENT_ID && <GoogleSignInButton />}
          <Button
            size="lg"
            variant={GOOGLE_CLIENT_ID ? "ghost" : "default"}
            className="h-12 w-full gap-3 rounded-xl text-base"
            onClick={continueAsGuest}
          >
            <UserRound />
            Continue as guest
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Guest trips are saved in this browser only.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SignInDialog;
