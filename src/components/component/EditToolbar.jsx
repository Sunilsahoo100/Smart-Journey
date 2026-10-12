import { Loader2, PencilLine, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function EditToolbar({ dirty, saving, onDiscard, onSave }) {
  return (
    <div className="sticky top-16 z-30 -mx-1 mb-6 print:hidden">
      <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-card/95 p-3 shadow-lift backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:pl-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <PencilLine className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold leading-tight">Customizing your trip</p>
            <p className="text-xs text-muted-foreground">
              {dirty ? "You have unsaved changes" : "Reorder, edit, add or re-plan anything below"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1 rounded-full sm:flex-none" disabled={saving} onClick={onDiscard}>
            <X /> {dirty ? "Discard" : "Done"}
          </Button>
          <Button className="flex-1 rounded-full sm:flex-none" disabled={!dirty || saving} onClick={onSave}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EditToolbar;
