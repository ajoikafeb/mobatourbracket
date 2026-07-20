"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Timer,
  Plus,
  Loader2,
  Check,
  ArrowRight,
  ArrowLeft,
  Zap,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useMatches } from "@/hooks/use-matches";
import { useBrackets } from "@/hooks/use-brackets";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";

interface ScheduledMatch {
  id: string;
  round: string;
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  startTime: Date;
  duration: number;
  bracketId: string;
}

const STEPS = ["Configure", "Preview", "Generate"] as const;

export default function ScheduleGeneratorPage() {
  const supabase = createClient();
  const { matches } = useMatches();
  const { brackets } = useBrackets();
  const { settings } = useSettings();

  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [startTime, setStartTime] = useState<string>("18:30");
  const [matchDuration, setMatchDuration] = useState<number>(45);
  const [breakDuration, setBreakDuration] = useState<number>(15);
  const [bestOf, setBestOf] = useState<number>(3);
  const [saving, setSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);

  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "UTC";
    }
  }, []);

  const roundLabels: Record<string, string> = {
    "Grand Final": "Grand Final",
    "Semi Final": "Semi Final",
    "Quarter Final": "Quarter Final",
    "Round of 16": "Round of 16",
    "Round of 32": "Round of 32",
    "Round of 64": "Round of 64",
  };

  const roundOrder: Record<string, number> = {
    "Round of 64": 6,
    "Round of 32": 5,
    "Round of 16": 4,
    "Quarter Final": 3,
    "Semi Final": 2,
    "Grand Final": 1,
    "Champion": 0,
  };

  const buildSchedule = useCallback((): ScheduledMatch[] => {
    if (!brackets || brackets.length === 0) return [];

    const grouped = new Map<string, typeof brackets>();
    for (const b of brackets) {
      const round = b.round || "Unknown";
      if (!grouped.has(round)) grouped.set(round, []);
      grouped.get(round)!.push(b);
    }

    const sortedRounds = Array.from(grouped.keys()).sort(
      (a, b) => (roundOrder[b] ?? 99) - (roundOrder[a] ?? 99)
    );
    const schedule: ScheduledMatch[] = [];
    const baseDateTime = new Date(`${startDate}T${startTime}:00`);
    let matchIndex = 0;

    for (const round of sortedRounds) {
      if (round === "Champion") continue;
      const roundBrackets = grouped.get(round)!;
      for (let i = 0; i < roundBrackets.length - 1; i += 2) {
        const home = roundBrackets[i];
        const away = roundBrackets[i + 1];
        const matchStart = new Date(
          baseDateTime.getTime() + matchIndex * (matchDuration + breakDuration) * 60 * 1000
        );

        schedule.push({
          id: `scheduled-${round}-${i}`,
          round,
          matchNumber: schedule.length + 1,
          homeTeam: home.team_name || "TBD",
          awayTeam: away?.team_name || "TBD",
          startTime: matchStart,
          duration: matchDuration,
          bracketId: home.id,
        });
        matchIndex++;
      }

      if (roundBrackets.length % 2 !== 0) {
        const bye = roundBrackets[roundBrackets.length - 1];
        schedule.push({
          id: `bye-${round}`,
          round,
          matchNumber: schedule.length + 1,
          homeTeam: bye.team_name || "TBD",
          awayTeam: "BYE",
          startTime: new Date(
            baseDateTime.getTime() + matchIndex * (matchDuration + breakDuration) * 60 * 1000
          ),
          duration: matchDuration,
          bracketId: bye.id,
        });
        matchIndex++;
      }
    }

    return schedule;
  }, [brackets, startDate, startTime, matchDuration, breakDuration]);

  const schedule = useMemo(() => buildSchedule(), [buildSchedule]);

  const groupedSchedule = useMemo(() => {
    const groups = new Map<string, ScheduledMatch[]>();
    for (const m of schedule) {
      if (!groups.has(m.round)) groups.set(m.round, []);
      groups.get(m.round)!.push(m);
    }
    return groups;
  }, [schedule]);

  const estimatedDuration = useMemo(() => {
    if (schedule.length === 0) return "";
    const totalMinutes =
      schedule.length * matchDuration + (schedule.length - 1) * breakDuration;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }, [schedule, matchDuration, breakDuration]);

  const firstMatch = schedule.length > 0 ? schedule[0] : null;
  const lastMatch = schedule.length > 0 ? schedule[schedule.length - 1] : null;

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDate = (date: Date) =>
    date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });

  const handleGenerate = async () => {
    setSaving(true);
    setError("");
    try {
      const { data: existingTeams } = await supabase.from("teams").select("id, team_name");
      const teamIdMap = new Map<string, string>();
      if (existingTeams) {
        for (const t of existingTeams) teamIdMap.set(t.team_name, t.id);
      }

      const { data: existingBrackets } = await supabase.from("brackets").select("id, round, position, team_name");
      const bracketIdMap = new Map<string, string>();
      if (existingBrackets) {
        for (const b of existingBrackets) {
          bracketIdMap.set(`${b.round}-${b.position}`, b.id);
        }
      }

      await supabase.from("matches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const { data: settingsRow } = await supabase.from("settings").select("id").limit(1).single();
      if (settingsRow) {
        await supabase.from("settings").update({
          tournament_status: "upcoming",
        }).eq("id", settingsRow.id);
      }
      const matchInserts = schedule
        .filter((m) => m.awayTeam !== "BYE")
        .map((m) => ({
          team_a: m.homeTeam,
          team_b: m.awayTeam,
          team_a_id: teamIdMap.get(m.homeTeam) || null,
          team_b_id: teamIdMap.get(m.awayTeam) || null,
          round: m.round,
          match_date: m.startTime.toISOString(),
          best_of: bestOf,
          status: "waiting" as const,
          score_a: 0,
          score_b: 0,
        }));
      if (matchInserts.length > 0) {
        const { error: insertError } = await supabase.from("matches").insert(matchInserts);
        if (insertError) throw insertError;
      }
      setSaved(true);
      setConfirmOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate schedule");
    } finally {
      setSaving(false);
    }
  };

  const stepVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-8">
          <Zap className="h-8 w-8 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold">Schedule Generator</h1>
            <p className="text-gray-400 text-sm">
              Auto-generate match schedules from bracket pairings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center">
              <button
                onClick={() => i < currentStep && setCurrentStep(i)}
                disabled={i > currentStep}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  i === currentStep
                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                    : i < currentStep
                    ? "bg-green-500/10 text-green-400 cursor-pointer hover:bg-green-500/20"
                    : "bg-white/5 text-gray-500 cursor-not-allowed"
                )}
              >
                {i < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{i + 1}</span>
                )}
                {step}
              </button>
              {i < STEPS.length - 1 && (
                <ArrowRight className="h-4 w-4 text-gray-600 mx-1" />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="configure"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-400" />
                  Tournament Configuration
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Tournament Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Tournament Start Time</label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 flex items-center gap-1">
                      <Timer className="h-4 w-4" />
                      Match Duration
                    </label>
                    <select
                      value={matchDuration}
                      onChange={(e) => setMatchDuration(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm"
                    >
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                      <option value={90}>90 minutes</option>
                      <option value={120}>120 minutes</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Break Between Matches
                    </label>
                    <select
                      value={breakDuration}
                      onChange={(e) => setBreakDuration(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm"
                    >
                      <option value={5}>5 minutes</option>
                      <option value={10}>10 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={20}>20 minutes</option>
                      <option value={30}>30 minutes</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Best Of</label>
                    <select
                      value={bestOf}
                      onChange={(e) => setBestOf(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm"
                    >
                      <option value={1}>BO1</option>
                      <option value={3}>BO3</option>
                      <option value={5}>BO5</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Timezone</label>
                    <div className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-gray-300">
                      {timezone}
                    </div>
                  </div>
                </div>

                {brackets.length === 0 && (
                  <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-yellow-300">
                      No bracket data found. Please create brackets first before generating a
                      schedule.
                    </p>
                  </div>
                )}

                <div className="flex justify-end mt-8">
                  <Button
                    onClick={() => setCurrentStep(1)}
                    disabled={brackets.length === 0}
                    className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                  >
                    Preview Schedule
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="preview"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-400" />
                  Schedule Preview
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-orange-400">{schedule.length}</p>
                    <p className="text-xs text-gray-400 mt-1">Total Matches</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-orange-400">{estimatedDuration || "—"}</p>
                    <p className="text-xs text-gray-400 mt-1">Est. Duration</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <p className="text-lg font-bold text-orange-400">
                      {firstMatch ? formatTime(firstMatch.startTime) : "—"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">First Match</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <p className="text-lg font-bold text-orange-400">
                      {lastMatch ? formatTime(lastMatch.startTime) : "—"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Last Match</p>
                  </div>
                </div>

                {schedule.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No matches to preview. Check bracket data.
                  </div>
                ) : (
                  <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                    {Array.from(groupedSchedule.entries())
                      .sort(([a], [b]) => (roundOrder[b] ?? 99) - (roundOrder[a] ?? 99))
                      .map(([round, matches]) => (
                        <div key={round}>
                          <h3 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
                            <Zap className="h-3.5 w-3.5" />
                            {roundLabels[round] ?? `Round ${round}`}
                          </h3>
                          <div className="bg-white/5 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-white/10 text-gray-400 text-left">
                                  <th className="px-4 py-2 font-medium">#</th>
                                  <th className="px-4 py-2 font-medium">Match</th>
                                  <th className="px-4 py-2 font-medium">Time</th>
                                  <th className="px-4 py-2 font-medium">Duration</th>
                                </tr>
                              </thead>
                              <tbody>
                                {matches.map((m) => (
                                  <tr
                                    key={m.id}
                                    className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                                  >
                                    <td className="px-4 py-2 text-gray-500">{m.matchNumber}</td>
                                    <td className="px-4 py-2">
                                      <span className="text-white">{m.homeTeam}</span>
                                      <span className="text-gray-500 mx-2">vs</span>
                                      <span className="text-white">{m.awayTeam}</span>
                                    </td>
                                    <td className="px-4 py-2 text-gray-300">
                                      {formatTime(m.startTime)}
                                    </td>
                                    <td className="px-4 py-2 text-gray-300">
                                      {m.duration} min
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  <Button
                    onClick={() => setCurrentStep(0)}
                    variant="outline"
                    className="border-white/10 text-gray-300 hover:bg-white/5 gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={schedule.length === 0}
                    className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                  >
                    Continue to Generate
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="generate"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-400" />
                  Generate Schedule
                </h2>

                {saved ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="h-8 w-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Schedule Generated!</h3>
                    <p className="text-gray-400 mb-6">
                      {schedule.length} matches have been created successfully.
                    </p>
                    <Button
                      onClick={() => {
                        window.location.href = "/admin/schedule";
                      }}
                      className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                    >
                      View Schedule
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    <div className="bg-white/5 rounded-lg p-4 mb-6 space-y-2">
                      <p className="text-sm text-gray-400">
                        <span className="text-white font-medium">Matches:</span>{" "}
                        {schedule.length} matches will be created
                      </p>
                      <p className="text-sm text-gray-400">
                        <span className="text-white font-medium">Duration:</span>{" "}
                        {estimatedDuration} estimated
                      </p>
                      <p className="text-sm text-gray-400">
                        <span className="text-white font-medium">Start:</span>{" "}
                        {firstMatch ? `${formatDate(firstMatch.startTime)} at ${formatTime(firstMatch.startTime)}` : "—"}
                      </p>
                      <p className="text-sm text-gray-400">
                        <span className="text-white font-medium">Timezone:</span> {timezone}
                      </p>
                      <p className="text-sm text-gray-400">
                        <span className="text-white font-medium">Best of:</span> BO{bestOf}
                      </p>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3 mb-6">
                      <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-yellow-300">
                        This will <strong>delete all existing matches</strong> and replace them
                        with the new schedule. This action cannot be undone.
                      </p>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3 mb-6">
                        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-red-300">{error}</p>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <Button
                        onClick={() => setCurrentStep(1)}
                        variant="outline"
                        className="border-white/10 text-gray-300 hover:bg-white/5 gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        onClick={() => setConfirmOpen(true)}
                        disabled={saving}
                        className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4" />
                        )}
                        Generate Schedule
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {confirmOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => !saving && setConfirmOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 border border-white/10 rounded-xl p-6 max-w-md w-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Confirm Generation</h3>
                    <p className="text-sm text-gray-400">
                      This will overwrite existing matches
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-300 mb-6">
                  Are you sure you want to delete all existing matches and generate{" "}
                  <span className="text-orange-400 font-medium">{schedule.length} new matches</span>?
                </p>

                <div className="flex justify-end gap-3">
                  <Button
                    onClick={() => setConfirmOpen(false)}
                    disabled={saving}
                    variant="outline"
                    className="border-white/10 text-gray-300 hover:bg-white/5"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={saving}
                    className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Confirm
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
