"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Swords, Save, Loader2, Trophy, Users, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { useBrackets } from "@/hooks/use-brackets";
import { useTeams } from "@/hooks/use-teams";
import { cn } from "@/lib/utils";
import type { Bracket, RoundName } from "@/lib/types";

const ROUNDS: { value: RoundName; label: string; count: number }[] = [
  { value: "Round of 16", label: "Round of 16", count: 16 },
  { value: "Quarter Final", label: "Quarter Final", count: 8 },
  { value: "Semi Final", label: "Semi Final", count: 4 },
  { value: "Grand Final", label: "Grand Final", count: 2 },
  { value: "Champion", label: "Champion", count: 1 },
];

export default function AdminBracketPage() {
  const { brackets, loading: bracketsLoading, refetch } = useBrackets();
  const { teams, loading: teamsLoading } = useTeams();
  const [editBrackets, setEditBrackets] = useState<Bracket[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [expandedRound, setExpandedRound] = useState<string | null>(null);
  const supabase = createClient();

  const loading = bracketsLoading || teamsLoading;

  useEffect(() => {
    if (loading || initialized) return;

    if (brackets.length === 0) {
      const initialBrackets: Bracket[] = [];
      let position = 0;
      ROUNDS.forEach((round) => {
        for (let i = 0; i < round.count; i++) {
          initialBrackets.push({
            id: `new-${round.value}-${i}`,
            round: round.value,
            position: position++,
            team_name: "",
            team_seed: position,
            team_id: null,
            opponent_id: null,
            match_id: null,
            is_winner: false,
            is_current: false,
            created_at: "",
            updated_at: "",
          });
        }
      });
      setEditBrackets(initialBrackets);
    } else {
      setEditBrackets([...brackets]);
    }
    setInitialized(true);
  }, [loading, initialized, brackets]);

  if (loading) return <LoadingSkeleton />;

  function updateBracket(
    id: string,
    field: keyof Bracket,
    value: string | number | boolean | null
  ) {
    setEditBrackets((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const updated = { ...b, [field]: value };
        if (field === "team_id" && value) {
          const team = teams.find((t) => t.id === value);
          if (team) updated.team_name = team.team_name;
        }
        return updated;
      })
    );
  }

  function clearTeam(id: string) {
    setEditBrackets((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, team_id: null, team_name: "", team_seed: 0 }
          : b
      )
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      const existingIds = editBrackets
        .filter((b) => !b.id.startsWith("new-"))
        .map((b) => b.id);

      if (existingIds.length > 0) {
        await supabase
          .from("brackets")
          .delete()
          .not("id", "in", `(${existingIds.join(",")})`);
      }

      const toUpsert = editBrackets
        .filter((b) => b.team_name)
        .map(({ id, ...rest }) => ({
          ...rest,
          ...(id.startsWith("new-") ? {} : { id }),
        }));

      if (toUpsert.length > 0) {
        const { error } = await supabase.from("brackets").upsert(toUpsert, {
          onConflict: "id",
        });
        if (error) throw error;
      }

      await refetch();
      setMessage("Bracket saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("Error saving bracket. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20">
            <Swords className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Bracket Editor</h1>
            <p className="text-sm text-zinc-400">
              Manage teams and bracket progression · {teams.length} teams available
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </Button>
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

      <div className="space-y-4">
        {ROUNDS.map((round) => {
          const roundBrackets = editBrackets
            .filter((b) => b.round === round.value)
            .sort((a, b) => a.position - b.position);
          const isExpanded = expandedRound === round.value;

          return (
            <motion.div
              key={round.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="overflow-hidden">
                <button
                  onClick={() =>
                    setExpandedRound(isExpanded ? null : round.value)
                  }
                  className="flex items-center justify-between w-full p-5 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {round.value === "Champion" && (
                      <Trophy className="h-5 w-5 text-orange-400" />
                    )}
                    <h3 className="text-sm font-semibold text-white">
                      {round.label}
                    </h3>
                    <span className="text-xs text-zinc-500">
                      {round.count} slots ·{" "}
                      {
                        roundBrackets.filter((b) => b.team_name).length
                      }{" "}
                      filled
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-zinc-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                  )}
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-white/[0.06]"
                  >
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {roundBrackets.map((bracket) => (
                        <div
                          key={bracket.id}
                          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-600 font-medium">
                              Slot #{bracket.position + 1}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  updateBracket(
                                    bracket.id,
                                    "is_winner",
                                    !bracket.is_winner
                                  )
                                }
                                className={cn(
                                  "flex h-6 w-6 items-center justify-center rounded-lg border transition-colors",
                                  bracket.is_winner
                                    ? "border-orange-500/30 bg-orange-500/20 text-orange-400"
                                    : "border-white/[0.06] bg-white/5 text-zinc-600 hover:text-white"
                                )}
                              >
                                <Trophy className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() =>
                                  updateBracket(
                                    bracket.id,
                                    "is_current",
                                    !bracket.is_current
                                  )
                                }
                                className={cn(
                                  "flex h-6 w-6 items-center justify-center rounded-lg border transition-colors",
                                  bracket.is_current
                                    ? "border-red-500/30 bg-red-500/20 text-red-400"
                                    : "border-white/[0.06] bg-white/5 text-zinc-600 hover:text-white"
                                )}
                              >
                                <span
                                  className={cn(
                                    "h-2 w-2 rounded-full",
                                    bracket.is_current
                                      ? "bg-red-400"
                                      : "bg-zinc-600"
                                  )}
                                />
                              </button>
                            </div>
                          </div>

                          <Select
                            value={bracket.team_id || ""}
                            onChange={(e) =>
                              updateBracket(
                                bracket.id,
                                "team_id",
                                e.target.value || null
                              )
                            }
                            className="h-9 text-xs"
                          >
                            <option value="">Select team...</option>
                            {teams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.team_name}
                              </option>
                            ))}
                          </Select>

                          <Input
                            placeholder="Or type team name..."
                            value={
                              bracket.team_id
                                ? ""
                                : bracket.team_name
                            }
                            onChange={(e) =>
                              updateBracket(
                                bracket.id,
                                "team_name",
                                e.target.value
                              )
                            }
                            className="h-9 text-xs"
                          />

                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min="0"
                              value={bracket.team_seed}
                              onChange={(e) =>
                                updateBracket(
                                  bracket.id,
                                  "team_seed",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="h-8 text-[10px]"
                              placeholder="Seed"
                            />
                            {bracket.team_name && (
                              <button
                                onClick={() => clearTeam(bracket.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:text-red-400 transition-colors flex-shrink-0"
                              >
                                ×
                              </button>
                            )}
                          </div>

                          {bracket.team_id && (
                            <div className="flex items-center gap-1.5 text-[10px] text-orange-400">
                              <Users className="h-3 w-3" />
                              <span className="truncate">
                                {teams.find((t) => t.id === bracket.team_id)
                                  ?.captain
                                  ? `Captain: ${
                                      teams.find(
                                        (t) => t.id === bracket.team_id
                                      )?.captain
                                    }`
                                  : "Linked to team"}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
