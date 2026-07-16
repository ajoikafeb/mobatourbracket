"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Plus,
  Trash2,
  Save,
  Loader2,
  Wand2,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useMatches } from "@/hooks/use-matches";
import { cn } from "@/lib/utils";
import type { Match } from "@/lib/types";

type EditMatch = Partial<Match> & { id: string };

const ROUND_OPTIONS = ["Round of 64", "Round of 32", "Round of 16", "Quarter Final", "Semi Final", "Grand Final"];
const STATUS_OPTIONS = ["waiting", "live", "finished"] as const;
const BO_OPTIONS = [1, 3, 5];

function toLocalDatetime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalDatetime(val: string): string {
  return new Date(val).toISOString();
}

export default function AdminSchedulePage() {
  const { matches, loading, refetch } = useMatches();
  const [editMatches, setEditMatches] = useState<EditMatch[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (!loading && !initialized) {
      const sorted = [...matches].sort((a, b) => {
        const da = a.match_date ? new Date(a.match_date).getTime() : 0;
        const db = b.match_date ? new Date(b.match_date).getTime() : 0;
        return da - db;
      });
      setEditMatches(sorted);
      setInitialized(true);
    }
  }, [loading, initialized, matches]);

  if (loading) return <LoadingSkeleton />;

  function addMatch() {
    setEditMatches((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        team_a: "",
        team_b: "",
        score_a: 0,
        score_b: 0,
        status: "waiting",
        round: "Quarter Final",
        match_date: new Date().toISOString(),
        best_of: 3,
        winner: null,
      },
    ]);
  }

  function removeMatch(id: string) {
    setEditMatches((prev) => prev.filter((m) => m.id !== id));
  }

  function moveMatch(index: number, direction: "up" | "down") {
    setEditMatches((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function updateField(id: string, field: string, value: string | number) {
    setEditMatches((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      await supabase.from("matches").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const payload = editMatches.map(({ id, ...rest }) => ({
        ...rest,
        ...(id.startsWith("new-") ? {} : { id }),
      }));

      if (payload.length > 0) {
        const { error } = await supabase.from("matches").upsert(payload, { onConflict: "id" });
        if (error) throw error;
      }

      await refetch();
      setMessage("Schedule saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("Error saving schedule. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20">
              <Calendar className="h-5 w-5 text-orange-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Schedule Editor</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/schedule-generator"
              className="flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-orange-400"
            >
              <Wand2 className="h-4 w-4" />
              Auto-generate schedule &rarr;
            </Link>
            <Button variant="outline" onClick={addMatch}>
              <Plus className="h-4 w-4" />
              Add Match
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-xl border px-4 py-3 text-sm",
              message.includes("Error")
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-green-500/30 bg-green-500/10 text-green-400"
            )}
          >
            {message}
          </motion.div>
        )}

        {editMatches.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No matches scheduled"
            description="Add matches manually or use the auto-generator to create a bracket."
            action={
              <Link href="/admin/schedule-generator">
                <Button className="mt-2 bg-orange-500 hover:bg-orange-600 text-white">
                  <Wand2 className="h-4 w-4" />
                  Open Generator
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {editMatches.map((match, i) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
              >
                <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <GripVertical className="hidden sm:block h-4 w-4 text-zinc-600 shrink-0" />
                      <StatusBadge status={match.status as "waiting" | "live" | "finished"} />

                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Input
                          placeholder="Team A"
                          value={match.team_a || ""}
                          onChange={(e) => updateField(match.id, "team_a", e.target.value)}
                          className="h-9"
                        />
                        <span className="text-xs text-zinc-500 font-medium shrink-0">vs</span>
                        <Input
                          placeholder="Team B"
                          value={match.team_b || ""}
                          onChange={(e) => updateField(match.id, "team_b", e.target.value)}
                          className="h-9"
                        />
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => moveMatch(i, "up")}
                          disabled={i === 0}
                          className="p-1 text-zinc-500 transition-colors hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => moveMatch(i, "down")}
                          disabled={i === editMatches.length - 1}
                          className="p-1 text-zinc-500 transition-colors hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => removeMatch(match.id)}
                          className="p-1 text-zinc-500 transition-colors hover:text-orange-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pl-0 sm:pl-7">
                      <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Round</label>
                        <Select
                          value={match.round || "Quarter Final"}
                          onChange={(e) => updateField(match.id, "round", e.target.value)}
                          className="h-9"
                        >
                          {ROUND_OPTIONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Date &amp; Time</label>
                        <Input
                          type="datetime-local"
                          value={toLocalDatetime(match.match_date)}
                          onChange={(e) => updateField(match.id, "match_date", fromLocalDatetime(e.target.value))}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Best Of</label>
                        <Select
                          value={String(match.best_of || 3)}
                          onChange={(e) => updateField(match.id, "best_of", parseInt(e.target.value))}
                          className="h-9"
                        >
                          {BO_OPTIONS.map((b) => (
                            <option key={b} value={b}>BO{b}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Score A</label>
                        <Input
                          type="number"
                          min="0"
                          value={match.score_a ?? 0}
                          onChange={(e) => updateField(match.id, "score_a", parseInt(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Score B</label>
                        <Input
                          type="number"
                          min="0"
                          value={match.score_b ?? 0}
                          onChange={(e) => updateField(match.id, "score_b", parseInt(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Status</label>
                        <Select
                          value={match.status || "waiting"}
                          onChange={(e) => updateField(match.id, "status", e.target.value)}
                          className="h-9"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s === "waiting" ? "Waiting" : s === "live" ? "Live" : "Finished"}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
