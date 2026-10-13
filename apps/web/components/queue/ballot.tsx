"use client";

import { useCallback, useOptimistic, useState, useTransition } from "react";

import { voteAction } from "@/app/(app)/s/[slug]/actions";
import { Toast } from "@/components/ui/toast";
import { leadMargin, sortQueue } from "@/lib/queue/order";

import { QueueCard } from "./queue-card";
import { QueueRow, type QueueRowItem } from "./queue-row";
import { VoteButton } from "./vote-button";

type BallotItem = QueueRowItem & { addedAt: Date };
type Message = { text: string; undo?: () => void };

// The live ballot: votes apply instantly (re-sorted with the same rules as
// the server), then the server action saves them and the page refreshes.
export function Ballot({ items, canVote }: { items: BallotItem[]; canVote: boolean }) {
  const [, startTransition] = useTransition();
  const [message, setMessage] = useState<Message | null>(null);
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

  const leadBy = leadMargin(optimistic);
  return (
    <>
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
                disabled={!canVote}
                className="max-sm:size-11"
                onClick={() => vote(item.id, !item.hasVoted)}
              />
            }
          />
        ))}
      </QueueCard>
      {message && (
        <Toast
          message={message.text}
          action={message.undo ? { label: "Undo", onClick: message.undo } : undefined}
          onDismiss={dismiss}
        />
      )}
    </>
  );
}
