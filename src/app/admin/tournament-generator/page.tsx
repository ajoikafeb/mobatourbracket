"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Copy,
  Trash2,
  AlertCircle,
  Plus,
  Minus,
  Shuffle,
  Download,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { Team, Bracket, Match, RoundName } from "@/lib/types";
import { ROUND_ORDER } from "@/lib/types";
import { useTeams } from "@/hooks/use-teams";
import { cn } from "@/lib/utils";

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
    .map((name) => name.replace(/\s+/g, ""))
    .filter((name, i, arr) => arr.indexOf(name) === i);
}

function generateTeams(
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

function getNextPowerOf2(n: number): number {
  let p = 2;
  while (p < n) p *= 2;
  return p;
}

function getRoundName(teamsInRound: number): RoundName | null {
  if (teamsInRound === 64) return "Round of 64";
  if (teamsInRound === 32) return "Round of 32";
  if (teamsInRound === 16) return "Round of 16";
  if (teamsInRound === 8) return "Quarter Final";
  if (teamsInRound === 4) return "Semi Final";
  if (teamsInRound === 2) return "Grand Final";
  if (teamsInRound === 1) return "Champion";
  return null;
}

function buildSeededMatchups(teamCount: number): [number, number][] {
  if (teamCount <= 1) return [];
  const matchups: [number, number][] = [];
  const half = teamCount / 2;
  const seeds = generateSeedingOrder(teamCount);
  for (let i = 0; i < half; i++) {
    matchups.push([seeds[i * 2] - 1, seeds[i * 2 + 1] - 1]);
  }
  return matchups;
}

function generateSeedingOrder(size: number): number[] {
  if (size === 1) return [1];
  const half = size / 2;
  const prev = generateSeedingOrder(half);
  const result: number[] = [];
  for (const seed of prev) {
    result.push(seed);
    result.push(size + 1 - seed);
  }
  return result;
}

interface BracketEntry {
  round: RoundName;
  round_order: number;
  position: number;
  team_name: string;
  team_seed: number;
  team_id: string | null;
  opponent_id: string | null;
  match_id: string | null;
  is_winner: boolean;
  is_current: boolean;
  is_bye: boolean;
}

interface MatchEntry {
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

function generateBracket(
  savedTeams: Team[],
  playersPerTeam: number
): { brackets: BracketEntry[]; matches: MatchEntry[] } {
  const totalTeams = savedTeams.length;
  const bracketSize = getNextPowerOf2(Math.max(totalTeams, 2));
  const totalByes = bracketSize - totalTeams;

  const seedingOrder = generateSeedingOrder(bracketSize);
  const slots: (Team | null)[] = new Array(bracketSize).fill(null);
  const byeFlags: boolean[] = new Array(bracketSize).fill(false);

  for (let i = 0; i < totalTeams; i++) {
    const seedPos = seedingOrder.indexOf(i + 1);
    if (seedPos !== -1) {
      slots[seedPos] = savedTeams[i];
    }
  }

  const firstRoundSize = bracketSize;
  const rounds: RoundName[] = [];
  let size = firstRoundSize;
  while (size >= 2) {
    const name = getRoundName(size);
    if (name) rounds.push(name);
    size /= 2;
  }
  rounds.push("Champion");

  const brackets: BracketEntry[] = [];
  const matches: MatchEntry[] = [];
  let position = 0;

  for (const round of rounds) {
    const roundIdx = ROUND_ORDER.indexOf(round);
    const teamsInRound =
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

    for (let i = 0; i < teamsInRound; i++) {
      brackets.push({
        round,
        round_order: roundIdx,
        position: position++,
        team_name: "",
        team_seed: 0,
        team_id: null,
        opponent_id: null,
        match_id: null,
        is_winner: false,
        is_current: false,
        is_bye: false,
      });
    }
  }

  const firstRoundBrackets = brackets.filter(
    (b) => b.round === getRoundName(firstRoundSize)
  );

  for (let i = 0; i < firstRoundSize; i++) {
    const team = slots[i];
    const bracket = firstRoundBrackets[i];
    if (team) {
      bracket.team_name = team.team_name;
      bracket.team_seed = i + 1;
      bracket.team_id = team.id;
    } else {
      bracket.team_name = "BYE";
      bracket.is_bye = true;
      bracket.team_seed = i + 1;
    }
  }

  const firstRoundMatchups = buildSeededMatchups(firstRoundSize);
  let matchIdx = 0;

  for (const [a, b] of firstRoundMatchups) {
    const teamA = slots[a];
    const teamB = slots[b];
    const bracketA = firstRoundBrackets[a];
    const bracketB = firstRoundBrackets[b];

    const isByeA = !teamA;
    const isByeB = !teamB;

    if (isByeA && !isByeB) {
      bracketA.is_bye = true;
      advanceTeam(brackets, teamB!, bracketB, "Champion", 0);
    } else if (!isByeA && isByeB) {
      bracketB.is_bye = true;
      advanceTeam(brackets, teamA!, bracketA, "Champion", 0);
    } else if (!isByeA && !isByeB) {
      const match: MatchEntry = {
        team_a: teamA!.team_name,
        team_a_id: teamA!.id,
        team_b: teamB!.team_name,
        team_b_id: teamB!.id,
        score_a: 0,
        score_b: 0,
        status: "waiting",
        round: getRoundName(firstRoundSize)!,
        round_order: ROUND_ORDER.indexOf(getRoundName(firstRoundSize)!),
        match_index: matchIdx++,
        match_date: "",
        best_of: 3,
        winner: null,
        winner_id: null,
        bracket_slot: null,
      };
      matches.push(match);
    }
  }

  return { brackets, matches };
}

function advanceTeam(
  brackets: BracketEntry[],
  team: Team,
  fromBracket: BracketEntry,
  nextRound: RoundName,
  _roundOrderOffset: number
) {
  const nextBrackets = brackets.filter((b) => b.round === nextRound);
  const emptySlot = nextBrackets.find((b) => !b.team_name || b.team_name === "");
  if (emptySlot) {
    emptySlot.team_name = team.team_name;
    emptySlot.team_seed = fromBracket.team_seed;
    emptySlot.team_id = team.id;
  }
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
      setError("No valid usernames found. Please paste usernames (one per line).");
      return;
    }
    setPlayers(parsedPlayers);
    const generated = generateTeams(parsedPlayers, playersPerTeam);
    setTeams(generated);
    setError("");
    setStep(2);
  }

  function handleRegenerateTeams() {
    const generated = generateTeams(players, playersPerTeam);
    setTeams(generated);
  }

  function updateTeamName(index: number, name: string) {
    setTeams((prev) =>
      prev.map((t, i) => (i === index ? { ...t, name } : t))
    );
  }

  function movePlayer(teamIdx: number, playerIdx: number, direction: -1 | 1) {
    setTeams((prev) =>
      prev.map((t, i) => {
        if (i !== teamIdx) return t;
        const newPlayers = [...t.players];
        const swapIdx = playerIdx + direction;
        if (swapIdx < 0 || swapIdx >= newPlayers.length) return t;
        [newPlayers[playerIdx], newPlayers[swapIdx]] = [
          newPlayers[swapIdx],
          newPlayers[playerIdx],
        ];
        return { ...t, players: newPlayers };
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
    const cleaned = name.replace(/^@/, "").trim().replace(/\s+/g, "");
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
      const teamA = { ...newTeams[teamAIdx] };
      const teamB = { ...newTeams[teamBIdx] };
      const playersA = [...teamA.players];
      const playersB = [...teamB.players];

      const temp = playersA[playerAIdx];
      playersA[playerAIdx] = playersB[playerBIdx];
      playersB[playerBIdx] = temp;

      teamA.players = playersA;
      teamB.players = playersB;
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
    const newTeams = generateTeams(shuffled, playersPerTeam);
    setTeams(newTeams);
  }

  async function handleSaveAndGenerate() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Delete existing data
      const { data: existingTeams } = await supabase.from("teams").select("id");
      if (existingTeams && existingTeams.length > 0) {
        const ids: string[] = existingTeams.map((t: { id: string }) => t.id);
        await supabase.from("teams").delete().in("id", ids);
      }
      const { data: existingBrackets } = await supabase.from("brackets").select("id");
      if (existingBrackets && existingBrackets.length > 0) {
        const ids: string[] = existingBrackets.map((b: { id: string }) => b.id);
        await supabase.from("brackets").delete().in("id", ids);
      }
      const { data: existingMatches } = await supabase.from("matches").select("id");
      if (existingMatches && existingMatches.length > 0) {
        const ids: string[] = existingMatches.map((m: { id: string }) => m.id);
        await supabase.from("matches").delete().in("id", ids);
      }

      const teamRows: Omit<Team, "id" | "created_at" | "updated_at">[] =
        teams.map((t, i) => ({
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

      const { data: savedTeams, error: teamError } = await supabase
        .from("teams")
        .insert(teamRows)
        .select();

      if (teamError) throw teamError;
      if (!savedTeams) throw new Error("Failed to save teams");

      const { brackets, matches } = generateBracket(
        savedTeams as Team[],
        playersPerTeam
      );

      if (brackets.length > 0) {
        const bracketRows = brackets.map((b) => ({
          round: b.round,
          round_order: b.round_order,
          position: b.position,
          team_name: b.team_name,
          team_seed: b.team_seed,
          team_id: b.team_id,
          opponent_id: b.opponent_id,
          match_id: b.match_id,
          is_winner: b.is_winner,
          is_current: b.is_current,
          is_bye: b.is_bye,
        }));

        const { error: bracketError } = await supabase
          .from("brackets")
          .insert(bracketRows);

        if (bracketError) throw bracketError;
      }

      if (matches.length > 0) {
        const { error: matchError } = await supabase
          .from("matches")
          .insert(matches);

        if (matchError) throw matchError;
      }

      await refetch();
      setSuccess(
        `Tournament generated! ${savedTeams.length} teams and ${matches.length} matches created.`
      );
      setStep(4);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save tournament";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(1);

  function goToStep(newStep: number) {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#09090B" }}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Tournament Generator</h1>
            <p className="text-sm text-zinc-400">
              Paste player usernames and auto-generate teams & bracket
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-0">
          {STEP_LABELS.map((s, i) => {
            const Icon = s.icon;
            const num = i + 1;
            const isActive = step === num;
            const isCompleted = step > num;
            return (
              <div key={num} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                      isActive
                        ? "border-orange-500 bg-orange-500/20 text-orange-400 shadow-lg shadow-orange-500/20"
                        : isCompleted
                        ? "border-green-500 bg-green-500/20 text-green-400"
                        : "border-white/10 bg-white/5 text-zinc-500"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium transition-colors",
                      isActive ? "text-orange-400" : "text-zinc-500"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={cn(
                      "w-16 h-0.5 mx-2 mb-6 transition-colors duration-300",
                      step > num ? "bg-green-500/40" : "bg-white/10"
                    )}
                  />
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

        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {step === 1 && (
                <div className="space-y-6">
                  <Card className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-lg font-semibold text-white mb-1">
                          Paste Player Usernames
                        </h2>
                        <p className="text-sm text-zinc-400">
                          Enter one username per line. The @ prefix will be
                          automatically removed.
                        </p>
                      </div>

                      <textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder={"@adicostyles\n@andyshicool\n@dfxyz69\n@player4\n@player5"}
                        rows={12}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none font-mono"
                      />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <Users className="h-4 w-4" />
                          <span>
                            <span className="font-semibold text-white">
                              {parsedPlayers.length}
                            </span>{" "}
                            players detected
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setRawText("");
                              setPlayers([]);
                              setTeams([]);
                            }}
                            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleParsePlayers}
                      disabled={parsedPlayers.length === 0}
                    >
                      Import Players
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <Card className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                      <h2 className="text-lg font-semibold text-white">
                        Team Preview
                      </h2>
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-zinc-400">
                          Players per team:
                        </label>
                        <Select
                          value={playersPerTeam}
                          onChange={(e) => {
                            setPlayersPerTeam(Number(e.target.value));
                          }}
                          className="w-24 h-9"
                        >
                          {[3, 4, 5, 6].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRegenerateTeams}
                        >
                          <Shuffle className="h-3 w-3" />
                          Regenerate
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                        <p className="text-2xl font-bold text-white">
                          {players.length}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">Total Players</p>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                        <p className="text-2xl font-bold text-orange-400">
                          {teamCount}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">Generated Teams</p>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                        <p className="text-2xl font-bold text-zinc-400">
                          {remainingPlayers}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">Remaining</p>
                      </div>
                    </div>

                    <div
                      className="grid gap-4"
                      style={{
                        gridTemplateColumns:
                          teamCount <= 4
                            ? `repeat(${teamCount}, 1fr)`
                            : teamCount <= 8
                            ? "repeat(4, 1fr)"
                            : "repeat(3, 1fr)",
                      }}
                    >
                      {teams.map((team, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Card className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20 text-xs font-bold text-orange-400">
                                {i + 1}
                              </div>
                              <h3 className="text-sm font-semibold text-white truncate">
                                {team.name}
                              </h3>
                            </div>
                            <div className="space-y-1">
                              {team.players.map((p, j) => (
                                <div
                                  key={j}
                                  className="flex items-center gap-2 text-xs text-zinc-400"
                                >
                                  <div className="h-1 w-1 rounded-full bg-orange-500/40" />
                                  <span className="truncate">{p}</span>
                                </div>
                              ))}
                              {team.players.length < playersPerTeam && (
                                <div className="text-xs text-zinc-600 italic mt-1">
                                  {playersPerTeam - team.players.length} slot
                                  {playersPerTeam - team.players.length > 1
                                    ? "s"
                                    : ""}{" "}
                                  open
                                </div>
                              )}
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </Card>

                  <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={() => goToStep(1)}>
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <Button onClick={() => goToStep(3)}>
                      Edit Teams
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-white">
                        Edit Teams
                      </h2>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={shuffleTeams}
                        >
                          <Shuffle className="h-3 w-3" />
                          Shuffle All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={createNewTeam}
                        >
                          <Plus className="h-3 w-3" />
                          Add Team
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {teams.map((team, teamIdx) => (
                        <motion.div
                          key={teamIdx}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: teamIdx * 0.03 }}
                        >
                          <Card className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20 text-xs font-bold text-orange-400">
                                {teamIdx + 1}
                              </div>
                              <Input
                                value={team.name}
                                onChange={(e) =>
                                  updateTeamName(teamIdx, e.target.value)
                                }
                                className="h-8 text-sm font-semibold max-w-[200px]"
                              />
                              <div className="flex items-center gap-1 ml-auto">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => addPlayerToTeam(teamIdx)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-zinc-500 hover:text-red-400"
                                  onClick={() => deleteTeam(teamIdx)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              {team.players.map((player, playerIdx) => (
                                <div
                                  key={playerIdx}
                                  className="flex items-center gap-2 group"
                                >
                                  <span className="text-[10px] text-zinc-600 w-4 text-right">
                                    {playerIdx + 1}
                                  </span>
                                  <div className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-sm text-white truncate">
                                    {player}
                                  </div>
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() =>
                                        movePlayer(teamIdx, playerIdx, -1)
                                      }
                                      disabled={playerIdx === 0}
                                      className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:text-white disabled:opacity-30 cursor-pointer"
                                    >
                                      <ArrowLeft className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        movePlayer(teamIdx, playerIdx, 1)
                                      }
                                      disabled={
                                        playerIdx === team.players.length - 1
                                      }
                                      className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:text-white disabled:opacity-30 cursor-pointer"
                                    >
                                      <ArrowRight className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        deletePlayer(teamIdx, playerIdx)
                                      }
                                      className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:text-red-400 cursor-pointer"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {team.players.length === 0 && (
                                <p className="text-xs text-zinc-600 italic py-2">
                                  No players. Click + to add.
                                </p>
                              )}
                            </div>

                            {teams.length > 1 && (
                              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                                <Select
                                  value=""
                                  onChange={(e) => {
                                    const targetTeamIdx = Number(e.target.value);
                                    if (
                                      targetTeamIdx === teamIdx ||
                                      targetTeamIdx < 0
                                    )
                                      return;
                                    const targetPlayerIdx = 0;
                                    swapPlayersBetweenTeams(
                                      teamIdx,
                                      0,
                                      targetTeamIdx,
                                      targetPlayerIdx
                                    );
                                  }}
                                  className="h-8 text-xs"
                                >
                                  <option value="">
                                    Swap player with another team...
                                  </option>
                                  {teams.map((t, tIdx) =>
                                    tIdx !== teamIdx ? (
                                      <option key={tIdx} value={tIdx}>
                                        {t.name} ({t.players.length} players)
                                      </option>
                                    ) : null
                                  )}
                                </Select>
                              </div>
                            )}
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </Card>

                  <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={() => goToStep(2)}>
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <Button onClick={handleSaveAndGenerate} disabled={saving}>
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Generate Bracket
                    </Button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <Card className="p-8 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      }}
                    >
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 mx-auto mb-6">
                        <Check className="h-10 w-10 text-green-400" />
                      </div>
                    </motion.div>

                    <h2 className="text-2xl font-bold text-white mb-2">
                      Tournament Generated!
                    </h2>
                    <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                      Your teams have been saved and the bracket has been
                      auto-generated. You can now manage matches from the
                      bracket editor.
                    </p>

                    <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-8">
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <p className="text-xl font-bold text-orange-400">
                          {teams.length}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-1">Teams</p>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <p className="text-xl font-bold text-white">
                          {players.length}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-1">Players</p>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <p className="text-xl font-bold text-green-400">✓</p>
                        <p className="text-[10px] text-zinc-500 mt-1">Bracket</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setStep(1);
                          setRawText("");
                          setPlayers([]);
                          setTeams([]);
                          setError("");
                          setSuccess("");
                        }}
                      >
                        Start New Tournament
                      </Button>
                      <Button
                        onClick={() =>
                          (window.location.href = "/admin/bracket")
                        }
                      >
                        View Bracket
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
