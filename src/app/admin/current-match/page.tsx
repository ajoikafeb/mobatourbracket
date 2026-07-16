"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Radio, Save, Loader2, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useMatches } from "@/hooks/use-matches";
import { cn } from "@/lib/utils";
export default function AdminCurrentMatchPage() {
  const { matches, refetch } = useMatches();
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState<"waiting" | "live" | "finished">("waiting");
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [winner, setWinner] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  const liveMatch = matches.find((m) => m.status === "live");
  const displayMatch = selectedId
    ? matches.find((m) => m.id === selectedId)
    : liveMatch;

  const defaultStatus = useMemo(() => {
    if (displayMatch) {
      return displayMatch.status as "waiting" | "live" | "finished";
    }
    return "waiting" as const;
  }, [displayMatch]);

  const defaultScoreA = useMemo(() => displayMatch?.score_a ?? 0, [displayMatch]);
  const defaultScoreB = useMemo(() => displayMatch?.score_b ?? 0, [displayMatch]);
  const defaultWinner = useMemo(() => displayMatch?.winner || "", [displayMatch]);
  const defaultSelectedId = useMemo(() => displayMatch?.id || "", [displayMatch]);

  if (!selectedId && defaultSelectedId) {
    setSelectedId(defaultSelectedId);
    setStatus(defaultStatus);
    setScoreA(defaultScoreA);
    setScoreB(defaultScoreB);
    setWinner(defaultWinner);
  }

  async function handleSave() {
    if (!selectedId) return;
    setSaving(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("matches")
        .update({
          status,
          score_a: scoreA,
          score_b: scoreB,
          winner: winner || null,
        })
        .eq("id", selectedId);

      if (error) throw error;
      await refetch();
      setMessage("Match updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("Error updating match. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20">
            <Radio className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Current Match Editor
            </h1>
            <p className="text-sm text-zinc-400">
              Manage the live match status and scores
            </p>
          </div>
        </div>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-xl px-4 py-3 text-sm",
            message.includes("Error")
              ? "border border-red-500/30 bg-red-500/10 text-red-400"
              : "border border-green-500/30 bg-green-500/10 text-green-400"
          )}
        >
          {message}
        </motion.div>
      )}

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-white mb-4">
          Select Match
        </h3>
        <Select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="h-12"
        >
          <option value="">Select a match...</option>
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {m.team_a} vs {m.team_b} — {m.round} (
              {m.status})
            </option>
          ))}
        </Select>
      </Card>

      {selectedId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-semibold text-white">
                Match Controls
              </h3>
              {displayMatch && (
                <StatusBadge status={status} />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-2 block">
                    Status
                  </label>
                  <div className="flex gap-2">
                    {(["waiting", "live", "finished"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={cn(
                          "flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all border",
                          status === s
                            ? s === "live"
                              ? "border-red-500/30 bg-red-500/20 text-red-400"
                              : s === "finished"
                              ? "border-green-500/30 bg-green-500/20 text-green-400"
                              : "border-orange-500/30 bg-orange-500/20 text-orange-400"
                            : "border-white/[0.08] bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                        )}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">
                      Score {displayMatch?.team_a || "Team A"}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={scoreA}
                      onChange={(e) =>
                        setScoreA(parseInt(e.target.value) || 0)
                      }
                      className="h-12 text-center text-2xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">
                      Score {displayMatch?.team_b || "Team B"}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={scoreB}
                      onChange={(e) =>
                        setScoreB(parseInt(e.target.value) || 0)
                      }
                      className="h-12 text-center text-2xl font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">
                    Winner
                  </label>
                  <Select
                    value={winner}
                    onChange={(e) => setWinner(e.target.value)}
                    className="h-12"
                  >
                    <option value="">No winner yet</option>
                    {displayMatch?.team_a && (
                      <option value={displayMatch.team_a}>
                        {displayMatch.team_a}
                      </option>
                    )}
                    {displayMatch?.team_b && (
                      <option value={displayMatch.team_b}>
                        {displayMatch.team_b}
                      </option>
                    )}
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Card className="p-8 w-full text-center">
                  <div className="flex items-center justify-center gap-8">
                    <div>
                      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/[0.08]">
                        <Shield className="h-8 w-8 text-zinc-400" />
                      </div>
                      <p className="text-sm font-semibold text-white mb-1">
                        {displayMatch?.team_a || "TBD"}
                      </p>
                      <p className="text-4xl font-black text-white">
                        {scoreA}
                      </p>
                    </div>
                    <div className="text-zinc-500 text-lg font-bold">VS</div>
                    <div>
                      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/5 border border-orange-500/10">
                        <Shield className="h-8 w-8 text-orange-400" />
                      </div>
                      <p className="text-sm font-semibold text-white mb-1">
                        {displayMatch?.team_b || "TBD"}
                      </p>
                      <p className="text-4xl font-black text-orange-400">
                        {scoreB}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} size="lg">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Update Match
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
