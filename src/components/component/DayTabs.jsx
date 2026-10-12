import { dayColor } from "@/lib/trip";
import { cn } from "@/lib/utils";

/** Pill tabs for "All days / Day 1 / Day 2 …". `value` is "all" or a day index. */
function DayTabs({ days, value, onChange, className, size = "md" }) {
  const tabs = [{ key: "all", label: "All days" }, ...days.map((d) => ({ key: d.dayIndex, label: `Day ${d.day}` }))];

  return (
    <div role="tablist" className={cn("scrollbar-none flex gap-2 overflow-x-auto", className)}>
      {tabs.map((tab) => {
        const active = value === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border font-semibold transition",
              size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm",
              active ? "border-foreground bg-foreground text-background" : "bg-card hover:border-foreground/30"
            )}
          >
            {tab.key !== "all" && (
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: dayColor(tab.key) }} />
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default DayTabs;
