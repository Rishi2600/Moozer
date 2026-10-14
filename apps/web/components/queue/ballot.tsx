"use client";

import { useCallback, useOptimistic, useRef, useState, useTransition } from "react";

import { playNextAction, removeSongAction, voteAction } from "@/app/(app)/s/[slug]/actions";
import { useLive } from "@/components/space/live";
import { RemovePersonDialog, type Person } from "@/components/space/remove-person-dialog";
import { Toast } from "@/components/ui/toast";
import { leadMargin, sortQueue } from "@/lib/queue/order";
import { useFlip } from "@/lib/use-flip";

import { QueueCard } from "./queue-card";
import { QueueRow, type QueueRowItem } from "./queue-row";
import { RowMenu } from "./row-menu";
import { VoteButton } from "./vote-button";

type BallotItem = QueueRowItem & { addedAt: Date; addedById: string; addedBy: { name: string } };
type Message = { text: string; undo?: () => void };

// The live ballot: votes apply instantly (re-sorted with the same rules as
// the server), then the server action saves them and the page refreshes.
type Viewer = { userId: string; isHost: boolean; spaceId: string; live: boolean };

export function Ballot({ items, canVote, viewer }: { items: BallotItem[]; canVote: boolean; viewer: Viewer }) {
  const [, startTransition] = useTransition();
  const offline = useLive().status === "offline";
  const [message, setMessage] = useState<Message | null>(null);
  const [removing, setRemoving] = useState<Person | null>(null);
  const [optimistic, applyVote] = useOptimistic(items, (current, change: { id: string; voted: boolean }) =>
    sortQueue(
      current.map((item) =>
        item.id === change.id && item.hasVoted !== change.voted
          ? { ...item, hasVoted: change.voted, votes: item.votes + (change.voted ? 1 : -1) }
          : item
      )
    )
  );
  const dismiss = useCallback(() => setMessage(null), []);

  function vote(id: string, voted: boolean, withUndo = true) {
    startTransition(async () => {
      applyVote({ id, voted });
      const result = await voteAction(id, voted);
      if (!result.ok) setMessage({ text: result.error });
      else if (withUndo) setMessage({ text: voted ? "Vote added" : "Vote removed", undo: () => vote(id, !voted, false) });
      else setMessage(null);
    });
  }

  function act(run: () => Promise<{ ok: boolean; error?: string }>, done: string) {
    startTransition(async () => {
      const result = await run();
      setMessage({ text: result.ok ? done : (result.error ?? "Something didn't work. Try again.") });
    });
  }

  const leadBy = leadMargin(optimistic);
  const list = useRef<HTMLDivElement>(null);
  useFlip(list, optimistic.map((item) => item.id).join(","));
  return (
    <div ref={list} className="contents">
      <QueueCard count={optimistic.length}>
        {optimistic.map((item, index) => (
          <QueueRow
            key={item.id}
            item={item}
            leadBy={index === 0 ? leadBy : undefined}
            vote={
              <VoteButton
                voted={item.hasVoted}
                title={item.title}
                disabled={!canVote || offline}
                className="max-sm:size-11"
                onClick={() => vote(item.id, !item.hasVoted)}
              />
            }
            menu={
              canVote && (viewer.isHost || item.addedById === viewer.userId) ? (
                <RowMenu
                  title={item.title}
                  canPlay={viewer.isHost && viewer.live}
                  onPlayNow={() => act(() => playNextAction(viewer.spaceId, item.id), "Playing now")}
                  onRemove={() => act(() => removeSongAction(item.id), "Removed from queue")}
                  removePerson={
                    viewer.isHost && item.addedById !== viewer.userId
                      ? { name: item.addedBy.name, onSelect: () => setRemoving({ id: item.addedById, name: item.addedBy.name }) }
                      : undefined
                  }
                />
              ) : undefined
            }
          />
        ))}
      </QueueCard>
      {viewer.isHost && <RemovePersonDialog spaceId={viewer.spaceId} person={removing} onClose={() => setRemoving(null)} />}
      {message && (
        <Toast
          message={message.text}
          action={message.undo ? { label: "Undo", onClick: message.undo } : undefined}
          onDismiss={dismiss}
        />
      )}
    </div>
  );
}
