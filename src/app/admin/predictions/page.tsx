"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Target,
  Loader2,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Trophy,
  ToggleLeft,
  ToggleRight,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useEvents } from "@/hooks/use-events";
import { deleteEvent } from "@/services/event-service";
import {
  getPredictionSettings,
  upsertPredictionSettings,
  exportPredictionsCSV,
  resetPredictions,
} from "@/services/prediction-service";
import type { PredictionSettings } from "@/lib/prediction-types";
import type { Event } from "@/lib/types";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function AdminPredictionsPage() {
  const { events, loading: eventsLoading, refetch } = useEvents();
  const [settingsMap, setSettingsMap] = useState<Record<string, PredictionSettings>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    enabled: false,
    lock_minutes_before: 5,
    leaderboard_enabled: true,
    points_enabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);

  const tournamentEvents = events.filter(
    (e) => e.category === "prediction"
  );

  useEffect(() => {
    if (eventsLoading || tournamentEvents.length === 0) return;
    let cancelled = false;

    async function load() {
      for (const event of tournamentEvents) {
        const s = await getPredictionSettings(event.id);
        if (!cancelled && s) {
          setSettingsMap((prev) => ({ ...prev, [event.id]: s }));
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [eventsLoading, tournamentEvents]);

  const handleEdit = useCallback((event: Event) => {
    const existing = settingsMap[event.id];
    setEditingId(event.id);
    setEditForm({
      enabled: existing?.enabled ?? false,
      lock_minutes_before: existing?.lock_minutes_before ?? 5,
      leaderboard_enabled: existing?.leaderboard_enabled ?? true,
      points_enabled: existing?.points_enabled ?? true,
    });
  }, [settingsMap]);

  const handleSave = useCallback(async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await upsertPredictionSettings(editingId, editForm);
      await upsertEventPredictionEnabled(editingId, editForm.enabled);
      const s = await getPredictionSettings(editingId);
      if (s) setSettingsMap((prev) => ({ ...prev, [editingId]: s }));
      setEditingId(null);
      setMessage({ type: "success", text: "Prediction settings saved." });
    } catch {
      setMessage({ type: "error", text: "Failed to save settings." });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }, [editingId, editForm]);

  const handleExport = useCallback(async (eventId: string) => {
    try {
      const csv = await exportPredictionsCSV(eventId);
      if (!csv) {
        setMessage({ type: "error", text: "No prediction data to export." });
        setTimeout(() => setMessage(null), 3000);
        return;
      }
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `predictions-${eventId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMessage({ type: "error", text: "Failed to export predictions." });
      setTimeout(() => setMessage(null), 3000);
    }
  }, []);

  const handleReset = useCallback(async (eventId: string) => {
    if (!confirm("Are you sure you want to reset all predictions for this event? This cannot be undone.")) return;
    setResettingId(eventId);
    try {
      await resetPredictions(eventId);
      setMessage({ type: "success", text: "Predictions reset successfully." });
    } catch {
      setMessage({ type: "error", text: "Failed to reset predictions." });
    } finally {
      setResettingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEvent(deleteTarget.id);
      setDeleteTarget(null);
      refetch();
      setMessage({ type: "success", text: "Prediction event deleted." });
    } catch {
      setMessage({ type: "error", text: "Failed to delete event." });
    } finally {
      setDeleting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }, [deleteTarget, refetch]);

  if (eventsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-white/[0.06] rounded-lg animate-pulse" />
        <div className="h-32 bg-white/[0.04] rounded-[20px] animate-pulse" />
        <div className="h-32 bg-white/[0.04] rounded-[20px] animate-pulse" />
      </div>
    );
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
            <Target className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Predictions</h1>
            <p className="text-sm text-zinc-400">
              Manage prediction settings for events
            </p>
          </div>
        </div>
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-xl px-4 py-3 text-sm flex items-center gap-2",
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

      {tournamentEvents.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="p-8 bg-white/[0.03] border-white/[0.06] rounded-[20px] text-center">
            <Target className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No events found</p>
            <p className="text-xs text-zinc-600 mt-1">Create events to enable predictions</p>
          </Card>
        </motion.div>
      ) : (
        tournamentEvents.map((event) => {
          const settings = settingsMap[event.id];
          const isEditing = editingId === event.id;

          return (
            <motion.div key={event.id} variants={itemVariants}>
              <Card className="bg-white/[0.03] border-white/[0.06] rounded-[20px] overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        settings?.enabled ? "bg-green-500/20" : "bg-zinc-500/20"
                      )}>
                        {settings?.enabled ? (
                          <ToggleRight className="h-4 w-4 text-green-400" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-zinc-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{event.title}</h3>
                        <p className="text-xs text-zinc-500 capitalize">{event.category} · {event.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/predictions/leaderboard?event=${event.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1.5 text-zinc-400 hover:text-white">
                          <Trophy className="h-3.5 w-3.5" />
                          Leaderboard
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-zinc-400 hover:text-white"
                        onClick={() => handleExport(event.id)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Export
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => handleReset(event.id)}
                        disabled={resettingId === event.id}
                      >
                        {resettingId === event.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Reset
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => setDeleteTarget(event)}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => isEditing ? setEditingId(null) : handleEdit(event)}
                      >
                        <Settings className="h-3.5 w-3.5" />
                        {isEditing ? "Cancel" : "Configure"}
                      </Button>
                    </div>
                  </div>

                  {settings && !isEditing && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                        <p className="text-xs text-zinc-500">Status</p>
                        <p className={cn("text-sm font-semibold", settings.enabled ? "text-green-400" : "text-zinc-400")}>
                          {settings.enabled ? "Enabled" : "Disabled"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                        <p className="text-xs text-zinc-500">Lock Time</p>
                        <p className="text-sm font-semibold text-white">{settings.lock_minutes_before}m</p>
                      </div>
                      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                        <p className="text-xs text-zinc-500">Leaderboard</p>
                        <p className={cn("text-sm font-semibold", settings.leaderboard_enabled ? "text-green-400" : "text-zinc-400")}>
                          {settings.leaderboard_enabled ? "On" : "Off"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                        <p className="text-xs text-zinc-500">Points</p>
                        <p className={cn("text-sm font-semibold", settings.points_enabled ? "text-green-400" : "text-zinc-400")}>
                          {settings.points_enabled ? "On" : "Off"}
                        </p>
                      </div>
                    </div>
                  )}

                  {isEditing && (
                    <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium text-zinc-200">Enable Predictions</p>
                          <p className="text-xs text-zinc-500">Turn predictions on for this event</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditForm((p) => ({ ...p, enabled: !p.enabled }))}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            editForm.enabled ? "bg-orange-500" : "bg-zinc-700"
                          )}
                        >
                          <span className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform",
                            editForm.enabled ? "translate-x-6" : "translate-x-1"
                          )} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm text-zinc-300 mb-2 block">Lock Time (minutes before match)</label>
                          <Select
                            value={String(editForm.lock_minutes_before)}
                            onChange={(e) => setEditForm((p) => ({ ...p, lock_minutes_before: Number(e.target.value) }))}
                          >
                            <option value="0">0 (no lock)</option>
                            <option value="5">5 minutes</option>
                            <option value="10">10 minutes</option>
                            <option value="15">15 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="60">60 minutes</option>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between sm:justify-start sm:flex-col sm:items-start gap-2">
                          <div>
                            <p className="text-sm font-medium text-zinc-200">Leaderboard</p>
                            <p className="text-xs text-zinc-500">Show ranking</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditForm((p) => ({ ...p, leaderboard_enabled: !p.leaderboard_enabled }))}
                            className={cn(
                              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                              editForm.leaderboard_enabled ? "bg-orange-500" : "bg-zinc-700"
                            )}
                          >
                            <span className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform",
                              editForm.leaderboard_enabled ? "translate-x-6" : "translate-x-1"
                            )} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between sm:justify-start sm:flex-col sm:items-start gap-2">
                          <div>
                            <p className="text-sm font-medium text-zinc-200">Point System</p>
                            <p className="text-xs text-zinc-500">Award points</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditForm((p) => ({ ...p, points_enabled: !p.points_enabled }))}
                            className={cn(
                              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                              editForm.points_enabled ? "bg-orange-500" : "bg-zinc-700"
                            )}
                          >
                            <span className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform",
                              editForm.points_enabled ? "translate-x-6" : "translate-x-1"
                            )} />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Save Settings
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })
      )}

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteTarget(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-[20px] border border-white/[0.08] bg-[#18181B]/95 backdrop-blur-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 border border-red-500/25">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Prediction Event</h3>
                  <p className="text-sm text-zinc-400 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-zinc-300 mb-2">
                Are you sure you want to delete <span className="font-semibold text-white">{deleteTarget.title}</span>?
              </p>
              <p className="text-xs text-zinc-500 mb-6">
                All predictions, user stats, and associated data will be permanently removed.
              </p>
              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="gap-2"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete Event
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

async function upsertEventPredictionEnabled(eventId: string, enabled: boolean) {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  await supabase
    .from("events")
    .update({ prediction_enabled: enabled, updated_at: new Date().toISOString() })
    .eq("id", eventId);
}
