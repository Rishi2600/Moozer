"use client";

import { useCallback, useOptimistic, useRef, useState, useTransition } from "react";

import { boostAction, playNextAction, removeSongAction, undoBoostAction, voteAction } from "@/app/(app)/s/[slug]/actions";
import { useLive } from "@/components/space/live";
import { RemovePersonDialog, type Person } from "@/components/space/remove-person-dialog";
import { Toast } from "@/components/ui/toast";
import { BOOST_VOTES } from "@/lib/queue/boost";
import { leadMargin, sortQueue } from "@/lib/queue/order";
import { useFlip } from "@/lib/use-flip";

import { BoostButton, BoostStatus, useRefreshAt } from "./boost";
import { QueueCard } from "./queue-card";
import { QueueRow, type QueueRowItem } from "./queue-row";
import { RowMenu } from "./row-menu";
import { VoteButton } from "./vote-button";

type BallotItem = QueueRowItem & { addedAt: Date; addedById: string; addedBy: { name: string } };
type Message = { text: string; undo?: () => void };

// The live ballot: votes and boosts apply instantly (re-sorted with the same
// rules as the server), then the server action saves them and the page refreshes.
type Wallet = { balance: number; nextFreeAt: Date | null };
type Viewer = { userId: string; name: string; isHost: boolean; spaceId: string; live: boolean; wallet: Wallet };
type Change = { kind: "vote"; id: string; voted: boolean } | { kind: "boost"; id: string; name: string };

export function Ballot({ items, canVote, viewer }: { items: BallotItem[]; canVote: boolean; viewer: Viewer }) {
  const [, startTransition] = useTransition();
  const offline = useLive().status === "offline";
  const [message, setMessage] = useState<Message | null>(null);
  const [removing, setRemoving] = useState<Person | null>(null);
  const [optimistic, apply] = useOptimistic(items, (current, change: Change) =>
    sortQueue(
      current.map((item) => {
        if (item.id !== change.id) return item;
        if (change.kind === "boost") return { ...item, votes: item.votes + BOOST_VOTES, boostedBy: [...item.boostedBy, change.name] };
        return item.hasVoted !== change.voted ? { ...item, hasVoted: change.voted, votes: item.votes + (change.voted ? 1 : -1) } : item;
      })
    )
  );
  // Boosts spent here that the server's wallet doesn't show yet; cleared
  // whenever a refresh brings a new wallet.
  const [spent, setSpent] = useState(0);
  const walletKey = `${viewer.wallet.balance}|${viewer.wallet.nextFreeAt?.getTime()}`;
  const [lastWalletKey, setLastWalletKey] = useState(walletKey);
  if (lastWalletKey !== walletKey) {
    setLastWalletKey(walletKey);
    setSpent(0);
  }
  const balance = viewer.wallet.balance - spent;
  useRefreshAt(viewer.wallet.nextFreeAt);
  const dismiss = useCallback(() => setMessage(null), []);

  function vote(id: string, voted: boolean, withUndo = true) {
    startTransition(async () => {
      apply({ kind: "vote", id, voted });
      const result = await voteAction(id, voted);
      if (!result.ok) setMessage({ text: result.error });
      else if (withUndo) setMessage({ text: voted ? "Vote added" : "Vote removed", undo: () => vote(id, !voted, false) });
      else setMessage(null);
    });
  }

  function boost(id: string) {
    setSpent((n) => n + 1);
    startTransition(async () => {
      apply({ kind: "boost", id, name: viewer.name });
      const result = await boostAction(id);
      if (!result.ok) {
        setSpent((n) => Math.max(0, n - 1));
        setMessage({ text: result.error });
        return;
      }
      setMessage({
        text: `Boosted: +${BOOST_VOTES} votes`,
        undo: () =>
          startTransition(async () => {
            const undone = await undoBoostAction(result.boostId);
            setMessage({ text: undone.ok ? "Boost undone. It's back with your boosts." : undone.error });
          }),
      });
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
      <QueueCard count={optimistic.length} status={canVote ? <BoostStatus balance={balance} nextFreeAt={viewer.wallet.nextFreeAt} /> : undefined}>
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
            boost={
              canVote && balance > 0 ? <BoostButton title={item.title} disabled={offline} onClick={() => boost(item.id)} /> : undefined
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
