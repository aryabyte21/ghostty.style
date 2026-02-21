"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

interface VoteButtonProps {
  configId: string;
  initialCount: number;
}

export default function VoteButton({ configId, initialCount }: VoteButtonProps) {
  const [voted, setVoted] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  // Synchronous guard against double-clicks (state updates are async/batched)
  const busyRef = useRef(false);

  useEffect(() => {
    try {
      const votes = JSON.parse(localStorage.getItem("ghostty-votes") || "{}");
      if (votes[configId]) setVoted(true);
    } catch {
      // localStorage unavailable or corrupted
    }
  }, [configId]);

  async function handleVote() {
    if (busyRef.current) return;
    busyRef.current = true;
    setLoading(true);

    const newVoted = !voted;
    // Optimistic update
    setVoted(newVoted);
    setCount((c) => (newVoted ? c + 1 : c - 1));
    setError(false);

    try {
      const res = await fetch(`/api/configs/${configId}/vote`, {
        method: newVoted ? "POST" : "DELETE",
      });

      if (res.status === 409) {
        // Already voted — revert optimistic increment, keep voted state
        setVoted(true);
        setCount((c) => (newVoted ? c - 1 : c)); // undo the optimistic +1
        // Sync localStorage
        try {
          const votes = JSON.parse(localStorage.getItem("ghostty-votes") || "{}");
          votes[configId] = true;
          localStorage.setItem("ghostty-votes", JSON.stringify(votes));
        } catch { /* ignore */ }
        return;
      }

      if (!res.ok) {
        setVoted(!newVoted);
        setCount((c) => (newVoted ? c - 1 : c + 1));
        setError(true);
        setTimeout(() => setError(false), 3000);
        return;
      }

      const data = await res.json().catch(() => null);
      if (data?.voteCount !== undefined) {
        setCount(data.voteCount);
      }

      // Sync localStorage
      try {
        const votes = JSON.parse(localStorage.getItem("ghostty-votes") || "{}");
        if (newVoted) votes[configId] = true;
        else delete votes[configId];
        localStorage.setItem("ghostty-votes", JSON.stringify(votes));
      } catch { /* ignore */ }
    } catch {
      setVoted(!newVoted);
      setCount((c) => (newVoted ? c - 1 : c + 1));
      setError(true);
      setTimeout(() => setError(false), 3000);
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }

  return (
    <Button
      variant={error ? "destructive" : voted ? "default" : "outline"}
      size="sm"
      onClick={handleVote}
      disabled={loading}
      className="gap-1.5"
      title={error ? "Vote failed — try again" : undefined}
    >
      <Heart
        className={`h-4 w-4 ${voted ? "fill-current" : ""}`}
      />
      {count}
    </Button>
  );
}
