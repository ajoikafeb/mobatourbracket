"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Swords,
  Calendar,
  Radio,
  Trophy,
  CheckCircle2,
  Clock,
  Zap,
  ArrowRight,
  Users,
  Sparkles,
  Settings,
  Wand2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useMatches, useCurrentMatch } from "@/hooks/use-matches";
import { useBrackets } from "@/hooks/use-brackets";
import { useTeams } from "@/hooks/use-teams";
import { useSettings } from "@/hooks/use-settings";

const quickActions = [
  {
    href: "/admin/tournament-generator",
    label: "Tournament Generator",
    icon: Wand2,
    color: "bg-orange-500/20 text-orange-400",
    highlight: true,
  },
  {
    href: "/admin/schedule-generator",
    label: "Schedule Generator",
    icon: Calendar,
    color: "bg-blue-500/20 text-blue-400",
    highlight: false,
  },
  {
    href: "/admin/bracket",
    label: "Edit Bracket",
    icon: Swords,
    color: "bg-orange-500/20 text-orange-400",
    highlight: false,
  },
  {
    href: "/admin/schedule",
    label: "Edit Schedule",
    icon: Clock,
    color: "bg-green-500/20 text-green-400",
    highlight: false,
  },
  {
    href: "/admin/current-match",
    label: "Current Match",
    icon: Radio,
    color: "bg-red-500/20 text-red-400",
    highlight: false,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
    color: "bg-purple-500/20 text-purple-400",
    highlight: false,
  },
];

export default function AdminDashboardPage() {
  const { matches } = useMatches();
  const { match: currentMatch } = useCurrentMatch();
  const { brackets } = useBrackets();
  const { teams } = useTeams();
  const { settings } = useSettings();

  const totalMatches = matches.length;
  const liveMatches = matches.filter((m) => m.status === "live").length;
  const totalTeams = teams.length;

  const stats = [
    {
      label: "Total Teams",
      value: totalTeams,
      icon: Users,
      color: "bg-blue-500/20 text-blue-400",
    },
    {
      label: "Total Matches",
      value: totalMatches,
      icon: Swords,
      color: "bg-orange-500/20 text-orange-400",
    },
    {
      label: "Live Now",
      value: liveMatches,
      icon: Zap,
      color: "bg-red-500/20 text-red-400",
    },
    {
      label: "Tournament Status",
      value: settings?.tournament_status || "pending",
      icon: Trophy,
      color: "bg-purple-500/20 text-purple-400",
      isText: true,
    },
  ];

  const recentMatches = matches
    .filter((m) => m.status === "finished" || m.status === "live")
    .slice(-5)
    .reverse();

  return (
    <div className="min-h-screen bg-zinc-950 p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Tournament overview and quick actions
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="p-5 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">
                  {stat.isText ? (
                    <span className="text-lg capitalize">{stat.value}</span>
                  ) : (
                    stat.value
                  )}
                </p>
                <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {currentMatch && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link href="/admin/current-match">
            <Card className="p-6 bg-gradient-to-r from-red-500/10 via-zinc-900/50 to-orange-500/10 border-red-500/30 hover:border-red-500/50 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-2 w-2 items-center justify-center rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                  Live Match
                </span>
                <Radio className="h-4 w-4 text-red-400 ml-auto" />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-xl font-bold text-white">
                    {currentMatch.team_a}
                  </p>
                  <p className="text-3xl font-bold text-orange-400 mt-1">
                    {currentMatch.score_a}
                  </p>
                </div>
                <div className="text-center px-6">
                  <p className="text-xs text-zinc-500 mb-1">vs</p>
                  <StatusBadge status="live" />
                  <p className="text-xs text-zinc-400 mt-2">
                    {currentMatch.round}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-white">
                    {currentMatch.team_b}
                  </p>
                  <p className="text-3xl font-bold text-orange-400 mt-1">
                    {currentMatch.score_b}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center mt-4 text-xs text-zinc-500 group-hover:text-orange-400 transition-colors">
                <span>Click to update</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </Card>
          </Link>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-orange-400" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card
                  className={`p-5 transition-all duration-300 group cursor-pointer ${
                    action.highlight
                      ? "bg-gradient-to-br from-orange-500/20 to-orange-500/5 border-orange-500/30 hover:border-orange-500/50 col-span-2 lg:col-span-1"
                      : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color} ${
                        action.highlight ? "h-14 w-14" : ""
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${
                          action.highlight ? "h-7 w-7" : ""
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-medium text-white ${
                          action.highlight ? "text-lg" : "text-sm"
                        }`}
                      >
                        {action.label}
                      </p>
                      {action.highlight && (
                        <p className="text-xs text-orange-400 mt-0.5">
                          Generate brackets
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-5 w-5 text-zinc-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
        <Card className="bg-zinc-900/50 border-zinc-800 divide-y divide-zinc-800">
          {recentMatches.length > 0 ? (
            recentMatches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={match.status} />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {match.team_a} vs {match.team_b}
                    </p>
                    <p className="text-xs text-zinc-500">{match.round}</p>
                  </div>
                </div>
                <div className="text-right">
                  {match.status === "finished" ? (
                    <p className="text-sm font-bold text-white">
                      {match.score_a} - {match.score_b}
                    </p>
                  ) : (
                    <p className="text-xs text-red-400 animate-pulse">LIVE</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-zinc-500">No recent matches</p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
