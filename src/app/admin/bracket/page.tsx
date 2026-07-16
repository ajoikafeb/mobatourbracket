"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Swords, Save, Loader2, Trophy, Users, ChevronDown,
  ChevronUp, Trash2, Plus, Wand2,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { useBrackets } from "@/hooks/use-brackets";
import { useTeams } from "@/hooks/use-teams";
import { cn } from "@/lib/utils";
import { Bracket, RoundName, ROUND_ORDER, ROUND_CONFIG } from "@/lib/types";

const ROUND_SLOTS: Record<RoundName, number> = {
  "Round of 64": 64,
  "Round of 32": 32,
  "Round of 16": 16,
  "Quarter Final": 8,
  "Semi Final": 4,
  "Grand Final": 2,
  Champion: 1,
};

function makeBracket(round: RoundName, position: number, id?: string): Bracket {
  return {
    id: id ?? `new-${round}-${position}`,
    round,
    round_order: ROUND_ORDER.indexOf(round),
    position,
    team_name: "",
    team_seed: 0,
    team_id: null,
    opponent_id: null,
    match_id: null,
    is_winner: false,
    is_current: false,
    is_bye: false,
    created_at: "",
    updated_at: "",
  };
}

function buildEmptyBrackets(): Bracket[] {
  const out: Bracket[] = [];
  let pos = 0;
  for (const round of ROUND_ORDER) {
    for (let i = 0; i < ROUND_SLOTS[round]; i++) {
      out.push(makeBracket(round, pos++));
    }
  }
  return out;
}

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
    setEditBrackets(brackets.length === 0 ? buildEmptyBrackets() : [...brackets]);
    setInitialized(true);
  }, [loading, initialized, brackets]);

  if (loading) return <LoadingSkeleton />;

  const activeRounds = ROUND_ORDER.filter((r) =>
    editBrackets.some((b) => b.round === r),
  );
  const totalFilled = editBrackets.filter((b) => b.team_name).length;

  function updateBracket(
    id: string,
    field: keyof Bracket,
    value: string | number | boolean | null,
  ) {
    setEditBrackets((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const next = { ...b, [field]: value };
        if (field === "team_id" && value) {
          const team = teams.find((t) => t.id === value);
          if (team) next.team_name = team.team_name;
        }
        if (field === "team_name" && value) next.team_id = null;
        return next;
      }),
    );
  }

  function clearTeam(id: string) {
    setEditBrackets((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, team_id: null, team_name: "", team_seed: 0 } : b,
      ),
    );
  }

  function addRoundSlots(round: RoundName) {
    const existing = editBrackets.filter((b) => b.round === round).length;
    const toAdd = ROUND_SLOTS[round] - existing;
    if (toAdd <= 0) return;
    const maxPos = editBrackets.reduce((m, b) => Math.max(m, b.position), -1);
    const newSlots = Array.from({ length: toAdd }, (_, i) =>
      makeBracket(round, maxPos + 1 + i),
    );
    setEditBrackets((prev) => [...prev, ...newSlots]);
  }

  function removeRound(round: RoundName) {
    setEditBrackets((prev) => prev.filter((b) => b.round !== round));
    if (expandedRound === round) setExpandedRound(null);
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const { data: existingBrackets } = await supabase.from("brackets").select("id");
      if (existingBrackets && existingBrackets.length > 0) {
        const ids: string[] = existingBrackets.map((b: { id: string }) => b.id);
        const { error: delErr } = await supabase.from("brackets").delete().in("id", ids);
        if (delErr) throw delErr;
      }

      const toUpsert = editBrackets
        .filter((b) => b.team_name)
        .map(({ id, ...rest }) => ({
          ...rest,
          ...(id.startsWith("new-") ? {} : { id }),
        }));

      if (toUpsert.length > 0) {
        const { error } = await supabase
          .from("brackets")
          .upsert(toUpsert, { onConflict: "id" });
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
    <div className="min-h-screen bg-zinc-950 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20">
            <Swords className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Bracket Editor</h1>
            <p className="text-sm text-zinc-400">
              <Users className="inline h-3.5 w-3.5 mr-1" />
              {teams.length} teams · {totalFilled}/{editBrackets.length} slots filled
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/generate">
            <Button variant="outline" className="gap-2 border-zinc-700 text-zinc-300 hover:text-white">
              <Wand2 className="h-4 w-4" />
              Generate from players
            </Button>
          </Link>
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
            "rounded-xl px-4 py-3 text-sm",
            message.includes("Error")
              ? "border border-red-500/30 bg-red-500/10 text-red-400"
              : "border border-green-500/30 bg-green-500/10 text-green-400",
          )}
        >
          {message}
        </motion.div>
      )}

      <div className="space-y-4">
        {activeRounds.map((round, ri) => {
          const roundBrackets = editBrackets
            .filter((b) => b.round === round)
            .sort((a, b) => a.position - b.position);
          const isExpanded = expandedRound === round;
          const filledCount = roundBrackets.filter((b) => b.team_name).length;
          const cfg = ROUND_CONFIG[round];

          return (
            <motion.div
              key={round}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: ri * 0.05 }}
            >
              <Card className="overflow-hidden border-white/[0.06] bg-white/[0.03] backdrop-blur">
                <button
                  onClick={() => setExpandedRound(isExpanded ? null : round)}
                  className="flex items-center justify-between w-full p-5 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {round === "Champion" && (
                      <Trophy className="h-5 w-5 text-orange-400" />
                    )}
                    <h3 className="text-sm font-semibold text-white">
                      {cfg?.label ?? round}
                    </h3>
                    <span className="text-xs text-zinc-500">
                      {roundBrackets.length} slots · {filledCount} filled
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); removeRound(round); }}
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {isExpanded
                      ? <ChevronUp className="h-4 w-4 text-zinc-500" />
                      : <ChevronDown className="h-4 w-4 text-zinc-500" />}
                  </div>
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-white/[0.06]"
                  >
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {roundBrackets.map((bracket) => {
                        const linkedTeam = bracket.team_id
                          ? teams.find((t) => t.id === bracket.team_id)
                          : null;
                        return (
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
                                  onClick={() => updateBracket(bracket.id, "is_winner", !bracket.is_winner)}
                                  className={cn(
                                    "flex h-6 w-6 items-center justify-center rounded-lg border transition-colors",
                                    bracket.is_winner
                                      ? "border-orange-500/30 bg-orange-500/20 text-orange-400"
                                      : "border-white/[0.06] bg-white/5 text-zinc-600 hover:text-white",
                                  )}
                                >
                                  <Trophy className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => updateBracket(bracket.id, "is_current", !bracket.is_current)}
                                  className={cn(
                                    "flex h-6 w-6 items-center justify-center rounded-lg border transition-colors",
                                    bracket.is_current
                                      ? "border-red-500/30 bg-red-500/20"
                                      : "border-white/[0.06] bg-white/5",
                                  )}
                                >
                                  <span className={cn(
                                    "h-2 w-2 rounded-full",
                                    bracket.is_current ? "bg-red-400" : "bg-zinc-600",
                                  )} />
                                </button>
                              </div>
                            </div>

                            <Select
                              value={bracket.team_id || ""}
                              onChange={(e) => updateBracket(bracket.id, "team_id", e.target.value || null)}
                              className="h-9 text-xs"
                            >
                              <option value="">Select team...</option>
                              {teams.map((team) => (
                                <option key={team.id} value={team.id}>{team.team_name}</option>
                              ))}
                            </Select>

                            <Input
                              placeholder="Or type team name..."
                              value={bracket.team_id ? "" : bracket.team_name}
                              onChange={(e) => updateBracket(bracket.id, "team_name", e.target.value)}
                              className="h-9 text-xs"
                            />

                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                value={bracket.team_seed}
                                placeholder="Seed"
                                className="h-8 text-[10px]"
                                onChange={(e) => updateBracket(bracket.id, "team_seed", parseInt(e.target.value) || 0)}
                              />
                              {bracket.team_name && (
                                <button
                                  onClick={() => clearTeam(bracket.id)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>

                            {linkedTeam && (
                              <div className="flex items-center gap-1.5 text-[10px] text-orange-400">
                                <Users className="h-3 w-3" />
                                <span className="truncate">
                                  {linkedTeam.captain
                                    ? `Captain: ${linkedTeam.captain}`
                                    : "Linked to team"}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="px-5 pb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addRoundSlots(round)}
                        className="gap-1.5 border-dashed border-zinc-700 text-zinc-400 hover:text-white"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add slot
                      </Button>
                    </div>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          );
        })}

        {activeRounds.length === 0 && (
          <Card className="flex flex-col items-center justify-center p-16 border-white/[0.06] bg-white/[0.03]">
            <Swords className="h-10 w-10 text-zinc-600 mb-3" />
            <p className="text-zinc-400 text-sm mb-4">
              No rounds yet. Generate a bracket to get started.
            </p>
          <Link href="/admin/tournament-generator">
              <Button className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
                <Wand2 className="h-4 w-4" />
                Generate from players
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
