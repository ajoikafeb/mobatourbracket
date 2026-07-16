"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Swords,
  Calendar,
  Users,
  FileSpreadsheet,
  Trophy,
  Loader2,
  Check,
} from "lucide-react";
import { useTournament } from "@/hooks/use-tournament";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatDate, formatTime } from "@/lib/utils";

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ExportPage() {
  const { matches, teams, settings, bracket } = useTournament();
  const [exported, setExported] = useState<Record<string, boolean>>({});

  const markExported = (key: string) => {
    setExported((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setExported((prev) => ({ ...prev, [key]: false })), 2000);
  };

  const exportBracketCSV = () => {
    const sorted = [...matches].sort(
      (a, b) => a.round_order - b.round_order || a.match_index - b.match_index
    );
    const header = "Round,Match #,Team A,Score A,Score B,Team B,Status,Winner,Date\n";
    const rows = sorted
      .map(
        (m) =>
          `"${m.round}",${m.match_index},"${m.team_a}",${m.score_a},${m.score_b},"${m.team_b}","${m.status}","${m.winner || ""}","${m.match_date ? formatDate(m.match_date) : ""}"`
      )
      .join("\n");
    downloadCSV("bracket.csv", header + rows);
    markExported("bracket-csv");
  };

  const exportBracketJSON = () => {
    const sorted = [...matches].sort(
      (a, b) => a.round_order - b.round_order || a.match_index - b.match_index
    );
    downloadJSON("bracket.json", {
      tournament: settings?.tournament_name || "Tournament",
      rounds: bracket.rounds.map((r) => ({
        name: r.name,
        matches: sorted
          .filter((m) => m.round === r.name)
          .map((m) => ({
            match_index: m.match_index,
            team_a: m.team_a,
            team_b: m.team_b,
            score_a: m.score_a,
            score_b: m.score_b,
            status: m.status,
            winner: m.winner,
            match_date: m.match_date,
          })),
      })),
    });
    markExported("bracket-json");
  };

  const exportScheduleCSV = () => {
    const sorted = [...matches].sort(
      (a, b) => a.round_order - b.round_order || a.match_index - b.match_index
    );
    const header = "Round,Match #,Team A,Team B,Best Of,Date,Time,Status,Winner\n";
    const rows = sorted
      .map(
        (m) =>
          `"${m.round}",${m.match_index},"${m.team_a}","${m.team_b}",BO${m.best_of},"${m.match_date ? formatDate(m.match_date) : ""}","${m.match_date ? formatTime(m.match_date) : ""}","${m.status}","${m.winner || ""}"`
      )
      .join("\n");
    downloadCSV("schedule.csv", header + rows);
    markExported("schedule-csv");
  };

  const exportScheduleJSON = () => {
    const sorted = [...matches].sort(
      (a, b) => a.round_order - b.round_order || a.match_index - b.match_index
    );
    downloadJSON("schedule.json", {
      tournament: settings?.tournament_name || "Tournament",
      matches: sorted.map((m) => ({
        round: m.round,
        round_order: m.round_order,
        match_index: m.match_index,
        team_a: m.team_a,
        team_b: m.team_b,
        best_of: m.best_of,
        date: m.match_date,
        status: m.status,
        winner: m.winner,
      })),
    });
    markExported("schedule-json");
  };

  const exportTeamsCSV = () => {
    const header = "Seed,Team Name,Captain,Player 1,Player 2,Player 3,Player 4,Player 5,Player 6,Substitute\n";
    const sorted = [...teams].sort((a, b) => a.seed - b.seed);
    const rows = sorted
      .map(
        (t) =>
          `${t.seed},"${t.team_name}","${t.captain}","${t.player_1}","${t.player_2}","${t.player_3}","${t.player_4}","${t.player_5}","${t.player_6}","${t.substitute || ""}"`
      )
      .join("\n");
    downloadCSV("teams.csv", header + rows);
    markExported("teams-csv");
  };

  const exportTeamsJSON = () => {
    const sorted = [...teams].sort((a, b) => a.seed - b.seed);
    downloadJSON("teams.json", {
      tournament: settings?.tournament_name || "Tournament",
      teams: sorted.map((t) => ({
        seed: t.seed,
        team_name: t.team_name,
        captain: t.captain,
        roster: [t.player_1, t.player_2, t.player_3, t.player_4, t.player_5, t.player_6].filter(Boolean),
        substitute: t.substitute,
      })),
    });
    markExported("teams-json");
  };

  const exportPlacements = () => {
    const sorted = [...matches].sort(
      (a, b) => a.round_order - b.round_order || a.match_index - b.match_index
    );
    const champion = sorted.find(
      (m) => m.round_order === Math.max(...sorted.map((x) => x.round_order)) && m.winner
    )?.winner;

    const grandFinal = sorted.filter(
      (m) => m.round === "Grand Final" && m.winner
    );

    const semiFinalWinners = sorted.filter(
      (m) => m.round === "Semi Final" && m.winner
    ).map((m) => m.winner!);

    const semiFinalLosers = sorted.filter(
      (m) => m.round === "Semi Final" && m.winner
    ).flatMap((m) => {
      const losers: string[] = [];
      if (m.team_a && m.team_a !== m.winner) losers.push(m.team_a);
      if (m.team_b && m.team_b !== m.winner) losers.push(m.team_b);
      return losers;
    });

    const placements: { placement: number; team: string }[] = [];
    if (champion) placements.push({ placement: 1, team: champion });
    const runnerUp = grandFinal.flatMap((m) => {
      const ru: string[] = [];
      if (m.team_a && m.team_a !== m.winner) ru.push(m.team_a);
      if (m.team_b && m.team_b !== m.winner) ru.push(m.team_b);
      return ru;
    })[0];
    if (runnerUp) placements.push({ placement: 2, team: runnerUp });
    semiFinalWinners.filter((w) => w !== champion).forEach((w) => {
      if (!placements.find((p) => p.team === w)) {
        placements.push({ placement: 3, team: w });
      }
    });
    semiFinalLosers.filter((l) => !placements.find((p) => p.team === l)).forEach((l, i) => {
      placements.push({ placement: 4 + i, team: l });
    });

    const header = "Placement,Team\n";
    const rows = placements.map((p) => `${p.placement},"${p.team}"`).join("\n");
    downloadCSV("placements.csv", header + rows);
    markExported("placements");
  };

  const exportAll = () => {
    exportBracketCSV();
    exportScheduleCSV();
    exportTeamsCSV();
    exportPlacements();
    markExported("all");
  };

  const sections = [
    {
      key: "bracket",
      title: "Bracket Data",
      description: "All tournament bracket matches with scores and results",
      icon: Swords,
      stats: `${matches.length} matches across ${bracket.rounds.length} rounds`,
      actions: [
        { label: "CSV", onClick: exportBracketCSV, key: "bracket-csv", icon: FileSpreadsheet },
        { label: "JSON", onClick: exportBracketJSON, key: "bracket-json", icon: Download },
      ],
    },
    {
      key: "schedule",
      title: "Schedule",
      description: "Full match schedule with dates, times, and status",
      icon: Calendar,
      stats: `${matches.filter((m) => m.match_date).length} scheduled matches`,
      actions: [
        { label: "CSV", onClick: exportScheduleCSV, key: "schedule-csv", icon: FileSpreadsheet },
        { label: "JSON", onClick: exportScheduleJSON, key: "schedule-json", icon: Download },
      ],
    },
    {
      key: "teams",
      title: "Team Members",
      description: "All registered teams with full roster details",
      icon: Users,
      stats: `${teams.length} teams registered`,
      actions: [
        { label: "CSV", onClick: exportTeamsCSV, key: "teams-csv", icon: FileSpreadsheet },
        { label: "JSON", onClick: exportTeamsJSON, key: "teams-json", icon: Download },
      ],
    },
    {
      key: "placements",
      title: "Placements",
      description: "Final tournament placements and rankings",
      icon: Trophy,
      stats: "Based on bracket results",
      actions: [
        { label: "CSV", onClick: exportPlacements, key: "placements", icon: Trophy },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Export Data</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Download tournament data in CSV or JSON format
          </p>
        </div>
        <Button
          onClick={exportAll}
          className={cn(
            "gap-2 transition-all",
            exported["all"]
              ? "bg-green-500/20 text-green-400 border-green-500/30"
              : "bg-orange-500 hover:bg-orange-600 text-white"
          )}
        >
          {exported["all"] ? (
            <Check className="h-4 w-4" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {exported["all"] ? "Downloaded!" : "Export All (CSV)"}
        </Button>
      </div>

      <div className="grid gap-4">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-5 rounded-[16px] bg-white/[0.03] border-white/[0.06] hover:border-white/[0.1] transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 shrink-0">
                      <Icon className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {section.title}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {section.description}
                      </p>
                      <p className="text-xs text-zinc-600 mt-1">{section.stats}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {section.actions.map((action) => {
                      const ActionIcon = action.icon;
                      return (
                        <Button
                          key={action.key}
                          variant="outline"
                          size="sm"
                          onClick={action.onClick}
                          className={cn(
                            "gap-1.5 transition-all",
                            exported[action.key] &&
                              "border-green-500/30 text-green-400"
                          )}
                        >
                          {exported[action.key] ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <ActionIcon className="h-3.5 w-3.5" />
                          )}
                          {exported[action.key] ? "Done" : action.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
