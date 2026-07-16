"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Save, Loader2, Globe, Clock, Users, Trophy, FileText, Palette } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function AdminSettingsPage() {
  const { settings, loading } = useSettings();
  const supabase = createClient();

  const [tournamentName, setTournamentName] = useState("");
  const [tournamentSubtitle, setTournamentSubtitle] = useState("");
  const [tournamentStatus, setTournamentStatus] = useState("upcoming");
  const [footerText, setFooterText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [matchDuration, setMatchDuration] = useState("45");
  const [breakDuration, setBreakDuration] = useState("10");
  const [bestOf, setBestOf] = useState("3");
  const [playersPerTeam, setPlayersPerTeam] = useState("5");
  const [timezone, setTimezone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  useEffect(() => {
    if (settings && !initialized) {
      setTournamentName(settings.tournament_name || "");
      setTournamentSubtitle(settings.tournament_subtitle || "");
      setTournamentStatus(settings.tournament_status || "upcoming");
      setFooterText(settings.footer_text || "");
      setStartDate(
        settings.tournament_start_date
          ? settings.tournament_start_date.slice(0, 10)
          : ""
      );
      setMatchDuration(String(settings.match_duration_minutes ?? 45));
      setBreakDuration(String(settings.break_duration_minutes ?? 10));
      setBestOf(String(settings.best_of ?? 3));
      setPlayersPerTeam(String(settings.players_per_team ?? 5));
      setInitialized(true);
    }
  }, [settings, initialized]);

  if (loading) return <LoadingSkeleton />;

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        tournament_name: tournamentName,
        tournament_subtitle: tournamentSubtitle,
        tournament_status: tournamentStatus,
        footer_text: footerText,
        tournament_start_date: startDate || null,
        match_duration_minutes: Number(matchDuration),
        break_duration_minutes: Number(breakDuration),
        best_of: Number(bestOf),
        players_per_team: Number(playersPerTeam),
        timezone,
      };

      if (settings?.id) {
        const { error } = await supabase
          .from("settings")
          .update(payload)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("settings").insert(payload);
        if (error) throw error;
      }

      setMessage("Settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("Error saving settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20">
            <Settings className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-sm text-zinc-400">
              Configure tournament settings
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </Button>
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-xl px-4 py-3 text-sm",
            message.includes("Error")
              ? "border border-red-500/30 bg-red-500/10 text-red-400"
              : "border border-green-500/30 bg-green-500/10 text-green-400"
          )}
        >
          {message}
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
              <Trophy className="h-4 w-4 text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              Tournament Information
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-zinc-300 mb-2 block">
                Tournament Name
              </label>
              <Input
                placeholder="Neosoul Tournament"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-zinc-300 mb-2 block">
                Tournament Subtitle
              </label>
              <Input
                placeholder="Indonesian Community Tournament"
                value={tournamentSubtitle}
                onChange={(e) => setTournamentSubtitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-zinc-300 mb-2 block">
                Tournament Status
              </label>
              <Select
                value={tournamentStatus}
                onChange={(e) => setTournamentStatus(e.target.value)}
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </Select>
            </div>

            <div>
              <label className="text-sm text-zinc-300 mb-2 block">
                Footer Text
              </label>
              <Input
                placeholder="Built for the community, by the community."
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
              <Clock className="h-4 w-4 text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              Schedule Configuration
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-zinc-300 mb-2 block">
                Tournament Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-zinc-300 mb-2 block">
                Match Duration
              </label>
              <Select
                value={matchDuration}
                onChange={(e) => setMatchDuration(e.target.value)}
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">120 minutes</option>
              </Select>
            </div>

            <div>
              <label className="text-sm text-zinc-300 mb-2 block">
                Break Duration
              </label>
              <Select
                value={breakDuration}
                onChange={(e) => setBreakDuration(e.target.value)}
              >
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="20">20 minutes</option>
                <option value="30">30 minutes</option>
              </Select>
            </div>

            <div>
              <label className="text-sm text-zinc-300 mb-2 block">
                Best Of Default
              </label>
              <Select
                value={bestOf}
                onChange={(e) => setBestOf(e.target.value)}
              >
                <option value="1">BO1</option>
                <option value="3">BO3</option>
                <option value="5">BO5</option>
              </Select>
            </div>

            <div>
              <label className="text-sm text-zinc-300 mb-2 block">
                Players Per Team
              </label>
              <Select
                value={playersPerTeam}
                onChange={(e) => setPlayersPerTeam(e.target.value)}
              >
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
              </Select>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
              <Globe className="h-4 w-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Timezone</h3>
          </div>

          <div>
            <label className="text-sm text-zinc-300 mb-2 block">
              Auto-detected Timezone
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                value={timezone}
                readOnly
                className="pl-10 text-zinc-300"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1.5">
              Timezone is auto-detected from your browser settings and saved
              with the configuration.
            </p>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
