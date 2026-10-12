import { Heart } from "lucide-react";
import Logo from "./Logo";

function Footer() {
  return (
    <footer className="mt-20 border-t bg-card/60 print:hidden">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted-foreground md:flex-row">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <Logo />
          <p className="flex items-center gap-1">
            Created with <Heart className="h-4 w-4 fill-coral text-coral" /> by Sunil
          </p>
        </div>
        <p className="text-center md:text-right">
          Itineraries by Google Gemini · Maps ©{" "}
          <a className="font-medium text-foreground/80 hover:text-primary" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            OpenStreetMap
          </a>{" "}
          contributors · Photos from{" "}
          <a className="font-medium text-foreground/80 hover:text-primary" href="https://www.wikipedia.org" target="_blank" rel="noreferrer">
            Wikipedia
          </a>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
