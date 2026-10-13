"use client";

import { Plus } from "lucide-react";
import { useCallback, useState } from "react";

import { useLive } from "@/components/space/live";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Toast } from "@/components/ui/toast";

import { AddSongForm } from "./add-song-form";

// Phones and tablets: a sticky "Add a song" bar that opens a bottom sheet.
export function AddSongSheet({ spaceId }: { spaceId: string }) {
  const [open, setOpen] = useState(false);
  const offline = useLive().status === "offline";
  const [message, setMessage] = useState<string | null>(null);
  const dismiss = useCallback(() => setMessage(null), []);

  function done(text: string) {
    setOpen(false);
    setMessage(text);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-card/95 px-margin pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
          <DialogTrigger asChild>
            <Button size="lg" className="w-full" disabled={offline}>
              <Plus aria-hidden />
              {offline ? "Add a song (offline)" : "Add a song"}
            </Button>
          </DialogTrigger>
        </div>
        <DialogContent
          className="top-auto bottom-0 left-0 w-full max-w-none translate-x-0 translate-y-0 rounded-b-none pb-[max(1.5rem,env(safe-area-inset-bottom))] data-[state=closed]:zoom-out-100 data-[state=closed]:slide-out-to-bottom data-[state=open]:zoom-in-100 data-[state=open]:slide-in-from-bottom lg:hidden"
        >
          <span aria-hidden className="mx-auto -mt-2 h-1 w-9 rounded-full bg-border-strong" />
          <DialogHeader>
            <DialogTitle>Add a song</DialogTitle>
            <DialogDescription>Paste a link from YouTube.</DialogDescription>
          </DialogHeader>
          <AddSongForm spaceId={spaceId} onDone={done} autoFocus />
        </DialogContent>
      </Dialog>
      {message && <Toast message={message} onDismiss={dismiss} />}
    </>
  );
}
