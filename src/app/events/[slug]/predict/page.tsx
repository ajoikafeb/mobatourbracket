"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  Target,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Calendar,
  Trophy,
  Lock,
} from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PredictionCard } from "@/components/public/prediction-card";
import { Leaderboard } from "@/components/public/leaderboard";
import { useEvent } from "@/hooks/use-events";
import { usePredictionSettings, usePredictableMatches, useLeaderboard } from "@/hooks/use-predictions";
import { bulkUpsertPredictions, getOrCreatePredictionUser, updateEventParticipantCount } from "@/services/prediction-service";
import { cn } from "@/lib/utils";
import type { PredictionEntry } from "@/lib/prediction-types";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export default function PredictPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(params);
  const { event, loading: eventLoading } = useEvent(slug);
  const [username, setUsername] = useState("");
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("prediction_username") : null;
    if (saved) {
      setUsername(saved);
      setUsernameSaved(true);
    }
  }, []);

  const eventId = event?.id || null;
  const { settings, loading: settingsLoading } = usePredictionSettings(eventId);
  const isClosed = settings?.closed_at ? new Date(settings.closed_at).getTime() < Date.now() : false;
  const { matches: predictableMatches, loading: matchesLoading, refetch: refetchMatches } = usePredictableMatches(eventId);
  const { leaderboard, loading: leaderboardLoading } = useLeaderboard(eventId);

  const handleSaveUsername = useCallback(() => {
    const trimmed = username.trim();
    if (!trimmed) return;
    localStorage.setItem("prediction_username", trimmed.toLowerCase());
    setUsernameSaved(true);
  }, [username]);

  const handleSelect = useCallback((matchId: string, teamId: string) => {
    setSelections((prev) => ({
      ...prev,
      [matchId]: prev[matchId] === teamId ? "" : teamId,
    }));
  }, []);

  const handleSaveAll = useCallback(async () => {
    if (!eventId || !usernameSaved) return;

    const pendingEntries = Object.entries(selections)
      .filter(([, teamId]) => teamId)
      .map(([matchId, teamId]) => ({
        match_id: matchId,
        event_id: eventId,
        discord_username: username.trim().toLowerCase(),
        selected_team_id: teamId,
        submitted_at: new Date().toISOString(),
      }));

    if (pendingEntries.length === 0) {
      setMessage({ type: "error", text: "Select at least one prediction to save" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setSaving(true);
    try {
      await getOrCreatePredictionUser(username.trim());
      await bulkUpsertPredictions(pendingEntries);
      updateEventParticipantCount(eventId).catch(() => {});
      setMessage({ type: "success", text: `${pendingEntries.length} prediction${pendingEntries.length > 1 ? "s" : ""} saved!` });
      setTimeout(() => setMessage(null), 3000);
      setSelections({});
      await refetchMatches();
    } catch {
      setMessage({ type: "error", text: "Failed to save predictions. Please try again." });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  }, [eventId, usernameSaved, username, selections, refetchMatches]);

  const openCount = useMemo(() =>
    predictableMatches.filter((m) => m.predictionStatus === "open" && m.teamA && m.teamB).length,
    [predictableMatches]
  );
  const userPredictionsCount = useMemo(() =>
    predictableMatches.filter((m) => m.userPrediction).length,
    [predictableMatches]
  );

  const isLoading = eventLoading || settingsLoading;

  return (
    <div className="min-h-screen bg-[#09090B]">
      <AnimatedBackground />
      <Navbar />

      <main className="relative z-10">
        <PageWrapper>
          {isLoading ? (
            <PredictSkeleton />
          ) : !event ? (
            <NotFoundState />
          ) : (
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
              <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible">
                <Link
                  href={`/events/${slug}`}
                  className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-orange-400 transition-colors duration-200 mb-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Event
                </Link>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={fadeUp} custom={1} className="mb-8">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <Target className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white">Predictions</h1>
                      <p className="text-sm text-zinc-400">{event.title}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Username Input */}
                <motion.div variants={fadeUp} custom={2} className="mb-6">
                  <Card className="p-5 bg-white/[0.03] border-white/[0.06]">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                          <User className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {usernameSaved ? "Logged in as" : "Enter your Discord username"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {usernameSaved
                              ? "Your predictions are saved under this username"
                              : "Required to submit predictions"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto">
                        <Input
                          placeholder="Discord#0000"
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value);
                            setUsernameSaved(false);
                          }}
                          disabled={usernameSaved}
                          className={cn(
                            "flex-1 sm:w-48",
                            usernameSaved && "bg-white/[0.02] text-green-400"
                          )}
                        />
                        {usernameSaved ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              localStorage.removeItem("prediction_username");
                              setUsernameSaved(false);
                              setUsername("");
                            }}
                          >
                            Change
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={handleSaveUsername}
                            disabled={!username.trim()}
                          >
                            Save
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Stats Bar */}
                <motion.div variants={fadeUp} custom={3} className="grid grid-cols-3 gap-4 mb-6">
                  <Card className="p-4 bg-white/[0.03] border-white/[0.06] text-center">
                    <p className="text-2xl font-extrabold text-white">{predictableMatches.length}</p>
                    <p className="text-xs text-zinc-500">Total Matches</p>
                  </Card>
                  <Card className="p-4 bg-white/[0.03] border-white/[0.06] text-center">
                    <p className="text-2xl font-extrabold text-green-400">{openCount}</p>
                    <p className="text-xs text-zinc-500">Open for Predict</p>
                  </Card>
                  <Card className="p-4 bg-white/[0.03] border-white/[0.06] text-center">
                    <p className="text-2xl font-extrabold text-blue-400">{userPredictionsCount}</p>
                    <p className="text-xs text-zinc-500">Your Predictions</p>
                  </Card>
                </motion.div>

                {/* Message Toast */}
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "mb-6 rounded-xl px-4 py-3 text-sm flex items-center gap-2",
                      message.type === "success"
                        ? "border border-green-500/30 bg-green-500/10 text-green-400"
                        : "border border-red-500/30 bg-red-500/10 text-red-400"
                    )}
                  >
                    {message.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    {message.text}
                  </motion.div>
                )}

                {/* Match Cards */}
                {isClosed && (
                  <motion.div variants={fadeUp} custom={3.5} className="mb-6">
                    <Card className="p-5 bg-yellow-500/[0.06] border-yellow-500/20">
                      <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-yellow-400 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-yellow-400">Predictions Closed</p>
                          <p className="text-xs text-zinc-400">
                            Admin has closed predictions for this event. New predictions will not be counted.
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* Match Cards */}
                <motion.div variants={fadeUp} custom={4} className="space-y-4 mb-8">
                  {matchesLoading ? (
                    <>
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-40 rounded-[20px]" />
                      ))}
                    </>
                  ) : predictableMatches.length === 0 ? (
                    <Card className="p-8 bg-white/[0.03] border-white/[0.06] rounded-[20px] text-center">
                      <Calendar className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                      <p className="text-sm text-zinc-500">No matches available</p>
                      <p className="text-xs text-zinc-600 mt-1">Matches will appear when the schedule is generated</p>
                    </Card>
                  ) : (
                    predictableMatches.map((data) => (
                      <PredictionCard
                        key={data.match.id}
                        data={data}
                        selectedTeamId={selections[data.match.id] || null}
                        onSelect={handleSelect}
                      />
                    ))
                  )}
                </motion.div>

                {/* Save Button */}
                {usernameSaved && openCount > 0 && Object.values(selections).some(Boolean) && (
                  <motion.div variants={fadeUp} custom={5} className="mb-8">
                    <Button
                      size="lg"
                      onClick={handleSaveAll}
                      disabled={saving}
                      className="w-full sm:w-auto"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save All Predictions
                    </Button>
                  </motion.div>
                )}

                {/* Leaderboard */}
                {(!settings || settings.leaderboard_enabled !== false) && (
                  <motion.div variants={fadeUp} custom={6}>
                    <Leaderboard
                      leaderboard={leaderboard}
                      highlight={usernameSaved ? username : undefined}
                    />
                    {leaderboard.length > 0 && (
                      <div className="mt-4 text-center">
                        <Link
                          href={`/events/${slug}/predictors`}
                          className="text-sm text-zinc-500 hover:text-orange-400 transition-colors"
                        >
                          View All Predictors &rarr;
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </div>
          )}
        </PageWrapper>
      </main>

      <Footer />
    </div>
  );
}

function PredictSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <Skeleton className="h-6 w-32 mb-8" />
      <Skeleton className="h-12 w-64 mb-4" />
      <Skeleton className="h-20 w-full rounded-[20px]" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-20 rounded-[20px]" />
        <Skeleton className="h-20 rounded-[20px]" />
        <Skeleton className="h-20 rounded-[20px]" />
      </div>
      <Skeleton className="h-40 rounded-[20px]" />
      <Skeleton className="h-40 rounded-[20px]" />
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-32 text-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
          <Calendar className="h-10 w-10 text-zinc-600" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Event Not Found</h1>
        <p className="text-zinc-500 mb-8 max-w-md mx-auto">
          The event you&apos;re looking for doesn&apos;t exist or may have been removed.
        </p>
        <Link href="/events">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}

