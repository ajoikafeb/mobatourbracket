"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Match, Settings } from "@/lib/types";

interface RoundSchedulerProps {
  matches: Match[];
  settings: Settings | null;
  onScheduled: () => void;
  onClose: () => void;
}

export function RoundScheduler({ matches, settings, onScheduled, onClose }: RoundSchedulerProps) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const matchDuration = settings?.match_duration_minutes || 45;
  const breakDuration = settings?.break_duration_minutes || 15;
  const bestOf = settings?.best_of || 3;

  const rounds = useMemo(() => {
    const roundMap = new Map<string, Match[]>();
    for (const m of matches) {
      if (!roundMap.has(m.round)) roundMap.set(m.round, []);
      roundMap.get(m.round)!.push(m);
    }
    const result: { name: string; matches: Match[]; scheduledCount: number; total: number }[] = [];
    for (const [name, roundMatches] of roundMap) {
      const sorted = roundMatches.sort((a, b) => a.match_index - b.match_index);
      const scheduledCount = sorted.filter(
        (m) => m.match_date && new Date(m.match_date).getTime() > new Date("2020-01-01").getTime()
      ).length;
      result.push({
        name,
        matches: sorted,
        scheduledCount,
        total: sorted.length,
      });
    }
    result.sort((a, b) => {
      const orderA = a.matches[0]?.round_order ?? 0;
      const orderB = b.matches[0]?.round_order ?? 0;
      return orderA - orderB;
    });
    return result;
  }, [matches]);

  const nextUnscheduledRound = useMemo(() => {
    for (const r of rounds) {
      if (r.scheduledCount < r.total) return r;
    }
    return null;
  }, [rounds]);

  const [startDate, setStartDate] = useState(() => {
    if (nextUnscheduledRound) {
      const lastScheduled = matches
        .filter((m) => m.round_order === (nextUnscheduledRound.matches[0]?.round_order ?? 1) - 1)
        .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())[0];
      if (lastScheduled) {
        const d = new Date(lastScheduled.match_date);
        d.setDate(d.getDate() + 1);
        return d.toISOString().split("T")[0];
      }
    }
    return new Date().toISOString().split("T")[0];
  });

  const [startTime, setStartTime] = useState("10:00");

  if (!nextUnscheduledRound) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#18181B]/95 backdrop-blur-xl p-6 mx-4"
        >
          <p className="text-zinc-300 text-center">All rounds are already scheduled.</p>
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-300">
              Close
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const handleSchedule = async () => {
    setSaving(true);
    setMessage("");
    try {
      const start = new Date(`${startDate}T${startTime}:00`);
      const updates: { id: string; match_date: string }[] = [];

      for (let i = 0; i < nextUnscheduledRound.matches.length; i++) {
        const match = nextUnscheduledRound.matches[i];
        const matchStart = new Date(start.getTime() + i * (matchDuration + breakDuration) * 60 * 1000);
        updates.push({ id: match.id, match_date: matchStart.toISOString() });
      }

      for (const u of updates) {
        const { error } = await supabase
          .from("matches")
          .update({ match_date: u.match_date })
          .eq("id", u.id);
        if (error) throw error;
      }

      setMessage(`${nextUnscheduledRound.name} scheduled! ${updates.length} match(es) updated.`);
      setTimeout(() => {
        onScheduled();
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Schedule error:", err);
      setMessage("Error scheduling round.");
    } finally {
      setSaving(false);
    }
  };

  const slotDuration = matchDuration + breakDuration;
  const totalMinutes = nextUnscheduledRound.matches.length * slotDuration;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#18181B]/95 backdrop-blur-xl p-6 mx-4 max-h-[85vh] overflow-y-auto"
      >
        <h2 className="text-lg font-bold text-white mb-1">Schedule Next Round</h2>
        <p className="text-sm text-zinc-400 mb-5">
          Set date & time for <span className="text-orange-400 font-medium">{nextUnscheduledRound.name}</span>
        </p>

        {message && (
          <div
            className={cn(
              "rounded-xl px-4 py-3 text-sm mb-4",
              message.includes("Error")
                ? "border border-red-500/30 bg-red-500/10 text-red-400"
                : "border border-green-500/30 bg-green-500/10 text-green-400"
            )}
          >
            {message}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/40"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Start Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/40"
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-xs text-zinc-500 mb-2">
              Auto-spacing: {matchDuration} min match + {breakDuration} min break = {slotDuration} min per slot
            </p>
            <p className="text-xs text-zinc-500">
              Total duration: ~{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m for{" "}
              {nextUnscheduledRound.matches.length} matches
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 mb-5">
          <p className="text-xs font-medium text-zinc-400 mb-2">Match Preview</p>
          <div className="space-y-1.5">
            {nextUnscheduledRound.matches.map((m, i) => {
              const matchStart = new Date(
                new Date(`${startDate}T${startTime}:00`).getTime() + i * slotDuration * 60 * 1000
              );
              const timeStr = matchStart.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });
              return (
                <div key={m.id} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">{timeStr}</span>
                  <span className="text-zinc-300 truncate mx-2">
                    {m.team_a || "TBD"} vs {m.team_b || "TBD"}
                  </span>
                  <span className="text-zinc-600">BO{m.best_of}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-zinc-700 text-zinc-300 hover:text-white"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Calendar className="h-4 w-4 mr-2" />
            )}
            Schedule
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
