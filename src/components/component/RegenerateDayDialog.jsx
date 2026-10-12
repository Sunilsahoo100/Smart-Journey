import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const SUGGESTIONS = [
  "Make it more relaxed",
  "More local food spots",
  "Add hidden gems",
  "Kid-friendly",
  "Budget-friendly",
  "Indoor options (rainy day)",
  "Start later in the morning",
];

function RegenerateDayDialog({ day, onRegenerate, onOpenChange }) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onRegenerate(instruction);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !loading && onOpenChange(open)}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Re-plan Day {day.day} with AI
          </DialogTitle>
          <DialogDescription>
            Tell the AI what you&apos;d like to change. Places from your other days won&apos;t be repeated.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Textarea
            autoFocus
            rows={3}
            value={instruction}
            disabled={loading}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g. Fewer temples, more street food and a sunset spot"
            className="rounded-xl"
          />
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((text) => (
              <button
                key={text}
                type="button"
                disabled={loading}
                onClick={() => setInstruction((current) => (current ? `${current.replace(/[.\s]*$/, "")}. ${text}` : text))}
                className="rounded-full border bg-card px-3 py-1 text-xs font-medium transition hover:border-primary/50 hover:text-primary disabled:opacity-50"
              >
                + {text}
              </button>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {loading ? `Re-planning Day ${day.day}…` : "Re-plan this day"}
            </Button>
          </DialogFooter>
          {!loading && (
            <p className="-mt-2 text-xs text-muted-foreground">
              You can review the new plan and still discard it before saving.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default RegenerateDayDialog;
