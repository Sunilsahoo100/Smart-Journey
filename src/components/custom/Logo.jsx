import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";

function Logo({ className, compact = false }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-primary text-white shadow-md shadow-primary/30">
        <Plane className="h-[18px] w-[18px] -rotate-45" strokeWidth={2.4} />
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-coral" />
      </span>
      {!compact && (
        <span className="text-lg font-extrabold tracking-tight text-foreground">
          Smart<span className="text-primary">Journey</span>
        </span>
      )}
    </span>
  );
}

export default Logo;
