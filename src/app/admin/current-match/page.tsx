"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Radio, Save, Loader2, Shield, Trophy,
  Clock, Zap, CheckCircle2, ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useMatches } from "@/hooks/use-matches";
import { cn } from "@/lib/utils";
import type { Match } from "@/lib/types";

const STATUS_BUTTONS = [
  { value: "waiting" as const, label: "Waiting", icon: Clock },
  { value: "live" as const, label: "Live", icon: Zap },
  { value: "finished" as const, label: "Finished", icon: CheckCircle2 },
];

const STATUS_ACTIVE: Record<string, string> = {
  waiting: "border-zinc-400/40 bg-zinc-500/25 text-zinc-300 shadow-lg shadow-zinc-500/10",
  live: "border-red-500/50 bg-red-500/25 text-red-300 shadow-lg shadow-red-500/20",
  finished: "border-green-500/50 bg-green-500/25 text-green-300 shadow-lg shadow-green-500/20",
};

const INACTIVE_STYLE =
  "border-white/[0.06] bg-white/[0.03] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]";

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
  const displayMatch: Match | undefined = selectedId
    ? matches.find((m) => m.id === selectedId)
    : liveMatch;

  useEffect(() => {
    if (!selectedId && liveMatch) setSelectedId(liveMatch.id);
  }, [liveMatch, selectedId]);

  useEffect(() => {
    if (displayMatch) {
      setStatus(displayMatch.status);
      setScoreA(displayMatch.score_a);
      setScoreB(displayMatch.score_b);
      setWinner(displayMatch.winner || "");
    }
  }, [displayMatch]);

  function loadMatch(match: Match) {
    setSelectedId(match.id);
    setStatus(match.status);
    setScoreA(match.score_a);
    setScoreB(match.score_b);
    setWinner(match.winner || "");
    setMessage("");
  }

  function showMsg(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  }

  async function handleSave() {
    if (!selectedId) return;
    setSaving(true);
    setMessage("");
    try {
      const match = matches.find((m) => m.id === selectedId);
      const winnerTeamName = winner || null;
      let winnerTeamId: string | null = null;
      if (winnerTeamName && match) {
        winnerTeamId =
          winnerTeamName === match.team_a ? match.team_a_id :
          winnerTeamName === match.team_b ? match.team_b_id : null;
      }

      const { error } = await supabase
        .from("matches")
        .update({ status, score_a: scoreA, score_b: scoreB, winner: winnerTeamName, winner_id: winnerTeamId })
        .eq("id", selectedId);
      if (error) throw error;

      if (status === "finished" && winnerTeamName && winnerTeamId) {
        const { data: brackets } = await supabase
          .from("brackets")
          .select("id, round, position, match_id")
          .eq("match_id", selectedId);

        if (brackets && brackets.length > 0) {
          const currentBracket = brackets[0];
          const { data: nextBrackets } = await supabase
            .from("brackets")
            .select("id, round, position, match_id")
            .gt("round_order", currentBracket.round ?? "")
            .limit(2);

          if (nextBrackets && nextBrackets.length > 0) {
            const targetBracket = nextBrackets.find(
              (b: { position: number }) => b.position === Math.floor(currentBracket.position / 2)
            ) || nextBrackets[0];

            if (targetBracket) {
              await supabase
                .from("brackets")
                .update({ team_name: winnerTeamName, team_id: winnerTeamId })
                .eq("id", targetBracket.id);

              if (targetBracket.match_id) {
                const { data: nextMatch } = await supabase
                  .from("matches")
                  .select("team_a, team_a_id, team_b, team_b_id")
                  .eq("id", targetBracket.match_id)
                  .single();

                if (nextMatch) {
                  const isTeamA = targetBracket.position % 2 === 0;
                  await supabase
                    .from("matches")
                    .update(
                      isTeamA
                        ? { team_a: winnerTeamName, team_a_id: winnerTeamId }
                        : { team_b: winnerTeamName, team_b_id: winnerTeamId }
                    )
                    .eq("id", targetBracket.match_id);
                }
              }
            }
          }
        }
      }

      await refetch();
      showMsg("Match updated and bracket advanced!");
    } catch {
      showMsg("Error updating match. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStartNextMatch() {
    const nextWaiting = matches
      .filter((m) => m.status === "waiting")
      .sort((a, b) => a.round_order - b.round_order || a.match_index - b.match_index)[0];
    if (!nextWaiting) {
      showMsg("No waiting matches found.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      if (liveMatch && liveMatch.id !== nextWaiting.id) {
        const { error: finishErr } = await supabase
          .from("matches").update({ status: "finished" }).eq("id", liveMatch.id);
        if (finishErr) throw finishErr;
      }
      const { error } = await supabase
        .from("matches").update({ status: "live" }).eq("id", nextWaiting.id);
      if (error) throw error;
      await refetch();
      loadMatch({ ...nextWaiting, status: "live" });
      showMsg(`Started: ${nextWaiting.team_a} vs ${nextWaiting.team_b}`);
    } catch {
      showMsg("Error starting next match.");
    } finally {
      setSaving(false);
    }
  }

  async function handleFinishCurrent() {
    if (!liveMatch) return;
    setSaving(true);
    setMessage("");
    try {
      const { error } = await supabase
        .from("matches").update({ status: "finished" }).eq("id", liveMatch.id);
      if (error) throw error;
      await refetch();
      setStatus("finished");
      showMsg("Match finished!");
    } catch {
      showMsg("Error finishing match.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 border border-red-500/20">
          <Radio className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Current Match</h1>
          <p className="text-sm text-zinc-400">Manage the live match status and scores</p>
        </div>
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-xl border px-4 py-3 text-sm font-medium backdrop-blur-sm",
            message.includes("Error")
              ? "border-red-500/30 bg-red-500/10 text-red-400"
              : "border-green-500/30 bg-green-500/10 text-green-400"
          )}
        >
          {message}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="p-6 backdrop-blur-md bg-white/[0.03] border border-white/[0.06]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            Select Match
          </h3>
          <Select
            value={selectedId}
            onChange={(e) => {
              const m = matches.find((x) => x.id === e.target.value);
              if (m) loadMatch(m);
            }}
            className="h-12 text-sm"
          >
            <option value="">Select a match...</option>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.team_a} vs {m.team_b} — {m.round} ({m.status})
              </option>
            ))}
          </Select>
        </Card>
      </motion.div>

      {displayMatch && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-6"
        >
          {/* Controls */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="p-6 backdrop-blur-md bg-white/[0.03] border border-white/[0.06] space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Match Controls</h3>
                <StatusBadge status={status} />
              </div>

              {/* Status Buttons */}
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-2 block uppercase tracking-wider">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {STATUS_BUTTONS.map((s) => {
                    const Icon = s.icon;
                    const isActive = status === s.value;
                    return (
                      <button
                        key={s.value}
                        onClick={() => setStatus(s.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-sm font-semibold transition-all",
                          isActive ? STATUS_ACTIVE[s.value] : INACTIVE_STYLE
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Score Inputs */}
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-2 block uppercase tracking-wider">
                  Scores
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1.5 text-center font-medium">
                      {displayMatch.team_a}
                    </p>
                    <Input
                      type="number"
                      min="0"
                      value={scoreA}
                      onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
                      className="h-16 text-center text-3xl font-black border-white/[0.08] bg-white/[0.03]"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1.5 text-center font-medium">
                      {displayMatch.team_b}
                    </p>
                    <Input
                      type="number"
                      min="0"
                      value={scoreB}
                      onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
                      className="h-16 text-center text-3xl font-black border-white/[0.08] bg-white/[0.03]"
                    />
                  </div>
                </div>
              </div>

              {/* Winner */}
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-2 block uppercase tracking-wider">
                  Winner
                </label>
                <Select
                  value={winner}
                  onChange={(e) => setWinner(e.target.value)}
                  className="h-12 text-sm"
                >
                  <option value="">No winner yet</option>
                  <option value={displayMatch.team_a}>{displayMatch.team_a}</option>
                  <option value={displayMatch.team_b}>{displayMatch.team_b}</option>
                </Select>
              </div>

              {/* Best Of */}
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <Trophy className="h-4 w-4 text-yellow-400/70" />
                <span className="text-sm text-zinc-400">Best of</span>
                <span className="text-sm font-bold text-white ml-auto">
                  {displayMatch.best_of}
                </span>
              </div>

              {/* Save */}
              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 backdrop-blur-md bg-white/[0.03] border border-white/[0.06]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleStartNextMatch}
                  disabled={saving}
                  className="justify-start gap-3 h-auto py-4 border-white/[0.08] hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-400 transition-all"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/15">
                    <Zap className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold">Start Next Match</p>
                    <p className="text-xs text-zinc-500">Find next waiting match</p>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto text-zinc-600" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleFinishCurrent}
                  disabled={saving || !liveMatch}
                  className="justify-start gap-3 h-auto py-4 border-white/[0.08] hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-400 transition-all"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold">Finish Current Match</p>
                    <p className="text-xs text-zinc-500">Set live match to finished</p>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto text-zinc-600" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-2">
            <Card className="p-6 backdrop-blur-md bg-white/[0.03] border border-white/[0.06] sticky top-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-6 text-center">
                Live Preview
              </h3>
              <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-6 text-center">
                <div className="flex items-center justify-center gap-6">
                  <motion.div
                    key={`a-${scoreA}`}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="flex-1"
                  >
                    <div
                      className={cn(
                        "mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border transition-all",
                        winner === displayMatch.team_a
                          ? "bg-yellow-500/15 border-yellow-500/30"
                          : "bg-white/[0.04] border-white/[0.08]"
                      )}
                    >
                      {winner === displayMatch.team_a
                        ? <Trophy className="h-7 w-7 text-yellow-400" />
                        : <Shield className="h-7 w-7 text-zinc-400" />}
                    </div>
                    <p className="text-xs font-semibold text-zinc-400 truncate px-1">
                      {displayMatch.team_a}
                    </p>
                    <p className="text-4xl font-black text-white mt-1">{scoreA}</p>
                  </motion.div>

                  <span className="text-lg font-black text-zinc-600">VS</span>

                  <motion.div
                    key={`b-${scoreB}`}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="flex-1"
                  >
                    <div
                      className={cn(
                        "mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border transition-all",
                        winner === displayMatch.team_b
                          ? "bg-yellow-500/15 border-yellow-500/30"
                          : "bg-white/[0.04] border-white/[0.08]"
                      )}
                    >
                      {winner === displayMatch.team_b
                        ? <Trophy className="h-7 w-7 text-yellow-400" />
                        : <Shield className="h-7 w-7 text-orange-400/70" />}
                    </div>
                    <p className="text-xs font-semibold text-zinc-400 truncate px-1">
                      {displayMatch.team_b}
                    </p>
                    <p className="text-4xl font-black text-white mt-1">{scoreB}</p>
                  </motion.div>
                </div>

                {winner && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-2.5"
                  >
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm font-semibold text-yellow-300">{winner}</span>
                  </motion.div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Round</span>
                  <span className="text-zinc-300 font-medium">{displayMatch.round}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Best Of</span>
                  <span className="text-zinc-300 font-medium">{displayMatch.best_of}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Status</span>
                  <StatusBadge status={status} />
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
}
