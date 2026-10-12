import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { getPlacePhoto } from "@/service/GlobalApi";
import { cn } from "@/lib/utils";

const FALLBACK_GRADIENTS = [
  "from-sky-400 to-blue-600",
  "from-coral to-rose-500",
  "from-emerald-400 to-teal-600",
  "from-violet-400 to-indigo-600",
  "from-amber-400 to-orange-500",
];

function hash(text) {
  let h = 0;
  for (const ch of text ?? "") h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

/** Shows a Wikipedia photo for a place, with a skeleton and a styled fallback. */
function PlaceImage({ name, context, size = 800, alt, className, icon: Icon = MapPin, children }) {
  const [photo, setPhoto] = useState({ key: null, url: null });
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const key = `${name}|${context}|${size}`;

  useEffect(() => {
    let active = true;
    setLoaded(false);
    setFailed(false);
    getPlacePhoto(name, { context, size }).then((url) => {
      if (active) setPhoto({ key, url });
    });
    return () => {
      active = false;
    };
  }, [name, context, size, key]);

  const resolved = photo.key === key;
  const showImage = resolved && photo.url && !failed;
  const showFallback = resolved && (!photo.url || failed);

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {!resolved || (showImage && !loaded) ? <div className="skeleton absolute inset-0" /> : null}

      {showImage && (
        <img
          src={photo.url}
          alt={alt ?? name}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "h-full w-full object-cover transition-all duration-700",
            loaded ? "scale-100 opacity-100" : "scale-105 opacity-0"
          )}
        />
      )}

      {showFallback && (
        <div
          className={cn(
            "absolute inset-0 grid place-items-center bg-gradient-to-br text-white/90",
            FALLBACK_GRADIENTS[hash(name) % FALLBACK_GRADIENTS.length]
          )}
        >
          <Icon className="h-1/3 max-h-12 w-1/3 max-w-12" strokeWidth={1.5} />
        </div>
      )}

      {children}
    </div>
  );
}

export default PlaceImage;
