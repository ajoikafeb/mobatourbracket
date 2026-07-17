"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import {
  Swords,
  Calendar,
  Radio,
  ArrowRight,
  Zap,
  Users,
  Target,
  Trophy,
  ChevronRight,
  Clock,
  Star,
  CalendarDays,
  Flame,
  ChevronDown,
} from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { AnnouncementBar } from "@/components/public/announcement-bar";
import { EventCard } from "@/components/public/event-card";
import { useTournament } from "@/hooks/use-tournament";
import { useAnnouncements } from "@/hooks/use-announcements";
import { useFeaturedEvents, useEventsByStatus } from "@/hooks/use-events";
import { ROUND_CONFIG } from "@/lib/types";
import type { RoundName, Event } from "@/lib/types";
import { cn, formatDate, formatTime } from "@/lib/utils";

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

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const STATUS_MAP: Record<string, "waiting" | "live" | "finished"> = {
  upcoming: "waiting",
  ongoing: "live",
  completed: "finished",
};

const ROUND_NAME_MAP: Record<string, string> = {
  "Round of 64": "R64",
  "Round of 32": "R32",
  "Round of 16": "R16",
  "Quarter Final": "QF",
  "Semi Final": "SF",
  "Grand Final": "GF",
  "Champion": "Winner",
};

export default function HomePage() {
  const { currentMatch, matches, teams, settings, loading, bracket } = useTournament();
  const { announcements } = useAnnouncements(true);
  const { events: featuredEvents } = useFeaturedEvents();
  const { events: runningEvents } = useEventsByStatus("running");
  const { events: upcomingEvents } = useEventsByStatus("upcoming");
  const { events: regOpenEvents } = useEventsByStatus("registration_open");

  const nextMatch = !currentMatch
    ? matches
        .filter((m) => m.status === "waiting" && m.team_a_id && m.team_b_id)
        .sort((a, b) => a.round_order - b.round_order || a.match_index - b.match_index)[0] || null
    : null;

  const totalMatches = matches.length;
  const tournamentStatus = settings?.tournament_status ?? "upcoming";
  const mappedStatus = STATUS_MAP[tournamentStatus] ?? "waiting";

  const allUpcomingEvents: Event[] = [...upcomingEvents, ...regOpenEvents].filter(
    (event, index, self) => index === self.findIndex((e) => e.id === event.id)
  );

  return (
    <div className="min-h-screen bg-[#09090B]">
      <AnimatedBackground />
      <Navbar />

      <main className="relative z-10">
        <PageWrapper>
          {loading ? (
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-32 space-y-8">
              <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse mx-auto" />
              <div className="h-4 w-96 bg-white/5 rounded-lg animate-pulse mx-auto" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-32 bg-white/5 rounded-[20px] animate-pulse" />
                ))}
              </div>
            </div>
          ) : (<>

          {/* ── Announcement Bar ──────────────────────────────────────── */}
          {announcements.length > 0 && (
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
              <AnnouncementBar announcements={announcements} />
            </section>
          )}

          {/* ── Hero Section ──────────────────────────────────────────── */}
          <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-32 sm:pb-32 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#FF7A00]/[0.04] blur-[120px]" />
              <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#FF7A00]/[0.03] blur-[100px]" />
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="relative z-10 text-center max-w-4xl mx-auto"
            >
              <motion.div variants={fadeUp} custom={0} className="mb-10 flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-[#FF7A00]/20 to-orange-600/10 blur-lg opacity-60" />
                  <Image
                    src="/logo.png"
                    alt="Neosoul Logo"
                    width={80}
                    height={80}
                    className="relative h-20 w-20 rounded-2xl object-contain ring-1 ring-white/10"
                  />
                </div>
              </motion.div>

              <motion.div variants={fadeUp} custom={1} className="mb-6">
                <StatusBadge status={mappedStatus} className="text-sm px-4 py-1.5" />
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={2}
                className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]"
              >
                <span className="bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent">
                  {settings?.tournament_name || "Neosoul"}
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#FF7A00] via-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Tournament Tracker
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={3}
                className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
              >
                {settings?.tournament_subtitle ||
                  "Indonesian Community Tournament — Track brackets, schedules, and live matches in real-time."}
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={4}
                className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link href="/bracket">
                  <Button size="xl" className="w-full sm:w-auto group">
                    <Swords className="h-5 w-5" />
                    View Bracket
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/schedule">
                  <Button variant="outline" size="xl" className="w-full sm:w-auto">
                    <Calendar className="h-5 w-5" />
                    View Schedule
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </section>

          {/* ── Current Match (Live) ──────────────────────────────────── */}
          {currentMatch && (
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
              <motion.div
                variants={scaleIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
              >
                <Link href="/current-match">
                  <Card className="relative overflow-hidden border-red-500/20 bg-white/[0.03] p-6 sm:p-8 group hover:border-red-500/30 transition-all duration-500 rounded-[20px]">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl" />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest text-red-400">
                            Live Now
                          </span>
                        </div>
                        <Radio className="h-5 w-5 text-red-400 animate-pulse" />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-left">
                          <p className="text-xl sm:text-2xl font-bold text-white mb-1 truncate">
                            {currentMatch.team_a}
                          </p>
                          <p className="text-xs text-zinc-500">Team A</p>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-5 mx-4 sm:mx-8">
                          <span className="text-3xl sm:text-5xl font-extrabold text-white tabular-nums">
                            {currentMatch.score_a}
                          </span>
                          <div className="flex flex-col items-center gap-1">
                            <Swords className="h-5 w-5 text-red-400" />
                            <span className="text-[10px] font-medium text-zinc-500 uppercase">
                              vs
                            </span>
                          </div>
                          <span className="text-3xl sm:text-5xl font-extrabold text-white tabular-nums">
                            {currentMatch.score_b}
                          </span>
                        </div>

                        <div className="flex-1 text-right">
                          <p className="text-xl sm:text-2xl font-bold text-white mb-1 truncate">
                            {currentMatch.team_b}
                          </p>
                          <p className="text-xs text-zinc-500">Team B</p>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                        <span className="text-xs text-zinc-500">{currentMatch.round}</span>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 group-hover:text-red-300 transition-colors">
                          Watch live <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            </section>
          )}

          {/* ── Upcoming Match ────────────────────────────────────────── */}
          {nextMatch && (
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
              <motion.div
                variants={scaleIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
              >
                <Link href="/schedule">
                  <Card className="relative overflow-hidden bg-white/[0.03] p-6 sm:p-8 group hover:border-white/[0.12] transition-all duration-500 rounded-[20px]">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl" />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <Clock className="h-5 w-5 text-orange-400" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                              Next Match
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {formatDate(nextMatch.match_date)} at {formatTime(nextMatch.match_date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-zinc-500">Round</p>
                          <p className="text-sm font-medium text-zinc-300">{nextMatch.round}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-left">
                          <p className="text-lg sm:text-xl font-bold text-white truncate">
                            {nextMatch.team_a}
                          </p>
                        </div>

                        <div className="mx-4 sm:mx-6">
                          <div className="flex items-center gap-2 rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-2">
                            <Target className="h-3.5 w-3.5 text-zinc-500" />
                            <span className="text-xs font-bold text-zinc-400 uppercase">VS</span>
                          </div>
                        </div>

                        <div className="flex-1 text-right">
                          <p className="text-lg sm:text-xl font-bold text-white truncate">
                            {nextMatch.team_b}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(nextMatch.match_date)} &middot; {formatTime(nextMatch.match_date)}
                        </div>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-orange-400 group-hover:text-orange-300 transition-colors">
                          View schedule <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            </section>
          )}

          {/* ── Featured Events ──────────────────────────────────────── */}
          {featuredEvents.length > 0 && (
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
              <motion.div
                variants={fadeUp}
                custom={0}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                className="mb-10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <Star className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Featured Events</h2>
                    <p className="mt-0.5 text-zinc-500">Don&apos;t miss these highlights</p>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredEvents.slice(0, 2).map((event, i) => (
                  <motion.div
                    key={event.id}
                    variants={scaleIn}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-30px" }}
                    custom={i}
                  >
                    <EventCard event={event} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* ── Running Events ──────────────────────────────────────── */}
          {runningEvents.length > 0 && (
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
              <motion.div
                variants={fadeUp}
                custom={0}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                className="mb-10"
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
                    <Flame className="h-5 w-5 text-red-400" />
                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Running Events</h2>
                    <p className="mt-0.5 text-zinc-500">Happening right now</p>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {runningEvents.map((event, i) => (
                  <motion.div
                    key={event.id}
                    variants={scaleIn}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-30px" }}
                    custom={i}
                  >
                    <EventCard event={event} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* ── Tournament Stats ──────────────────────────────────────── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
            <motion.div
              variants={fadeUp}
              custom={0}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="mb-10 text-center"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Tournament Overview</h2>
              <p className="mt-2 text-zinc-500">Key statistics at a glance</p>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                {
                  icon: Users,
                  label: "Total Teams",
                  value: teams.length,
                  color: "text-blue-400",
                  bg: "bg-blue-500/10 border-blue-500/20",
                },
                {
                  icon: Swords,
                  label: "Total Matches",
                  value: totalMatches,
                  color: "text-[#FF7A00]",
                  bg: "bg-[#FF7A00]/10 border-[#FF7A00]/20",
                },
                {
                  icon: Zap,
                  label: "Status",
                  value: tournamentStatus.charAt(0).toUpperCase() + tournamentStatus.slice(1),
                  color: tournamentStatus === "ongoing" ? "text-green-400" : tournamentStatus === "completed" ? "text-blue-400" : "text-zinc-400",
                  bg: tournamentStatus === "ongoing" ? "bg-green-500/10 border-green-500/20" : tournamentStatus === "completed" ? "bg-blue-500/10 border-blue-500/20" : "bg-zinc-500/10 border-zinc-500/20",
                },
                {
                  icon: Star,
                  label: "Players per Team",
                  value: settings?.players_per_team ?? 5,
                  color: "text-purple-400",
                  bg: "bg-purple-500/10 border-purple-500/20",
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  variants={fadeUp}
                  custom={i + 1}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-30px" }}
                >
                  <Card className="p-5 sm:p-6 bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 rounded-[20px] h-full">
                    <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl border", stat.bg)}>
                      <stat.icon className={cn("h-5 w-5", stat.color)} />
                    </div>
                    <p className="mt-4 text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── Bracket Preview ───────────────────────────────────────── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
            <motion.div
              variants={fadeUp}
              custom={0}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="mb-12 text-center"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Bracket Roadmap</h2>
              <p className="mt-2 text-zinc-500">The path to championship glory</p>
            </motion.div>

            <motion.div
              variants={scaleIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              <Card className="p-6 sm:p-10 bg-white/[0.03] border-white/[0.06] rounded-[20px] overflow-hidden">
                <div className="relative">
                  {/* Connection line */}
                  <div className="absolute top-6 left-[10%] right-[10%] h-px border-t-2 border-dashed border-white/[0.08]" />

                  <div className="relative flex items-start justify-between gap-2">
                    {(() => {
                      const rounds = bracket.rounds.filter(r => r.name !== "Champion");
                      const items = rounds.length > 0
                        ? [...rounds.map(r => ({ key: r.name, label: r.name, shortLabel: ROUND_NAME_MAP[r.name] || r.name.substring(0, 3).toUpperCase() })), { key: "champion", label: "Champion", shortLabel: "Winner" }]
                        : [{ key: "round-of-16", label: "Round of 16", shortLabel: "R16" }, { key: "quarter-final", label: "Quarter Final", shortLabel: "QF" }, { key: "semi-final", label: "Semi Final", shortLabel: "SF" }, { key: "grand-final", label: "Grand Final", shortLabel: "GF" }, { key: "champion", label: "Champion", shortLabel: "Winner" }];
                      return items;
                    })().map((round: { key: string; label: string; shortLabel: string }, i: number) => {
                      const isChampion = round.key === "champion";
                      return (
                        <div key={round.key} className="flex flex-col items-center flex-1 min-w-0">
                          <div
                            className={cn(
                              "relative z-10 flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-300",
                              isChampion
                                ? "bg-gradient-to-br from-[#FF7A00] to-amber-500 border-[#FF7A00] shadow-lg shadow-[#FF7A00]/20"
                                : "bg-[#09090B] border-white/[0.12] hover:border-white/[0.2]"
                            )}
                          >
                            {isChampion ? (
                              <Trophy className="h-5 w-5 text-white" />
                            ) : (
                              <span className="text-xs font-bold text-zinc-400">{round.shortLabel}</span>
                            )}
                          </div>
                          <p className={cn(
                            "mt-3 text-xs font-medium text-center hidden sm:block",
                            isChampion ? "text-[#FF7A00]" : "text-zinc-500"
                          )}>
                            {round.label}
                          </p>
                          <p className={cn(
                            "mt-2 text-[10px] font-medium text-center sm:hidden",
                            isChampion ? "text-[#FF7A00]" : "text-zinc-500"
                          )}>
                            {round.shortLabel}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-white/[0.06] flex justify-center">
                  <Link href="/bracket">
                    <Button variant="outline" className="group">
                      View Full Bracket
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </section>

          {/* ── Upcoming Events ──────────────────────────────────────── */}
          {allUpcomingEvents.length > 0 && (
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
              <motion.div
                variants={fadeUp}
                custom={0}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                className="mb-10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <CalendarDays className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white">Upcoming Events</h2>
                      <p className="mt-0.5 text-zinc-500">What&apos;s coming next</p>
                    </div>
                  </div>
                  <Link href="/events">
                    <Button variant="outline" className="group hidden sm:flex">
                      View All Events
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {allUpcomingEvents.slice(0, 4).map((event, i) => (
                  <motion.div
                    key={event.id}
                    variants={scaleIn}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-30px" }}
                    custom={i}
                  >
                    <EventCard event={event} />
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 flex justify-center sm:hidden">
                <Link href="/events">
                  <Button variant="outline" className="group">
                    View All Events
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </section>
          )}

          {/* ── Championship Arena ────────────────────────────────────── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 pb-24">
            <motion.div
              variants={scaleIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              <div className="relative overflow-hidden rounded-[20px] border border-white/[0.08] bg-gradient-to-br from-orange-500/10 via-[#09090B] to-[#09090B] p-8 sm:p-12 lg:p-16">
                <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl" />

                <div className="relative z-10 text-center">
                  <div className="mb-8 inline-flex">
                    <div className="relative">
                      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-[#FF7A00]/20 to-orange-600/10 blur-xl opacity-50" />
                      <Image
                        src="/logo.png"
                        alt="Neosoul Logo"
                        width={80}
                        height={80}
                        className="relative h-20 w-20 mx-auto rounded-2xl object-contain"
                      />
                    </div>
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                    Championship Arena
                  </h2>
                  <p className="max-w-lg mx-auto text-zinc-400 text-lg leading-relaxed mb-10">
                    Every match matters. Every play counts. Follow the journey from
                    the first round to the grand finals and witness champions being
                    crowned.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {(() => {
                      const rounds = bracket.rounds.filter(r => r.name !== "Champion");
                      const names = rounds.length > 0 ? rounds.map(r => r.name) : ["Round of 16", "Quarter Final", "Semi Final", "Grand Final"];
                      return names;
                    })().map(
                      (round, i) => (
                        <motion.div
                          key={round}
                          variants={fadeUp}
                          custom={i}
                          initial="hidden"
                          whileInView="visible"
                          viewport={{ once: true }}
                          className="rounded-xl border border-white/[0.08] bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-300 cursor-default"
                        >
                          {round}
                        </motion.div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </section>
          </>
          )}
        </PageWrapper>
      </main>

      <Footer />
    </div>
  );
}
