"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Sparkles,
  Shuffle,
  Download,
  Loader2,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  Check,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Dice5,
  ListOrdered,
  Import,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useTeams } from "@/hooks/use-teams";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";
import type { Team } from "@/lib/types";
import {
  parsePlayers,
  generateTeams,
  generateBracket,
  validateTournament,
  determineBracketSize,
  mapTeamToDB,
  mapMatchToDB,
  type EngineTeam,
  type SeedingMode,
  type PlayerImportResult,
  type TeamGenerationResult,
} from "@/engine";

const SEEDING_OPTIONS: { value: SeedingMode; label: string; icon: typeof Import }[] = [
  { value: "imported", label: "Import Order", icon: ListOrdered },
  { value: "random", label: "Random Seed", icon: Dice5 },
];

export default function TournamentGeneratorPage() {
  const { refetch } = useTeams();
  const { settings } = useSettings();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [rawText, setRawText] = useState("");
  const [importResult, setImportResult] = useState<PlayerImportResult | null>(null);
  const [teamResult, setTeamResult] = useState<TeamGenerationResult | null>(null);
  const [teams, setTeams] = useState<EngineTeam[]>([]);
  const [playersPerTeam, setPlayersPerTeam] = useState(
    settings?.players_per_team || 5
  );
  const [seedingMode, setSeedingMode] = useState<SeedingMode>("imported");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleParsePlayers() {
    const result = parsePlayers(rawText);
    if (result.totalImported === 0) {
      setError("No valid usernames found.");
      return;
    }
    setImportResult(result);
    const teamGen = generateTeams(result.players, playersPerTeam);
    setTeamResult(teamGen);
    setTeams(teamGen.teams);
    setError("");
    setStep(2);
  }

  function handlePlayersPerTeamChange(value: number) {
    setPlayersPerTeam(value);
    if (importResult) {
      const teamGen = generateTeams(importResult.players, value);
      setTeamResult(teamGen);
      setTeams(teamGen.teams);
    }
  }

  function updateTeamName(index: number, name: string) {
    setTeams((prev) =>
      prev.map((t, i) => (i === index ? { ...t, name } : t))
    );
  }

  function movePlayer(teamIdx: number, playerIdx: number, dir: -1 | 1) {
    setTeams((prev) =>
      prev.map((t, i) => {
        if (i !== teamIdx) return t;
        const p = [...t.players];
        const swap = playerIdx + dir;
        if (swap < 0 || swap >= p.length) return t;
        [p[playerIdx], p[swap]] = [p[swap], p[playerIdx]];
        return { ...t, players: p };
      })
    );
  }

  function deletePlayer(teamIdx: number, playerIdx: number) {
    setTeams((prev) =>
      prev
        .map((t, i) => {
          if (i !== teamIdx) return t;
          return { ...t, players: t.players.filter((_, j) => j !== playerIdx) };
        })
        .filter((t) => t.players.length > 0)
    );
  }

  function addPlayerToTeam(teamIdx: number) {
    const name = prompt("Enter player username:");
    if (!name) return;
    const cleaned = name.replace(/^@/, "").trim().replace(/\s+/g, " ");
    if (!cleaned) return;
    setTeams((prev) =>
      prev.map((t, i) =>
        i === teamIdx
          ? { ...t, players: [...t.players, { username: cleaned, originalIndex: -1 }] }
          : t
      )
    );
  }

  function swapPlayersBetweenTeams(
    teamAIdx: number,
    playerAIdx: number,
    teamBIdx: number,
    playerBIdx: number
  ) {
    setTeams((prev) => {
      const newTeams = [...prev];
      const teamA = {
        ...newTeams[teamAIdx],
        players: [...newTeams[teamAIdx].players],
      };
      const teamB = {
        ...newTeams[teamBIdx],
        players: [...newTeams[teamBIdx].players],
      };
      const temp = teamA.players[playerAIdx];
      teamA.players[playerAIdx] = teamB.players[playerBIdx];
      teamB.players[playerBIdx] = temp;
      newTeams[teamAIdx] = teamA;
      newTeams[teamBIdx] = teamB;
      return newTeams;
    });
  }

  function createNewTeam() {
    setTeams((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        name: `Team ${prev.length + 1}`,
        players: [],
        seed: prev.length + 1,
        logo: null,
        isEliminated: false,
      },
    ]);
  }

  function deleteTeam(index: number) {
    setTeams((prev) => prev.filter((_, i) => i !== index));
  }

  function shuffleTeams() {
    const allPlayers = teams.flatMap((t) => t.players);
    const shuffled = [...allPlayers].sort(() => Math.random() - 0.5);
    const teamGen = generateTeams(shuffled, playersPerTeam);
    setTeams(teamGen.teams);
    setTeamResult(teamGen);
  }

  async function handleSaveAndGenerate() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const validation = validateTournament({
        teams,
        config: { playersPerTeam, bestOf: settings?.best_of || 3, seedingMode },
      });
      if (!validation.valid) {
        setError(validation.errors.map((e) => e.message).join(" "));
        return;
      }

      const { data: et } = await supabase.from("teams").select("id");
      if (et && et.length > 0)
        await supabase
          .from("teams")
          .delete()
          .in(
            "id",
            et.map((r: { id: string }) => r.id)
          );
      const { data: eb } = await supabase.from("brackets").select("id");
      if (eb && eb.length > 0)
        await supabase
          .from("brackets")
          .delete()
          .in(
            "id",
            eb.map((r: { id: string }) => r.id)
          );
      const { data: em } = await supabase.from("matches").select("id");
      if (em && em.length > 0)
        await supabase
          .from("matches")
          .delete()
          .in(
            "id",
            em.map((r: { id: string }) => r.id)
          );

      const { error: settingsErr } = await supabase
        .from("settings")
        .update({
          tournament_status: "upcoming",
        })
        .eq("id", settings?.id || "");
      if (settingsErr) throw settingsErr;

      const teamRows = teams.map((t) => mapTeamToDB(t));
      const { data: savedTeams, error: teamErr } = await supabase
        .from("teams")
        .insert(teamRows)
        .select();
      if (teamErr) throw teamErr;
      if (!savedTeams) throw new Error("Failed to save teams");

      const idMap = new Map<string, string>();
      for (const saved of savedTeams) {
        const original = teams.find((t) => t.name === saved.team_name);
        if (original) idMap.set(original.id, saved.id);
      }

      const mappedTeams = teams.map((t) => ({
        ...t,
        id: idMap.get(t.id) || t.id,
      }));

      const bracket = generateBracket(
        mappedTeams,
        seedingMode,
        settings?.best_of || 3
      );

      const bracketRows: Record<string, unknown>[] = [];
      for (const match of bracket.matches) {
        if (match.teamA) {
          bracketRows.push({
            round: match.round,
            round_order: match.roundOrder,
            position: match.matchIndex * 2,
            team_name: match.teamA.name,
            team_seed: match.teamA.seed,
            team_id: idMap.get(match.teamA.id) || match.teamA.id,
            is_bye: match.teamA.name === "BYE",
            is_winner: match.winnerId === match.teamA.id,
            is_current: false,
            match_id: null,
          });
        }
        if (match.teamB) {
          bracketRows.push({
            round: match.round,
            round_order: match.roundOrder,
            position: match.matchIndex * 2 + 1,
            team_name: match.teamB.name,
            team_seed: match.teamB.seed,
            team_id: idMap.get(match.teamB.id) || match.teamB.id,
            is_bye: match.teamB.name === "BYE",
            is_winner: match.winnerId === match.teamB.id,
            is_current: false,
            match_id: null,
          });
        }
      }

      if (bracketRows.length > 0) {
        const { error: bErr } = await supabase
          .from("brackets")
          .insert(bracketRows);
        if (bErr) throw bErr;
      }

      const matchRows = bracket.matches.map((m) => {
        const mapped = mapMatchToDB(m);
        return {
          ...mapped,
          team_a_id: mapped.team_a_id
            ? idMap.get(mapped.team_a_id as string) || mapped.team_a_id
            : null,
          team_b_id: mapped.team_b_id
            ? idMap.get(mapped.team_b_id as string) || mapped.team_b_id
            : null,
        };
      });
      if (matchRows.length > 0) {
        const { error: mErr } = await supabase.from("matches").insert(matchRows);
        if (mErr) throw mErr;
      }

      await refetch();
      setSuccess(
        `${savedTeams.length} teams and ${bracket.matches.length} matches generated!`
      );
      setStep(5);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save tournament");
    } finally {
      setSaving(false);
    }
  }

  const [swapA, setSwapA] = useState<{ team: number; player: number } | null>(
    null
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20">
          <Sparkles className="h-5 w-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Tournament Generator</h1>
          <p className="text-sm text-zinc-400">
            Paste players, generate teams, create bracket — all in one click
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { label: "Paste Players", icon: Users },
          { label: "Preview Teams", icon: Sparkles },
          { label: "Edit Teams", icon: Shuffle },
          { label: "Configure", icon: Settings },
          { label: "Save & Generate", icon: Download },
        ].map((s, i) => {
          const Icon = s.icon;
          const isActive = step === i + 1;
          const isDone = step > i + 1;
          return (
            <div key={s.label} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                    : isDone
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-white/5 text-zinc-500 border border-white/[0.06]"
                )}
              >
                {isDone ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                {s.label}
              </div>
              {i < 4 && (
                <ArrowRight className="h-3 w-3 text-zinc-600 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400"
        >
          <Check className="h-4 w-4 flex-shrink-0" />
          {success}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Paste Player Usernames
                </h3>
                <p className="text-xs text-zinc-500">
                  One per line. @ prefix auto-removed. Duplicates preserved with
                  warning.
                </p>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={
                  "@adicostyles\n@andyshicool\n@dfxyz69\n@dreanxv\n@jfxxx13"
                }
                className="w-full h-64 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/30 resize-none font-mono"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">
                  {importResult
                    ? `${importResult.totalImported} players detected`
                    : "0 players detected"}
                </span>
                <Button
                  onClick={handleParsePlayers}
                  disabled={rawText.trim().length === 0}
                >
                  <ArrowRight className="h-4 w-4" />
                  Next: Preview Teams
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 2 && importResult && teamResult && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Import Preview
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">
                      Players per team:
                    </span>
                    <Select
                      value={String(playersPerTeam)}
                      onChange={(e) =>
                        handlePlayersPerTeamChange(parseInt(e.target.value))
                      }
                      className="h-8 w-20 text-xs"
                    >
                      {[5, 6, 7].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allPlayers = teams.flatMap((t) => t.players);
                      const shuffled = [...allPlayers].sort(
                        () => Math.random() - 0.5
                      );
                      const tg = generateTeams(shuffled, playersPerTeam);
                      setTeams(tg.teams);
                      setTeamResult(tg);
                    }}
                  >
                    <Shuffle className="h-3.5 w-3.5" />
                    Regenerate
                  </Button>
                </div>
              </div>

              {importResult.duplicates.length > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="text-yellow-400 font-medium">
                      Duplicate usernames detected:
                    </p>
                    <p className="text-yellow-400/70 mt-1">
                      {importResult.duplicates
                        .map((d) => `"${d.username}" (${d.count}x)`)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-center">
                  <p className="text-2xl font-bold text-white">
                    {importResult.totalImported}
                  </p>
                  <p className="text-xs text-zinc-500">Imported Players</p>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-center">
                  <p className="text-2xl font-bold text-orange-400">
                    {teamResult.teamCount}
                  </p>
                  <p className="text-xs text-zinc-500">Generated Teams</p>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-center">
                  <p className="text-2xl font-bold text-zinc-400">
                    {teamResult.remainingCount}
                  </p>
                  <p className="text-xs text-zinc-500">Remaining</p>
                </div>
              </div>

              {teamResult.remainingCount > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-400">
                    {teamResult.remainingCount} player(s) are not assigned. They
                    will be excluded from the tournament.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1">
                {teams.map((team, i) => (
                  <div
                    key={team.id}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <p className="text-xs font-semibold text-orange-400 mb-2">
                      {team.name} ({team.players.length} players)
                    </p>
                    <div className="space-y-1">
                      {team.players.map((p, j) => (
                        <p key={j} className="text-xs text-zinc-400 truncate">
                          {j + 1}. {p.username}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>
                  <ArrowRight className="h-4 w-4" />
                  Next: Edit Teams
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Team Editor</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allPlayers = teams.flatMap((t) => t.players);
                      const shuffled = [...allPlayers].sort(
                        () => Math.random() - 0.5
                      );
                      const tg = generateTeams(shuffled, playersPerTeam);
                      setTeams(tg.teams);
                      setTeamResult(tg);
                    }}
                  >
                    <Shuffle className="h-3.5 w-3.5" />
                    Shuffle All
                  </Button>
                  <Button variant="outline" size="sm" onClick={createNewTeam}>
                    <Plus className="h-3.5 w-3.5" />
                    Add Team
                  </Button>
                </div>
              </div>

              {swapA && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-xs text-orange-400 flex items-center justify-between"
                >
                  <span>
                    Selected: {teams[swapA.team]?.name} →{" "}
                    {teams[swapA.team]?.players[swapA.player]?.username}
                  </span>
                  <button
                    onClick={() => setSwapA(null)}
                    className="text-orange-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </motion.div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {teams.map((team, ti) => (
                  <div
                    key={team.id}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Input
                        value={team.name}
                        onChange={(e) => updateTeamName(ti, e.target.value)}
                        className="h-7 text-xs font-semibold border-transparent bg-transparent p-0 focus:border-orange-500/30"
                      />
                      <button
                        onClick={() => deleteTeam(ti)}
                        className="text-zinc-600 hover:text-red-400 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      {team.players.map((p, pi) => (
                        <div key={pi} className="flex items-center gap-1">
                          <span className="text-[10px] text-zinc-600 w-4">
                            {pi + 1}
                          </span>
                          <span
                            className={cn(
                              "flex-1 text-xs truncate cursor-pointer",
                              swapA?.team === ti && swapA?.player === pi
                                ? "text-orange-400"
                                : "text-zinc-400"
                            )}
                            onClick={() => {
                              if (swapA) {
                                swapPlayersBetweenTeams(
                                  swapA.team,
                                  swapA.player,
                                  ti,
                                  pi
                                );
                                setSwapA(null);
                              } else {
                                setSwapA({ team: ti, player: pi });
                              }
                            }}
                          >
                            {p.username}
                          </span>
                          <button
                            onClick={() => movePlayer(ti, pi, -1)}
                            disabled={pi === 0}
                            className="text-zinc-600 hover:text-white disabled:opacity-20 p-0.5"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => movePlayer(ti, pi, 1)}
                            disabled={pi === team.players.length - 1}
                            className="text-zinc-600 hover:text-white disabled:opacity-20 p-0.5"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => deletePlayer(ti, pi)}
                            className="text-zinc-600 hover:text-red-400 p-0.5"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addPlayerToTeam(ti)}
                      className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-orange-400 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      Add player
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={() => setStep(4)}>
                  <ArrowRight className="h-4 w-4" />
                  Next: Configure
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 4 && !success && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white">
                Tournament Configuration
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <span className="text-xs text-zinc-400">Seeding Mode</span>
                  <div className="flex items-center gap-2">
                    {SEEDING_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setSeedingMode(opt.value)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                            seedingMode === opt.value
                              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:text-zinc-300"
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <span className="text-xs text-zinc-400">Best Of</span>
                  <span className="text-sm font-bold text-white">
                    BO{settings?.best_of || 3}
                  </span>
                </div>

                {(() => {
                  const bs = determineBracketSize(teams.length);
                  const byes = bs - teams.length;
                  return (
                    <>
                      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                        <span className="text-xs text-zinc-400">Bracket Size (auto)</span>
                        <span className="text-sm font-bold text-white">
                          {bs} slots
                          {byes > 0 && (
                            <span className="ml-1.5 text-xs font-normal text-zinc-500">
                              ({teams.length} teams + {byes} BYE{byes > 1 ? "s" : ""})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                        <span className="text-xs text-zinc-400">Rounds</span>
                        <span className="text-sm font-bold text-white">
                          {Math.log2(bs)} rounds
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <p className="text-xs text-zinc-500">This will:</p>
              <ul className="text-xs text-zinc-500 space-y-1 ml-4 list-disc">
                <li>Delete all existing teams, brackets, and matches</li>
                <li>Save {teams.length} teams with their players</li>
                <li>
                  Generate a {determineBracketSize(teams.length)}-slot single
                  elimination bracket
                  {determineBracketSize(teams.length) - teams.length > 0 && (
                    <> ({determineBracketSize(teams.length) - teams.length} BYE{determineBracketSize(teams.length) - teams.length > 1 ? "s" : ""})</>
                  )}
                </li>
              </ul>

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleSaveAndGenerate} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Generate Tournament
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 5 && success && (
          <motion.div
            key="step5-done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-10 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/20 border border-green-500/20">
                <Check className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Tournament Generated!
              </h3>
              <p className="text-sm text-zinc-400">{success}</p>
              <div className="flex items-center justify-center gap-3 pt-4">
                <Button
                  onClick={() => {
                    setStep(1);
                    setRawText("");
                    setImportResult(null);
                    setTeamResult(null);
                    setTeams([]);
                    setSuccess("");
                  }}
                >
                  Create Another
                </Button>
                <a href="/bracket" target="_blank">
                  <Button variant="outline">View Bracket</Button>
                </a>
                <a href="/admin/dashboard">
                  <Button variant="outline">Dashboard</Button>
                </a>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Settings(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
