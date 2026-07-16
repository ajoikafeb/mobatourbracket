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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useMatches, useCurrentMatch } from "@/hooks/use-matches";
import { useBrackets } from "@/hooks/use-brackets";
import { useSettings } from "@/hooks/use-settings";

const quickActions = [
  {
    href: "/admin/bracket",
    label: "Edit Bracket",
    icon: Swords,
    color: "bg-orange-500/20 text-orange-400",
  },
  {
    href: "/admin/schedule",
    label: "Edit Schedule",
    icon: Calendar,
    color: "bg-blue-500/20 text-blue-400",
  },
  {
    href: "/admin/current-match",
    label: "Update Match",
    icon: Radio,
    color: "bg-red-500/20 text-red-400",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Trophy,
    color: "bg-purple-500/20 text-purple-400",
  },
];

export default function AdminDashboardPage() {
  const { matches } = useMatches();
  const { match: currentMatch } = useCurrentMatch();
  const { brackets } = useBrackets();
  const { settings } = useSettings();

  const totalMatches = matches.length;
  const finishedMatches = matches.filter((m) => m.status === "finished").length;
  const liveMatches = matches.filter((m) => m.status === "live").length;
  const waitingMatches = matches.filter((m) => m.status === "waiting").length;

  const stats = [
    {
      label: "Total Matches",
      value: totalMatches,
      icon: Swords,
      color: "bg-orange-500/20 text-orange-400",
    },
    {
      label: "Finished",
      value: finishedMatches,
      icon: CheckCircle2,
      color: "bg-green-500/20 text-green-400",
    },
    {
      label: "Live",
      value: liveMatches,
      icon: Zap,
      color: "bg-red-500/20 text-red-400",
    },
    {
      label: "Waiting",
      value: waitingMatches,
      icon: Clock,
      color: "bg-zinc-500/20 text-zinc-400",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Tournament overview and quick actions
        </p>
      </div>

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
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              Tournament Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Status</span>
                <StatusBadge
                  status={
                    settings?.tournament_status === "ongoing"
                      ? "live"
                      : settings?.tournament_status === "completed"
                      ? "finished"
                      : "waiting"
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Teams in Bracket</span>
                <span className="text-sm font-medium text-white">
                  {brackets.filter((b) => b.team_name).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Total Matches</span>
                <span className="text-sm font-medium text-white">
                  {totalMatches}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              Current Match
            </h3>
            {currentMatch ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white font-medium">
                    {currentMatch.team_a}
                  </span>
                  <span className="text-lg font-bold text-white">
                    {currentMatch.score_a} - {currentMatch.score_b}
                  </span>
                  <span className="text-sm text-white font-medium">
                    {currentMatch.team_b}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Round</span>
                  <span className="text-sm text-white">
                    {currentMatch.round}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No live match</p>
            )}
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="p-5 hover:border-orange-500/20 transition-all duration-300 group cursor-pointer">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color} mb-3`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                      {action.label}
                    </span>
                    <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-orange-400 transition-colors" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
