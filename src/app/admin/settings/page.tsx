"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Settings, Save, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";

export default function AdminSettingsPage() {
  const { settings, loading } = useSettings();
  const defaults = useMemo(() => ({
    tournamentName: settings?.tournament_name || "",
    tournamentSubtitle: settings?.tournament_subtitle || "",
    tournamentStatus: settings?.tournament_status || "upcoming",
    footerText: settings?.footer_text || "",
  }), [settings]);

  const [tournamentName, setTournamentName] = useState(defaults.tournamentName);
  const [tournamentSubtitle, setTournamentSubtitle] = useState(defaults.tournamentSubtitle);
  const [tournamentStatus, setTournamentStatus] = useState<string>(defaults.tournamentStatus);
  const [footerText, setFooterText] = useState(defaults.footerText);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  if (loading) return <LoadingSkeleton />;

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      if (settings?.id) {
        const { error } = await supabase
          .from("settings")
          .update({
            tournament_name: tournamentName,
            tournament_subtitle: tournamentSubtitle,
            tournament_status: tournamentStatus,
            footer_text: footerText,
          })
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("settings").insert({
          tournament_name: tournamentName,
          tournament_subtitle: tournamentSubtitle,
          tournament_status: tournamentStatus,
          footer_text: footerText,
        });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
            <Settings className="h-5 w-5 text-purple-400" />
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
      </div>

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

      <Card className="p-6 space-y-6">
        <h3 className="text-sm font-semibold text-white">
          Tournament Information
        </h3>

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
              Subtitle
            </label>
            <Input
              placeholder="Community Mobile MOBA Tournament"
              value={tournamentSubtitle}
              onChange={(e) => setTournamentSubtitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-zinc-300 mb-2 block">
              Status
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
    </div>
  );
}
