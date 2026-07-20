"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  Users,
  Image,
  Tag,
  FileText,
  Globe,
  Star,
  RefreshCw,
  ClipboardList,
  Target,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getEventById, updateEvent } from "@/services/event-service";
import { getPredictionEventMatches, setPredictionEventMatches } from "@/services/prediction-service";
import { uploadEventMedia } from "@/services/upload-service";
import type { EventCategory, EventStatus, RegistrationStatus } from "@/lib/types";
import { EVENT_CATEGORY_MAP } from "@/lib/types";
import type { Match } from "@/lib/types";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toLocalDatetimeString(isoString: string | null): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateForDB(localDatetime: string): string | null {
  if (!localDatetime) return null;
  return new Date(localDatetime).toISOString();
}

const STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "registration_open", label: "Registration Open" },
  { value: "registration_closed", label: "Registration Closed" },
  { value: "upcoming", label: "Upcoming" },
  { value: "running", label: "Running" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const REGISTRATION_OPTIONS: { value: RegistrationStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "invite_only", label: "Invite Only" },
];

interface FormData {
  title: string;
  slug: string;
  category: EventCategory;
  description: string;
  banner: string;
  thumbnail: string;
  status: EventStatus;
  registration_status: RegistrationStatus;
  start_date: string;
  end_date: string;
  location: string;
  max_participants: number;
  featured: boolean;
  published: boolean;
  prediction_enabled: boolean;
}

const EMPTY_FORM: FormData = {
  title: "",
  slug: "",
  category: "tournament",
  description: "",
  banner: "",
  thumbnail: "",
  status: "draft",
  registration_status: "open",
  start_date: "",
  end_date: "",
  location: "",
  max_participants: 0,
  featured: false,
  published: false,
  prediction_enabled: false,
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Prediction event match selection
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const event = await getEventById(id);
        if (cancelled) return;
        if (!event) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setForm({
          title: event.title,
          slug: event.slug,
          category: event.category,
          description: event.description,
          banner: event.banner || "",
          thumbnail: event.thumbnail || "",
          status: event.status,
          registration_status: event.registration_status,
          start_date: toLocalDatetimeString(event.start_date),
          end_date: toLocalDatetimeString(event.end_date),
          location: event.location || "",
          max_participants: event.max_participants,
          featured: event.featured,
          published: event.published,
          prediction_enabled: event.prediction_enabled || false,
        });

        // If prediction event, load matches + linked match IDs
        if (event.category === "prediction") {
          const [linkedIds, matchesResult] = await Promise.all([
            getPredictionEventMatches(event.id).catch(() => []),
            import("@/lib/supabase/client").then(({ createClient }) => {
              const supabase = createClient();
              return supabase.from("matches").select("*").order("match_date", { ascending: true });
            }),
          ]);
          if (!cancelled) {
            setAllMatches((matchesResult.data as Match[]) || []);
            setSelectedMatchIds(linkedIds);
          }
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const updateField = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        if (key === "title" && !slugEdited) {
          next.slug = generateSlug(value as string);
        }
        return next;
      });
    },
    [slugEdited]
  );

  const handleSlugChange = useCallback((value: string) => {
    setSlugEdited(true);
    setForm((prev) => ({ ...prev, slug: value }));
  }, []);

  const buildPayload = useCallback(
    (publishOverride?: boolean) => ({
      title: form.title,
      slug: form.slug || generateSlug(form.title),
      category: form.category,
      description: form.description,
      banner: form.banner || null,
      thumbnail: form.thumbnail || null,
      status: form.status,
      registration_status: form.registration_status,
      start_date: formatDateForDB(form.start_date),
      end_date: formatDateForDB(form.end_date),
      location: form.location,
      max_participants: form.max_participants,
      featured: form.featured,
      published: publishOverride ?? form.published,
      prediction_enabled: form.prediction_enabled,
    }),
    [form]
  );

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) {
      setMessage({ type: "error", text: "Title is required." });
      return;
    }
    if (form.category === "prediction" && selectedMatchIds.length === 0) {
      setMessage({ type: "error", text: "Select at least one match for prediction." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await updateEvent(id, buildPayload());
      if (form.category === "prediction") {
        await setPredictionEventMatches(id, selectedMatchIds);
      }
      setMessage({ type: "success", text: "Event saved successfully." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save event.";
      setMessage({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  }, [form, id, buildPayload, selectedMatchIds]);

  const handlePublish = useCallback(async () => {
    if (!form.title.trim()) {
      setMessage({ type: "error", text: "Title is required." });
      return;
    }
    if (form.category === "prediction" && selectedMatchIds.length === 0) {
      setMessage({ type: "error", text: "Select at least one match for prediction." });
      return;
    }
    setPublishing(true);
    setMessage(null);
    try {
      await updateEvent(id, buildPayload(true));
      if (form.category === "prediction") {
        await setPredictionEventMatches(id, selectedMatchIds);
      }
      setForm((prev) => ({ ...prev, published: true }));
      setMessage({ type: "success", text: "Event published successfully." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish event.";
      setMessage({ type: "error", text: msg });
    } finally {
      setPublishing(false);
    }
  }, [form, id, buildPayload, selectedMatchIds]);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-8 w-32 bg-white/[0.06] rounded-lg animate-pulse" />
          <div className="h-10 w-64 bg-white/[0.06] rounded-lg animate-pulse" />
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-11 w-full bg-white/[0.04] rounded-xl animate-pulse" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#09090B] p-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <AlertCircle className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Event Not Found</h2>
          <p className="text-sm text-zinc-400 mb-6">
            The event you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/admin/events">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] p-6">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-6">
        {/* ── Header ──────────────────────────── */}
        <motion.div variants={item}>
          <Link
            href="/admin/events"
            className="flex items-center gap-1 text-sm text-zinc-500 hover:text-orange-400 transition-colors mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Events
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Edit Event</h1>
              <p className="text-sm text-zinc-400 mt-1">
                Update the details for <span className="text-orange-400 font-medium">{form.title}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/admin/events/${id}/form`}>
                <Button
                  variant="outline"
                  className="gap-2"
                >
                  <ClipboardList className="h-4 w-4" />
                  Form Builder
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={saving || publishing}
                className="gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
              {!form.published && (
                <Button
                  onClick={handlePublish}
                  disabled={saving || publishing}
                  className="gap-2 bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white shadow-[0_2px_12px_rgba(255,122,0,0.3)]"
                >
                  {publishing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Publish
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Status Message ───────────────────── */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm backdrop-blur-xl",
              message.type === "success"
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            )}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
            )}
            {message.text}
          </motion.div>
        )}

        {/* ── Basic Info ──────────────────────── */}
        <motion.div variants={item}>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-orange-400" />
                Basic Information
              </CardTitle>
              <CardDescription>Core event details and metadata.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">
                  Title <span className="text-red-400">*</span>
                </label>
                <Input
                  placeholder="e.g. Summer Championship 2026"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Slug</label>
                <Input
                  placeholder="auto-generated-from-title"
                  value={form.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                />
                <p className="text-xs text-zinc-500">
                  URL-friendly identifier. Auto-generated from title if left empty.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Category</label>
                  <Select
                    value={form.category}
                    onChange={(e) => updateField("category", e.target.value as EventCategory)}
                  >
                    {Object.entries(EVENT_CATEGORY_MAP).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Status</label>
                  <Select
                    value={form.status}
                    onChange={(e) => updateField("status", e.target.value as EventStatus)}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Description</label>
                <textarea
                  placeholder="Describe the event in detail..."
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={6}
                  className="flex w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-zinc-600 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:border-orange-500/30 focus-visible:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40 resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Media ───────────────────────────── */}
        <motion.div variants={item}>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Image className="h-5 w-5 text-orange-400" />
                Media
              </CardTitle>
              <CardDescription>Banner and thumbnail images for the event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Banner</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const url = await uploadEventMedia(file, "banners");
                      updateField("banner", url);
                    } catch {
                      setMessage({ type: "error", text: "Banner upload failed." });
                      setTimeout(() => setMessage(null), 3000);
                    }
                  }}
                />
                <p className="text-xs text-zinc-500">
                  Wide image used as the event header. Recommended: 1200x400px.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Thumbnail</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const url = await uploadEventMedia(file, "thumbnails");
                      updateField("thumbnail", url);
                    } catch {
                      setMessage({ type: "error", text: "Thumbnail upload failed." });
                      setTimeout(() => setMessage(null), 3000);
                    }
                  }}
                />
                <p className="text-xs text-zinc-500">
                  Square image used in event cards. Recommended: 400x400px.
                </p>
              </div>
              {(form.banner || form.thumbnail) && (
                <div className="flex gap-4">
                  {form.banner && (
                    <div className="flex-1 space-y-1">
                      <p className="text-xs text-zinc-500">Banner Preview</p>
                      <div className="relative aspect-[3/1] overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
                        <img
                          src={form.banner}
                          alt="Banner preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {form.thumbnail && (
                    <div className="w-28 space-y-1">
                      <p className="text-xs text-zinc-500">Thumb Preview</p>
                      <div className="relative aspect-square overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
                        <img
                          src={form.thumbnail}
                          alt="Thumbnail preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Schedule & Location ─────────────── */}
        <motion.div variants={item}>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-orange-400" />
                Schedule & Location
              </CardTitle>
              <CardDescription>When and where the event takes place.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Start Date</label>
                  <Input
                    type="datetime-local"
                    value={form.start_date}
                    onChange={(e) => updateField("start_date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">End Date</label>
                  <Input
                    type="datetime-local"
                    value={form.end_date}
                    onChange={(e) => updateField("end_date", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                  <Input
                    placeholder="e.g. Online, Arena Hall, etc."
                    value={form.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Max Participants</label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                  <Input
                    type="number"
                    min={0}
                    placeholder="0 for unlimited"
                    value={form.max_participants || ""}
                    onChange={(e) => updateField("max_participants", parseInt(e.target.value) || 0)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Registration ────────────────────── */}
        <motion.div variants={item}>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Tag className="h-5 w-5 text-orange-400" />
                Registration
              </CardTitle>
              <CardDescription>Control how participants can register.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Registration Status</label>
                <Select
                  value={form.registration_status}
                  onChange={(e) =>
                    updateField("registration_status", e.target.value as RegistrationStatus)
                  }
                >
                  {REGISTRATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Prediction Match Selection (only for prediction category) ── */}
        {form.category === "prediction" && (
          <motion.div variants={item}>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-orange-400" />
                  Select Matches
                </CardTitle>
                <CardDescription>Choose which tournament matches are available for prediction.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingMatches ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-zinc-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading matches...
                  </div>
                ) : allMatches.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-4">No matches found in the database. Generate a schedule first.</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-zinc-500">
                        {selectedMatchIds.length} of {allMatches.length} matches selected
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          if (selectedMatchIds.length === allMatches.length) {
                            setSelectedMatchIds([]);
                          } else {
                            setSelectedMatchIds(allMatches.map((m) => m.id));
                          }
                        }}
                      >
                        {selectedMatchIds.length === allMatches.length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {allMatches.map((match) => (
                        <label
                          key={match.id}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all",
                            selectedMatchIds.includes(match.id)
                              ? "border-orange-500/40 bg-orange-500/10"
                              : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selectedMatchIds.includes(match.id)}
                            onChange={() => {
                              setSelectedMatchIds((prev) =>
                                prev.includes(match.id)
                                  ? prev.filter((mid) => mid !== match.id)
                                  : [...prev, match.id]
                              );
                            }}
                            className="rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500/40"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {match.team_a || "TBA"} vs {match.team_b || "TBA"}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {match.round} {match.match_date ? `· ${new Date(match.match_date).toLocaleDateString()}` : ""}
                            </p>
                          </div>
                          <span className={cn(
                            "text-[10px] font-medium px-2 py-0.5 rounded-full",
                            match.status === "finished" ? "bg-green-500/20 text-green-400" :
                            match.status === "live" ? "bg-red-500/20 text-red-400" :
                            "bg-zinc-500/20 text-zinc-400"
                          )}>
                            {match.status}
                          </span>
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Visibility ──────────────────────── */}
        <motion.div variants={item}>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-orange-400" />
                Visibility
              </CardTitle>
              <CardDescription>Control who can see this event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Published</p>
                    <p className="text-xs text-zinc-500">Make this event visible to everyone.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateField("published", !form.published)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40",
                    form.published ? "bg-orange-500" : "bg-zinc-700"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200",
                      form.published ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Featured</p>
                    <p className="text-xs text-zinc-500">Highlight this event on the homepage.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateField("featured", !form.featured)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40",
                    form.featured ? "bg-orange-500" : "bg-zinc-700"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200",
                      form.featured ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Bottom Actions ───────────────────── */}
        <motion.div variants={item} className="flex items-center justify-end gap-3 pb-8">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saving || publishing}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>
          {!form.published && (
            <Button
              onClick={handlePublish}
              disabled={saving || publishing}
              className="gap-2 bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white shadow-[0_2px_12px_rgba(255,122,0,0.3)]"
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Publish
            </Button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
