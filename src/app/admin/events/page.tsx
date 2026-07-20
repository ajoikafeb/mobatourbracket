"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Plus,
  Search,
  Calendar,
  Users,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Edit,
  Filter,
  AlertTriangle,
  CalendarRange,
  Hash,
  ArrowLeft,
  ClipboardList,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useEvents, deleteEvent, duplicateEvent } from "@/hooks/use-events";
import { useEventCategories } from "@/hooks/use-events";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { Event, EventStatus, EventCategory } from "@/lib/types";
import { EVENT_STATUS_MAP, EVENT_CATEGORY_MAP } from "@/lib/types";

const STATUS_OPTIONS: { value: "" | EventStatus; label: string }[] = [
  { value: "", label: "All Statuses" },
  ...Object.entries(EVENT_STATUS_MAP).map(([key, val]) => ({
    value: key as EventStatus,
    label: val.label,
  })),
];

function EventCard({
  event,
  onDelete,
  onDuplicate,
  onTogglePublish,
  isDeleting,
  isDuplicating,
}: {
  event: Event;
  onDelete: (e: Event) => void;
  onDuplicate: (e: Event) => void;
  onTogglePublish: (e: Event) => void;
  isDeleting: boolean;
  isDuplicating: boolean;
}) {
  const statusConfig = EVENT_STATUS_MAP[event.status];
  const categoryLabel = EVENT_CATEGORY_MAP[event.category] || event.category;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all duration-300 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
                    statusConfig.color
                  )}
                >
                  {statusConfig.label}
                </div>
                <span className="inline-flex items-center rounded-full border border-white/[0.06] bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
                  {categoryLabel}
                </span>
                {!event.published && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400">
                    <EyeOff className="h-3 w-3" />
                    Hidden
                  </span>
                )}
              </div>

              <Link href={`/admin/events/${event.id}`}>
                <h3 className="text-base font-semibold text-white truncate hover:text-orange-400 transition-colors">
                  {event.title}
                </h3>
              </Link>

              <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2">{event.description}</p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                  {event.start_date ? formatDate(event.start_date) : "No date"}
                  {event.end_date && <> — {formatDate(event.end_date)}</>}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-zinc-500" />
                  {event.current_participants}
                  {event.max_participants > 0 && <>/{event.max_participants}</>}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <Link href={`/admin/events/${event.id}`}>
                <Button variant="outline" size="icon" className="h-8 w-8" title="Edit Event">
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link href={`/admin/events/${event.id}/form`}>
                <Button variant="outline" size="icon" className="h-8 w-8" title="Form Builder">
                  <ClipboardList className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onDuplicate(event)}
                disabled={isDuplicating}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onTogglePublish(event)}
              >
                {event.published ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={() => onDelete(event)}
                disabled={isDeleting}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DeleteConfirmDialog({
  event,
  onConfirm,
  onCancel,
  loading,
}: {
  event: Event | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  if (!event) return null;
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
            <h3 className="text-lg font-semibold text-white">Delete Event</h3>
            <p className="text-sm text-zinc-400 mt-0.5">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-zinc-300 mb-2">
          Are you sure you want to delete <span className="font-semibold text-white">{event.title}</span>?
        </p>
        <p className="text-xs text-zinc-500 mb-6">
          All registrations and associated data will be permanently removed.
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
            Delete Event
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EventSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
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

export default function AdminEventsPage() {
  const { events, loading, refetch } = useEvents(false);
  const { categories } = useEventCategories();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | EventStatus>("");
  const [categoryFilter, setCategoryFilter] = useState<"" | EventCategory>("");
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = events;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.slug.toLowerCase().includes(q)
      );
    }
    if (statusFilter) result = result.filter((e) => e.status === statusFilter);
    if (categoryFilter) result = result.filter((e) => e.category === categoryFilter);
    return result;
  }, [events, search, statusFilter, categoryFilter]);

  async function handleDelete(event: Event) {
    setDeleting(true);
    try {
      await deleteEvent(event.id);
      setDeleteTarget(null);
      refetch();
    } catch {
      // error handled silently — could show a toast
    } finally {
      setDeleting(false);
    }
  }

  async function handleDuplicate(event: Event) {
    setDuplicatingId(event.id);
    try {
      await duplicateEvent(event.id);
      refetch();
    } catch {
      // error handled silently
    } finally {
      setDuplicatingId(null);
    }
  }

  async function handleTogglePublish(event: Event) {
    const { updateEvent } = await import("@/hooks/use-events");
    try {
      await updateEvent(event.id, { published: !event.published });
      refetch();
    } catch {
      // error handled silently
    }
  }

  return (
    <div className="min-h-screen bg-[#09090B] space-y-6">
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
          <h1 className="text-3xl font-bold text-white">Events</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage all events — create, publish, and organize your tournaments and activities.
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button className="gap-2 bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white shadow-[0_2px_12px_rgba(255,122,0,0.3)]">
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </Link>
      </motion.div>

      {/* ── Filters ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
          <Input
            placeholder="Search events by title, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative w-full sm:w-44">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "" | EventStatus)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="relative w-full sm:w-44">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as "" | EventCategory)}
          >
            <option value="">All Categories</option>
            {Object.entries(EVENT_CATEGORY_MAP).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </motion.div>

      {/* ── Results Count ──────────────────────────── */}
      {!loading && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-zinc-500"
        >
          {filtered.length} event{filtered.length !== 1 ? "s" : ""}
          {(statusFilter || categoryFilter || search) && " found"}
        </motion.p>
      )}

      {/* ── Events List ────────────────────────────── */}
      {loading ? (
        <EventSkeleton />
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onDelete={setDeleteTarget}
                onDuplicate={handleDuplicate}
                onTogglePublish={handleTogglePublish}
                isDeleting={deleting && deleteTarget?.id === event.id}
                isDuplicating={duplicatingId === event.id}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <EmptyState
          icon={CalendarRange}
          title="No events found"
          description={
            search || statusFilter || categoryFilter
              ? "Try adjusting your filters or search query."
              : "Get started by creating your first event."
          }
          action={
            !search && !statusFilter && !categoryFilter ? (
              <Link href="/admin/events/new">
                <Button className="gap-2 bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white">
                  <Plus className="h-4 w-4" />
                  Create Event
                </Button>
              </Link>
            ) : undefined
          }
        />
      )}

      {/* ── Delete Confirmation Dialog ─────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmDialog
            event={deleteTarget}
            onConfirm={() => handleDelete(deleteTarget)}
            onCancel={() => setDeleteTarget(null)}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
