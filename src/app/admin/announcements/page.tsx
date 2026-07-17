"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Plus,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Megaphone,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  ArrowLeft,
  X,
  Save,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  useAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "@/hooks/use-announcements";
import { cn, formatDate } from "@/lib/utils";
import type { Announcement, AnnouncementType } from "@/lib/types";

const TYPE_CONFIG: Record<
  AnnouncementType,
  { label: string; color: string; icon: typeof Info; dot: string }
> = {
  info: {
    label: "Info",
    color: "border-blue-500/25 bg-blue-500/10 text-blue-400",
    icon: Info,
    dot: "bg-blue-500",
  },
  warning: {
    label: "Warning",
    color: "border-amber-500/25 bg-amber-500/10 text-amber-400",
    icon: AlertTriangle,
    dot: "bg-amber-500",
  },
  success: {
    label: "Success",
    color: "border-green-500/25 bg-green-500/10 text-green-400",
    icon: CheckCircle,
    dot: "bg-green-500",
  },
  event: {
    label: "Event",
    color: "border-purple-500/25 bg-purple-500/10 text-purple-400",
    icon: Calendar,
    dot: "bg-purple-500",
  },
  update: {
    label: "Update",
    color: "border-orange-500/25 bg-orange-500/10 text-orange-400",
    icon: Zap,
    dot: "bg-orange-500",
  },
};

const TYPE_OPTIONS: AnnouncementType[] = ["info", "warning", "success", "event", "update"];

type AnnouncementForm = {
  title: string;
  content: string;
  type: AnnouncementType;
  pinned: boolean;
  published: boolean;
  event_id: string;
  expires_at: string;
};

const EMPTY_FORM: AnnouncementForm = {
  title: "",
  content: "",
  type: "info",
  pinned: false,
  published: false,
  event_id: "",
  expires_at: "",
};

function sortAnnouncements(list: Announcement[]): Announcement[] {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
  });
}

function AnnouncementFormPanel({
  form,
  onChange,
  onSubmit,
  onCancel,
  loading,
  isEdit,
}: {
  form: AnnouncementForm;
  onChange: (f: AnnouncementForm) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  isEdit: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="overflow-hidden"
    >
      <Card className="bg-zinc-900/60 border-zinc-800">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              {isEdit ? "Edit Announcement" : "New Announcement"}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onCancel}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-zinc-500 mb-1.5 block">Title</label>
              <Input
                placeholder="Announcement title"
                value={form.title}
                onChange={(e) => onChange({ ...form, title: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-zinc-500 mb-1.5 block">Content</label>
              <textarea
                placeholder="Write your announcement content..."
                value={form.content}
                onChange={(e) => onChange({ ...form, content: e.target.value })}
                rows={3}
                className={cn(
                  "flex w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-600 transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:border-orange-500/30 focus-visible:bg-white/[0.06]",
                  "resize-none"
                )}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Type</label>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map((t) => {
                  const cfg = TYPE_CONFIG[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onChange({ ...form, type: t })}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                        form.type === t
                          ? cfg.color
                          : "border-white/[0.06] bg-white/[0.03] text-zinc-500 hover:border-white/[0.1] hover:text-zinc-300"
                      )}
                    >
                      <cfg.icon className="h-3 w-3" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Expiry Date (optional)</label>
              <Input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => onChange({ ...form, expires_at: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-zinc-500 mb-1.5 block">Event Link ID (optional)</label>
              <Input
                placeholder="UUID of linked event"
                value={form.event_id}
                onChange={(e) => onChange({ ...form, event_id: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => onChange({ ...form, pinned: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-orange-500"
              />
              <span className="text-xs text-zinc-400">Pinned</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => onChange({ ...form, published: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-orange-500"
              />
              <span className="text-xs text-zinc-400">Published</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onSubmit}
              disabled={loading || !form.title.trim() || !form.content.trim()}
              className="gap-2 bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white"
            >
              {loading ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {isEdit ? "Save Changes" : "Create"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AnnouncementCard({
  announcement,
  editingId,
  onStartEdit,
  onCancelEdit,
  onUpdate,
  onTogglePin,
  onTogglePublish,
  onDelete,
  loading,
}: {
  announcement: Announcement;
  editingId: string | null;
  onStartEdit: (a: Announcement) => void;
  onCancelEdit: () => void;
  onUpdate: (id: string, form: AnnouncementForm) => void;
  onTogglePin: (a: Announcement) => void;
  onTogglePublish: (a: Announcement) => void;
  onDelete: (a: Announcement) => void;
  loading: boolean;
}) {
  const [editForm, setEditForm] = useState<AnnouncementForm>({
    title: announcement.title,
    content: announcement.content,
    type: announcement.type,
    pinned: announcement.pinned,
    published: announcement.published,
    event_id: announcement.event_id || "",
    expires_at: announcement.expires_at
      ? new Date(announcement.expires_at).toISOString().slice(0, 16)
      : "",
  });

  const isEditing = editingId === announcement.id;
  const cfg = TYPE_CONFIG[announcement.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      {isEditing ? (
        <AnnouncementFormPanel
          form={editForm}
          onChange={setEditForm}
          onSubmit={() => onUpdate(announcement.id, editForm)}
          onCancel={onCancelEdit}
          loading={loading}
          isEdit
        />
      ) : (
        <Card
          className={cn(
            "group bg-zinc-900/50 border-zinc-800 transition-all duration-300 overflow-hidden",
            announcement.pinned &&
              "border-orange-500/20 bg-orange-500/[0.03]"
          )}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {announcement.pinned && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-0.5 text-[11px] font-medium text-orange-400">
                      <Pin className="h-3 w-3" />
                      Pinned
                    </span>
                  )}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                      cfg.color
                    )}
                  >
                    <cfg.icon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                  {!announcement.published && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400">
                      <EyeOff className="h-3 w-3" />
                      Draft
                    </span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-white truncate">
                  {announcement.title}
                </h3>

                <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2">
                  {announcement.content}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-zinc-400">
                  {announcement.published && announcement.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                      {formatDate(announcement.published_at)}
                    </span>
                  )}
                  {announcement.expires_at && (
                    <span className="flex items-center gap-1 text-zinc-500">
                      Expires {formatDate(announcement.expires_at)}
                    </span>
                  )}
                  {announcement.event_id && (
                    <Link
                      href={`/admin/events/${announcement.event_id}`}
                      className="flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Linked Event
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onStartEdit(announcement)}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    announcement.pinned && "border-orange-500/30 text-orange-400"
                  )}
                  onClick={() => onTogglePin(announcement)}
                  disabled={loading}
                >
                  {announcement.pinned ? (
                    <PinOff className="h-3.5 w-3.5" />
                  ) : (
                    <Pin className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onTogglePublish(announcement)}
                  disabled={loading}
                >
                  {announcement.published ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onDelete(announcement)}
                  disabled={loading}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

function DeleteConfirmDialog({
  announcement,
  onConfirm,
  onCancel,
  loading,
}: {
  announcement: Announcement | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  if (!announcement) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
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
            <h3 className="text-lg font-semibold text-white">Delete Announcement</h3>
            <p className="text-sm text-zinc-400 mt-0.5">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-zinc-300 mb-2">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-white">{announcement.title}</span>?
        </p>
        <p className="text-xs text-zinc-500 mb-6">
          This announcement will be permanently removed from the system.
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AnnouncementSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="flex flex-col gap-1.5">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="h-8 w-8 rounded-xl" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminAnnouncementsPage() {
  const { announcements, loading, refetch } = useAnnouncements(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<AnnouncementForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const sorted = useMemo(() => sortAnnouncements(announcements), [announcements]);

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  }

  async function handleCreate() {
    if (!createForm.title.trim() || !createForm.content.trim()) return;
    setCreating(true);
    try {
      await createAnnouncement({
        title: createForm.title.trim(),
        content: createForm.content.trim(),
        type: createForm.type,
        pinned: createForm.pinned,
        published: createForm.published,
        event_id: createForm.event_id.trim() || null,
        published_at: new Date().toISOString(),
        expires_at: createForm.expires_at
          ? new Date(createForm.expires_at).toISOString()
          : null,
      });
      setCreateForm(EMPTY_FORM);
      setShowCreate(false);
      refetch();
      showFeedback("success", "Announcement created successfully");
    } catch {
      showFeedback("error", "Failed to create announcement");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(id: string, form: AnnouncementForm) {
    if (!form.title.trim() || !form.content.trim()) return;
    setEditing(true);
    try {
      await updateAnnouncement(id, {
        title: form.title.trim(),
        content: form.content.trim(),
        type: form.type,
        pinned: form.pinned,
        published: form.published,
        event_id: form.event_id.trim() || null,
        expires_at: form.expires_at
          ? new Date(form.expires_at).toISOString()
          : null,
      });
      setEditingId(null);
      refetch();
      showFeedback("success", "Announcement updated");
    } catch {
      showFeedback("error", "Failed to update announcement");
    } finally {
      setEditing(false);
    }
  }

  async function handleTogglePin(a: Announcement) {
    try {
      await updateAnnouncement(a.id, { pinned: !a.pinned });
      refetch();
    } catch {
      showFeedback("error", "Failed to update pin status");
    }
  }

  async function handleTogglePublish(a: Announcement) {
    try {
      await updateAnnouncement(a.id, {
        published: !a.published,
        published_at: !a.published ? new Date().toISOString() : a.published_at,
      });
      refetch();
      showFeedback(
        "success",
        !a.published ? "Announcement published" : "Announcement unpublished"
      );
    } catch {
      showFeedback("error", "Failed to update publish status");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAnnouncement(deleteTarget.id);
      setDeleteTarget(null);
      refetch();
      showFeedback("success", "Announcement deleted");
    } catch {
      showFeedback("error", "Failed to delete announcement");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#09090B] p-6 space-y-6">
      {/* ── Feedback Toast ─────────────────────────── */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-6 left-1/2 z-50"
          >
            <div
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-xl shadow-lg",
                feedback.type === "success"
                  ? "border-green-500/25 bg-green-500/10 text-green-400"
                  : "border-red-500/25 bg-red-500/10 text-red-400"
              )}
            >
              {feedback.type === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              {feedback.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1 text-sm text-zinc-500 hover:text-orange-400 transition-colors mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Announcements</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage announcements — create, pin, and publish updates for your community.
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="gap-2 bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white shadow-[0_2px_12px_rgba(255,122,0,0.3)]"
        >
          <Plus className="h-4 w-4" />
          Create Announcement
        </Button>
      </motion.div>

      {/* ── Create Form ────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <AnnouncementFormPanel
            form={createForm}
            onChange={setCreateForm}
            onSubmit={handleCreate}
            onCancel={() => {
              setShowCreate(false);
              setCreateForm(EMPTY_FORM);
            }}
            loading={creating}
            isEdit={false}
          />
        )}
      </AnimatePresence>

      {/* ── Results Count ──────────────────────────── */}
      {!loading && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-zinc-500"
        >
          {sorted.length} announcement{sorted.length !== 1 ? "s" : ""}
          {sorted.filter((a) => a.pinned).length > 0 &&
            ` · ${sorted.filter((a) => a.pinned).length} pinned`}
        </motion.p>
      )}

      {/* ── Announcements List ─────────────────────── */}
      {loading ? (
        <AnnouncementSkeleton />
      ) : sorted.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sorted.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                editingId={editingId}
                onStartEdit={(a) => {
                  setEditingId(a.id);
                  setShowCreate(false);
                }}
                onCancelEdit={() => setEditingId(null)}
                onUpdate={handleUpdate}
                onTogglePin={handleTogglePin}
                onTogglePublish={handleTogglePublish}
                onDelete={setDeleteTarget}
                loading={editing || deleting}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          description="Create your first announcement to keep your community informed."
          action={
            <Button
              onClick={() => setShowCreate(true)}
              className="gap-2 bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white"
            >
              <Plus className="h-4 w-4" />
              Create Announcement
            </Button>
          }
        />
      )}

      {/* ── Delete Confirmation Dialog ─────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmDialog
            announcement={deleteTarget}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
