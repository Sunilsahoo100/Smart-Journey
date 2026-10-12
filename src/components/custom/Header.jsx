import { Link, NavLink, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { LogOut, Map, Plus, UserRound } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { isGoogleSignInAvailable, useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

function Avatar({ user, className }) {
  if (user?.picture) {
    return (
      <img
        src={user.picture}
        alt={user.name}
        referrerPolicy="no-referrer"
        className={cn("h-9 w-9 rounded-full object-cover", className)}
      />
    );
  }
  const initials = (user?.name ?? "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-coral to-rose-500 text-sm font-bold text-white",
        className
      )}
    >
      {user?.guest ? <UserRound className="h-4 w-4" /> : initials}
    </span>
  );
}

const navLinkClass = ({ isActive }) =>
  cn(
    "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition",
    isActive ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-muted hover:text-foreground"
  );

function Header() {
  const { user, ready, logout, openSignIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-lg print:hidden">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link to="/" aria-label="SmartJourney home" className="shrink-0">
          <Logo className="hidden sm:inline-flex" />
          <Logo compact className="sm:hidden" />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {user && (
            <NavLink to="/my-trips" className={navLinkClass}>
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">My Trips</span>
            </NavLink>
          )}
          <Button asChild className="h-10 rounded-full px-4 shadow-md shadow-primary/25">
            <Link to="/create-trip">
              <Plus />
              <span className="hidden sm:inline">Plan a trip</span>
              <span className="sm:hidden">New</span>
            </Link>
          </Button>

          {user ? (
            <Popover>
              <PopoverTrigger
                aria-label="Account menu"
                className="ml-1 rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-background transition hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-primary"
              >
                <Avatar user={user} />
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 rounded-2xl p-2">
                <div className="flex items-center gap-3 p-2">
                  <Avatar user={user} className="h-10 w-10" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.guest ? "Guest · trips tied to this browser" : user.email}
                    </p>
                  </div>
                </div>
                <div className="my-1 h-px bg-border" />
                {user.guest && isGoogleSignInAvailable && (
                  <button
                    onClick={() =>
                      signInWithGoogle()
                        .then((profile) => profile && toast.success("Signed in — your trips are now saved to your Google account."))
                        .catch((error) => toast.error(error.message))
                    }
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-muted"
                  >
                    <FcGoogle className="h-4 w-4" /> Save trips with Google
                  </button>
                )}
                <button
                  onClick={() => navigate("/my-trips")}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  <Map className="h-4 w-4" /> My trips
                </button>
                <button
                  onClick={async () => {
                    if (
                      user.guest &&
                      isGoogleSignInAvailable &&
                      !window.confirm("Guest trips can't be recovered after signing out. Sign out anyway?")
                    ) {
                      return;
                    }
                    await logout();
                    navigate("/");
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </PopoverContent>
            </Popover>
          ) : !ready ? (
            <span className="skeleton ml-1 h-9 w-9 rounded-full" aria-hidden />
          ) : (
            <Button variant="ghost" className="h-10 rounded-full px-4 font-semibold" onClick={openSignIn}>
              Sign in
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
