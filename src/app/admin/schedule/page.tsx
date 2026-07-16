"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Plus,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
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

type EditableMatch = Partial<Match> & { id: string };

export default function AdminSchedulePage() {
  const { matches, loading, refetch } = useMatches();
  const [editMatches, setEditMatches] = useState<EditableMatch[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (!loading && !initialized) {
      setEditMatches([...matches]);
      setInitialized(true);
    }
  }, [loading, initialized, matches]);

  if (loading) return <LoadingSkeleton />;

  function addMatch() {
    const newMatch: EditableMatch = {
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
    };
    setEditMatches((prev) => [...prev, newMatch]);
  }

  function removeMatch(id: string) {
    setEditMatches((prev) => prev.filter((m) => m.id !== id));
  }

  function updateMatch(id: string, field: string, value: string | number) {
    setEditMatches((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      const existingIds = editMatches
        .filter((m) => !m.id.startsWith("new-"))
        .map((m) => m.id);

      if (existingIds.length > 0) {
        await supabase
          .from("matches")
          .delete()
          .not("id", "in", `(${existingIds.join(",")})`);
      }

      const toUpsert = editMatches.map(({ id, ...rest }) => ({
        ...rest,
        ...(id.startsWith("new-") ? {} : { id }),
      }));

      if (toUpsert.length > 0) {
        const { error } = await supabase.from("matches").upsert(toUpsert, {
          onConflict: "id",
        });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
            <Calendar className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Schedule Editor</h1>
            <p className="text-sm text-zinc-400">
              Manage match schedule and details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={addMatch}>
            <Plus className="h-4 w-4" />
            Add Match
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>
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

      {editMatches.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No matches"
          description="Click 'Add Match' to create your first match."
        />
      ) : (
        <div className="space-y-4">
          {editMatches.map((match, i) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={match.status as "waiting" | "live" | "finished"} />
                    <span className="text-xs text-zinc-500">
                      {match.id.startsWith("new-") ? "New" : match.id.slice(0, 8)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeMatch(match.id)}
                    className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">
                      Team A
                    </label>
                    <Input
                      placeholder="Team A"
                      value={match.team_a || ""}
                      onChange={(e) =>
                        updateMatch(match.id, "team_a", e.target.value)
                      }
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">
                      Team B
                    </label>
                    <Input
                      placeholder="Team B"
                      value={match.team_b || ""}
                      onChange={(e) =>
                        updateMatch(match.id, "team_b", e.target.value)
                      }
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">
                      Round
                    </label>
                    <Select
                      value={match.round || "Quarter Final"}
                      onChange={(e) =>
                        updateMatch(match.id, "round", e.target.value)
                      }
                      className="h-10"
                    >
                      <option value="Round of 16">Round of 16</option>
                      <option value="Quarter Final">Quarter Final</option>
                      <option value="Semi Final">Semi Final</option>
                      <option value="Grand Final">Grand Final</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">
                      Status
                    </label>
                    <Select
                      value={match.status || "waiting"}
                      onChange={(e) =>
                        updateMatch(match.id, "status", e.target.value)
                      }
                      className="h-10"
                    >
                      <option value="waiting">Waiting</option>
                      <option value="live">Live</option>
                      <option value="finished">Finished</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">
                      Date & Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={
                        match.match_date
                          ? new Date(match.match_date).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        updateMatch(
                          match.id,
                          "match_date",
                          new Date(e.target.value).toISOString()
                        )
                      }
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">
                      Best Of
                    </label>
                    <Select
                      value={String(match.best_of || 3)}
                      onChange={(e) =>
                        updateMatch(match.id, "best_of", parseInt(e.target.value))
                      }
                      className="h-10"
                    >
                      <option value="1">BO1</option>
                      <option value="3">BO3</option>
                      <option value="5">BO5</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">
                      Score A
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={match.score_a ?? 0}
                      onChange={(e) =>
                        updateMatch(match.id, "score_a", parseInt(e.target.value) || 0)
                      }
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">
                      Score B
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={match.score_b ?? 0}
                      onChange={(e) =>
                        updateMatch(match.id, "score_b", parseInt(e.target.value) || 0)
                      }
                      className="h-10"
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
