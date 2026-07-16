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
  Copy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useTeams } from "@/hooks/use-teams";
import { cn } from "@/lib/utils";
import type { Team, RoundName } from "@/lib/types";

const ROUND_ORDER: RoundName[] = [
  "Round of 64",
  "Round of 32",
  "Round of 16",
  "Quarter Final",
  "Semi Final",
  "Grand Final",
  "Champion",
];

const STEP_LABELS = [
  { label: "Paste Players", icon: Users },
  { label: "Preview Teams", icon: Sparkles },
  { label: "Edit Teams", icon: Shuffle },
  { label: "Save & Generate", icon: Download },
];

function parseUsernames(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.replace(/^@/, "").trim())
    .filter((line) => line.length > 0)
    .map((name) => name.replace(/\s+/g, " "))
    .filter((name, i, arr) => arr.indexOf(name) === i);
}

function generateTeamGroups(
  players: string[],
  perTeam: number
): Array<{ name: string; players: string[] }> {
  const teams: Array<{ name: string; players: string[] }> = [];
  for (let i = 0; i < players.length; i += perTeam) {
    const chunk = players.slice(i, i + perTeam);
    teams.push({ name: `Team ${teams.length + 1}`, players: chunk });
  }
  return teams;
}

function getBracketSize(teamCount: number): number {
  let size = 2;
  while (size < teamCount) size *= 2;
  return size;
}

function getRoundName(size: number): RoundName | null {
  if (size === 64) return "Round of 64";
  if (size === 32) return "Round of 32";
  if (size === 16) return "Round of 16";
  if (size === 8) return "Quarter Final";
  if (size === 4) return "Semi Final";
  if (size === 2) return "Grand Final";
  return null;
}

function getRoundsForBracket(bracketSize: number): RoundName[] {
  const rounds: RoundName[] = [];
  let size = bracketSize;
  while (size >= 2) {
    const name = getRoundName(size);
    if (name) rounds.push(name);
    size /= 2;
  }
  rounds.push("Champion");
  return rounds;
}

function buildSeededPairs(n: number): [number, number][] {
  if (n <= 1) return [];
  const pairs: [number, number][] = [];
  const order = seededOrder(n);
  for (let i = 0; i < n / 2; i++) {
    pairs.push([order[i * 2], order[i * 2 + 1]]);
  }
  return pairs;
}

function seededOrder(n: number): number[] {
  if (n === 1) return [0];
  const half = n / 2;
  const prev = seededOrder(half);
  const result: number[] = [];
  for (const s of prev) {
    result.push(s);
    result.push(n - 1 - s);
  }
  return result;
}

function buildBracket(
  teamNames: string[],
  teamIds: string[]
): { bracketSlots: BracketSlot[]; matchRows: MatchRow[] } {
  const totalTeams = teamNames.length;
  const bracketSize = getBracketSize(totalTeams);
  const rounds = getRoundsForBracket(bracketSize);

  const bracketSlots: BracketSlot[] = [];
  const matchRows: MatchRow[] = [];

  let pos = 0;
  for (const round of rounds) {
    const roundSize =
      round === "Champion"
        ? 1
        : round === "Grand Final"
        ? 2
        : round === "Semi Final"
        ? 4
        : round === "Quarter Final"
        ? 8
        : round === "Round of 16"
        ? 16
        : round === "Round of 32"
        ? 32
        : 64;

    for (let i = 0; i < roundSize; i++) {
      bracketSlots.push({
        round,
        round_order: ROUND_ORDER.indexOf(round),
        position: pos++,
        team_name: "",
        team_seed: 0,
        team_id: null,
        is_bye: false,
        is_winner: false,
        is_current: false,
      });
    }
  }

  const firstRoundName = getRoundName(bracketSize)!;
  const firstRoundSlots = bracketSlots.filter((b) => b.round === firstRoundName);

  const order = seededOrder(bracketSize);
  for (let i = 0; i < bracketSize; i++) {
    const seedIdx = order[i];
    if (seedIdx < totalTeams) {
      firstRoundSlots[i].team_name = teamNames[seedIdx];
      firstRoundSlots[i].team_seed = seedIdx + 1;
      firstRoundSlots[i].team_id = teamIds[seedIdx];
    } else {
      firstRoundSlots[i].team_name = "BYE";
      firstRoundSlots[i].is_bye = true;
      firstRoundSlots[i].team_seed = seedIdx + 1;
    }
  }

  let matchIndex = 0;
  let currentRoundSize = bracketSize;

  while (currentRoundSize >= 2) {
    const roundName = getRoundName(currentRoundSize)!;
    const roundSlots = bracketSlots.filter((b) => b.round === roundName);
    const nextRoundName =
      currentRoundSize === 2 ? "Champion" : getRoundName(currentRoundSize / 2)!;
    const nextRoundSlots = bracketSlots.filter((b) => b.round === nextRoundName);

    const pairs = buildSeededPairs(currentRoundSize);

    for (const [a, b] of pairs) {
      const slotA = roundSlots[a];
      const slotB = roundSlots[b];

      const isByeA = slotA.is_bye || !slotA.team_name;
      const isByeB = slotB.is_bye || !slotB.team_name;

      if (isByeA && !isByeB) {
        const nextSlot = nextRoundSlots.find((s) => !s.team_name);
        if (nextSlot) {
          nextSlot.team_name = slotB.team_name;
          nextSlot.team_seed = slotB.team_seed;
          nextSlot.team_id = slotB.team_id;
        }
      } else if (!isByeA && isByeB) {
        const nextSlot = nextRoundSlots.find((s) => !s.team_name);
        if (nextSlot) {
          nextSlot.team_name = slotA.team_name;
          nextSlot.team_seed = slotA.team_seed;
          nextSlot.team_id = slotA.team_id;
        }
      } else if (!isByeA && !isByeB) {
        matchRows.push({
          team_a: slotA.team_name,
          team_a_id: slotA.team_id,
          team_b: slotB.team_name,
          team_b_id: slotB.team_id,
          score_a: 0,
          score_b: 0,
          status: "waiting",
          round: roundName,
          round_order: ROUND_ORDER.indexOf(roundName),
          match_index: matchIndex++,
          match_date: new Date().toISOString(),
          best_of: 3,
          winner: null,
          winner_id: null,
          bracket_slot: null,
        });
      }
    }

    currentRoundSize /= 2;
  }

  return { bracketSlots, matchRows };
}

interface BracketSlot {
  round: RoundName;
  round_order: number;
  position: number;
  team_name: string;
  team_seed: number;
  team_id: string | null;
  is_bye: boolean;
  is_winner: boolean;
  is_current: boolean;
}

interface MatchRow {
  team_a: string;
  team_a_id: string | null;
  team_b: string;
  team_b_id: string | null;
  score_a: number;
  score_b: number;
  status: "waiting";
  round: string;
  round_order: number;
  match_index: number;
  match_date: string;
  best_of: number;
  winner: string | null;
  winner_id: string | null;
  bracket_slot: number | null;
}

export default function TournamentGeneratorPage() {
  const { refetch } = useTeams();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [rawText, setRawText] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [teams, setTeams] = useState<Array<{ name: string; players: string[] }>>([]);
  const [playersPerTeam, setPlayersPerTeam] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const parsedPlayers = useMemo(() => parseUsernames(rawText), [rawText]);

  const teamCount = useMemo(
    () => Math.ceil(players.length / playersPerTeam) || 0,
    [players, playersPerTeam]
  );
  const remainingPlayers = useMemo(
    () => players.length % playersPerTeam || 0,
    [players, playersPerTeam]
  );

  function handleParsePlayers() {
    if (parsedPlayers.length === 0) {
      setError("No valid usernames found.");
      return;
    }
    setPlayers(parsedPlayers);
    setTeams(generateTeamGroups(parsedPlayers, playersPerTeam));
    setError("");
    setStep(2);
  }

  function handleRegenerateTeams() {
    setTeams(generateTeamGroups(players, playersPerTeam));
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
        i === teamIdx ? { ...t, players: [...t.players, cleaned] } : t
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
      const teamA = { ...newTeams[teamAIdx], players: [...newTeams[teamAIdx].players] };
      const teamB = { ...newTeams[teamBIdx], players: [...newTeams[teamBIdx].players] };
      const temp = teamA.players[playerAIdx];
      teamA.players[playerAIdx] = teamB.players[playerBIdx];
      teamB.players[playerBIdx] = temp;
      newTeams[teamAIdx] = teamA;
      newTeams[teamBIdx] = teamB;
      return newTeams;
    });
  }

  function createNewTeam() {
    setTeams((prev) => [...prev, { name: `Team ${prev.length + 1}`, players: [] }]);
  }

  function deleteTeam(index: number) {
    setTeams((prev) => prev.filter((_, i) => i !== index));
  }

  function shuffleTeams() {
    const allPlayers = teams.flatMap((t) => t.players);
    const shuffled = [...allPlayers].sort(() => Math.random() - 0.5);
    setTeams(generateTeamGroups(shuffled, playersPerTeam));
  }

  async function handleSaveAndGenerate() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { data: et } = await supabase.from("teams").select("id");
      if (et && et.length > 0)
        await supabase.from("teams").delete().in("id", et.map((r: { id: string }) => r.id));
      const { data: eb } = await supabase.from("brackets").select("id");
      if (eb && eb.length > 0)
        await supabase.from("brackets").delete().in("id", eb.map((r: { id: string }) => r.id));
      const { data: em } = await supabase.from("matches").select("id");
      if (em && em.length > 0)
        await supabase.from("matches").delete().in("id", em.map((r: { id: string }) => r.id));

      const teamRows = teams.map((t, i) => ({
        team_name: t.name,
        logo: null,
        captain: t.players[0] || "",
        player_1: t.players[0] || "",
        player_2: t.players[1] || "",
        player_3: t.players[2] || "",
        player_4: t.players[3] || "",
        player_5: t.players[4] || "",
        substitute: t.players[5] || null,
        seed: i + 1,
      }));

      const { data: savedTeams, error: teamErr } = await supabase
        .from("teams")
        .insert(teamRows)
        .select();

      if (teamErr) throw teamErr;
      if (!savedTeams) throw new Error("Failed to save teams");

      const tNames = savedTeams.map((t: Team) => t.team_name);
      const tIds = savedTeams.map((t: Team) => t.id);
      const { bracketSlots, matchRows } = buildBracket(tNames, tIds);

      if (bracketSlots.length > 0) {
        const { error: bErr } = await supabase.from("brackets").insert(
          bracketSlots.map((b) => ({
            round: b.round,
            round_order: b.round_order,
            position: b.position,
            team_name: b.team_name,
            team_seed: b.team_seed,
            team_id: b.team_id,
            is_bye: b.is_bye,
            is_winner: b.is_winner,
            is_current: b.is_current,
          }))
        );
        if (bErr) throw bErr;
      }

      if (matchRows.length > 0) {
        const { error: mErr } = await supabase.from("matches").insert(matchRows);
        if (mErr) throw mErr;
      }

      await refetch();
      setSuccess(
        `${savedTeams.length} teams and ${matchRows.length} matches generated!`
      );
      setStep(4);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save tournament");
    } finally {
      setSaving(false);
    }
  }

  const [swapA, setSwapA] = useState<{ team: number; player: number } | null>(null);

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
        {STEP_LABELS.map((s, i) => {
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
              {i < STEP_LABELS.length - 1 && (
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
                  One per line. @ prefix auto-removed. Duplicates removed.
                </p>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={"@adicostyles\n@andyshicool\n@dfxyz69\n@dreanxv\n@jfxxx13"}
                className="w-full h-64 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/30 resize-none font-mono"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">
                  {parsedPlayers.length} player{parsedPlayers.length !== 1 ? "s" : ""} detected
                </span>
                <Button onClick={handleParsePlayers} disabled={parsedPlayers.length === 0}>
                  <ArrowRight className="h-4 w-4" />
                  Next: Preview Teams
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Import Preview</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Players per team:</span>
                    <Select
                      value={String(playersPerTeam)}
                      onChange={(e) => {
                        setPlayersPerTeam(parseInt(e.target.value));
                        setTeams(generateTeamGroups(players, parseInt(e.target.value)));
                      }}
                      className="h-8 w-20 text-xs"
                    >
                      {[3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleRegenerateTeams}>
                    <Shuffle className="h-3.5 w-3.5" />
                    Regenerate
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-center">
                  <p className="text-2xl font-bold text-white">{players.length}</p>
                  <p className="text-xs text-zinc-500">Total Players</p>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-center">
                  <p className="text-2xl font-bold text-orange-400">{teams.length}</p>
                  <p className="text-xs text-zinc-500">Teams</p>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-center">
                  <p className="text-2xl font-bold text-zinc-400">{remainingPlayers}</p>
                  <p className="text-xs text-zinc-500">Remaining</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1">
                {teams.map((team, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <p className="text-xs font-semibold text-orange-400 mb-2">
                      {team.name} ({team.players.length} players)
                    </p>
                    <div className="space-y-1">
                      {team.players.map((p, j) => (
                        <p key={j} className="text-xs text-zinc-400 truncate">
                          {j + 1}. {p}
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
                  <Button variant="outline" size="sm" onClick={shuffleTeams}>
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
                    Selected: {teams[swapA.team]?.name} → {teams[swapA.team]?.players[swapA.player]}
                  </span>
                  <button onClick={() => setSwapA(null)} className="text-orange-400 hover:text-white">
                    Cancel
                  </button>
                </motion.div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {teams.map((team, ti) => (
                  <div
                    key={ti}
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
                          <span className="text-[10px] text-zinc-600 w-4">{pi + 1}</span>
                          <span
                            className={cn(
                              "flex-1 text-xs truncate cursor-pointer",
                              swapA?.team === ti && swapA?.player === pi
                                ? "text-orange-400"
                                : "text-zinc-400"
                            )}
                            onClick={() => {
                              if (swapA) {
                                swapPlayersBetweenTeams(swapA.team, swapA.player, ti, pi);
                                setSwapA(null);
                              } else {
                                setSwapA({ team: ti, player: pi });
                              }
                            }}
                          >
                            {p}
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
                  Next: Generate
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
              <h3 className="text-sm font-semibold text-white">Generate Tournament</h3>
              <p className="text-xs text-zinc-400">
                This will:
              </p>
              <ul className="text-xs text-zinc-500 space-y-1 ml-4 list-disc">
                <li>Delete all existing teams, brackets, and matches</li>
                <li>Save {teams.length} teams with their players</li>
                <li>Generate a {getBracketSize(teams.length)}-team single elimination bracket</li>
                <li>Create {buildBracket(teams.map((t) => t.name), teams.map((_, i) => String(i))).matchRows.length} matches</li>
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

        {step === 4 && success && (
          <motion.div
            key="step4-done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-10 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/20 border border-green-500/20">
                <Check className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Tournament Generated!</h3>
              <p className="text-sm text-zinc-400">{success}</p>
              <div className="flex items-center justify-center gap-3 pt-4">
                <Button onClick={() => { setStep(1); setRawText(""); setPlayers([]); setTeams([]); setSuccess(""); }}>
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
