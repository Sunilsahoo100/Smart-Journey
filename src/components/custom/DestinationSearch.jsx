import { useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";
import { searchDestinations } from "@/service/GlobalApi";
import { cn } from "@/lib/utils";

/**
 * Destination autocomplete backed by OpenStreetMap (Photon). Free, no API key.
 * `value` is the selected place object (or null); `onChange` receives the
 * newly selected place or null when the user edits the text.
 */
function DestinationSearch({ value, onChange, placeholder = "Search a city, region or country…", autoFocus, className, inputClassName }) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const listId = useId();
  const containerRef = useRef(null);

  // Keep the text in sync when the selection is set from outside.
  useEffect(() => {
    if (value?.label) setQuery(value.label);
  }, [value?.label]);

  useEffect(() => {
    if (value?.label === query || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      searchDestinations(query, { signal: controller.signal })
        .then((places) => {
          setResults(places);
          setHighlight(0);
          setError(false);
        })
        .catch((err) => {
          if (err.name !== "AbortError") setError(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, value?.label]);

  useEffect(() => {
    const onPointerDown = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const select = (place) => {
    setQuery(place.label);
    setOpen(false);
    setResults([]);
    onChange(place);
  };

  const onKeyDown = (e) => {
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showDropdown = open && query.trim().length >= 2 && value?.label !== query;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listId}
        aria-autocomplete="list"
        autoFocus={autoFocus}
        autoComplete="off"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value) onChange(null);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className={cn(
          "h-14 w-full rounded-2xl border bg-card pl-12 pr-11 text-base shadow-soft outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15",
          inputClassName
        )}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : query ? (
          <button
            type="button"
            aria-label="Clear destination"
            onClick={() => {
              setQuery("");
              onChange(null);
              setOpen(true);
            }}
            className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {showDropdown && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border bg-popover p-1.5 shadow-lift animate-in fade-in-0 slide-in-from-top-1"
        >
          {results.map((place, i) => (
            <li key={place.id} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                onMouseEnter={() => setHighlight(i)}
                onClick={() => select(place)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                  i === highlight ? "bg-accent" : "hover:bg-accent"
                )}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{place.name}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {[place.label.split(", ").slice(1).join(", "), place.type].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {!loading && !results.length && (
            <li className="px-3 py-4 text-center text-sm text-muted-foreground">
              {error ? "Search is unavailable right now. Try again in a moment." : "No places found. Try another spelling."}
            </li>
          )}
          {loading && !results.length && (
            <li className="px-3 py-4 text-center text-sm text-muted-foreground">Searching…</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default DestinationSearch;
