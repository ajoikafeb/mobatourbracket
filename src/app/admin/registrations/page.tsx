"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Check,
  X,
  Download,
  Users,
  ChevronDown,
  ChevronUp,
  Mail,
  Clock,
  ArrowLeft,
  UserCheck,
  UserX,
  AlertCircle,
  Loader2,
  ClipboardCopy,
  CheckCheck,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAllRegistrations,
  getRegistrationsByEvent,
  bulkUpdateRegistrationStatus,
  exportRegistrationsCSV,
} from "@/services/registration-service";
import { getEvents } from "@/services/event-service";
import type {
  RegistrationResponse,
  Event,
  RegistrationResponseStatus,
} from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const STATUS_OPTIONS: { value: "" | RegistrationResponseStatus; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_CONFIG: Record<
  RegistrationResponseStatus,
  { label: string; color: string; icon: typeof Check }
> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    icon: Check,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: X,
  },
};

function StatsCard({
  label,
  value,
  icon: Icon,
  color,
  delay,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="bg-white/[0.035] border-white/[0.06] rounded-[20px]">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl shrink-0",
                color
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RegistrationCard({
  registration,
  eventName,
  selected,
  onToggle,
  updatingId,
}: {
  registration: RegistrationResponse;
  eventName: string;
  selected: boolean;
  onToggle: () => void;
  updatingId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = STATUS_CONFIG[registration.status];
  const StatusIcon = statusConfig.icon;
  const isUpdating = updatingId === registration.id;
  const dataEntries = Object.entries(registration.data).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          "bg-white/[0.035] border-white/[0.06] rounded-[20px] overflow-hidden transition-all duration-200",
          selected
            ? "border-orange-500/40 bg-orange-500/[0.04]"
            : "hover:border-white/[0.1]"
        )}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Checkbox */}
              <button
                onClick={onToggle}
                className={cn(
                  "mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200",
                  selected
                    ? "border-orange-500 bg-orange-500"
                    : "border-zinc-600 hover:border-zinc-400"
                )}
              >
                {selected && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
                      statusConfig.color
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig.label}
                  </div>
                  <span className="inline-flex items-center rounded-full border border-white/[0.06] bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
                    {eventName}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-white truncate">
                  {registration.respondent_name}
                </h3>

                <div className="flex items-center gap-4 mt-1.5 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-zinc-500" />
                    {registration.respondent_email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-zinc-500" />
                    {formatDate(registration.submitted_at)}
                  </span>
                </div>

                {dataEntries.length > 0 && !expanded && (
                  <p className="text-xs text-zinc-500 mt-2 line-clamp-1">
                    {dataEntries
                      .slice(0, 3)
                      .map(([k, v]) => `${k}: ${String(v)}`)
                      .join(" • ")}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setExpanded(!expanded)}
                title={expanded ? "Collapse" : "Expand"}
              >
                {expanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                    Registration Data
                  </h4>
                  {dataEntries.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {dataEntries.map(([key, value]) => (
                        <div
                          key={key}
                          className="rounded-xl bg-white/[0.03] border border-white/[0.05] px-3.5 py-2.5"
                        >
                          <p className="text-[11px] text-zinc-500 uppercase tracking-wider">
                            {key}
                          </p>
                          <p className="text-sm text-white mt-0.5 break-words">
                            {String(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500">
                      No additional data submitted.
                    </p>
                  )}

                  {registration.notes && (
                    <div className="mt-3 rounded-xl bg-white/[0.03] border border-white/[0.05] px-3.5 py-2.5">
                      <p className="text-[11px] text-zinc-500 uppercase tracking-wider">
                        Notes
                      </p>
                      <p className="text-sm text-zinc-300 mt-0.5">
                        {registration.notes}
                      </p>
                    </div>
                  )}

                  {registration.status !== "pending" && registration.reviewed_at && (
                    <p className="text-[11px] text-zinc-500 mt-3">
                      Reviewed on {formatDate(registration.reviewed_at)}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="bg-white/[0.035] border-white/[0.06] rounded-[20px]">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <Skeleton className="h-5 w-5 rounded-md shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-28 rounded-full" />
                </div>
                <Skeleton className="h-5 w-40" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<RegistrationResponse[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | RegistrationResponseStatus>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const eventMap = useMemo(() => {
    const map = new Map<string, Event>();
    events.forEach((e) => map.set(e.id, e));
    return map;
  }, [events]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [regData, eventData] = await Promise.all([
        getAllRegistrations(),
        getEvents(),
      ]);
      setRegistrations(regData);
      setEvents(eventData);
    } catch {
      setRegistrations([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const total = registrations.length;
    const pending = registrations.filter((r) => r.status === "pending").length;
    const approved = registrations.filter((r) => r.status === "approved").length;
    const rejected = registrations.filter((r) => r.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [registrations]);

  const filtered = useMemo(() => {
    let result = registrations;
    if (eventFilter) {
      result = result.filter((r) => r.event_id === eventFilter);
    }
    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.respondent_name.toLowerCase().includes(q) ||
          r.respondent_email.toLowerCase().includes(q)
      );
    }
    return result;
  }, [registrations, eventFilter, statusFilter, search]);

  const filteredIds = useMemo(() => filtered.map((r) => r.id), [filtered]);
  const selectedFiltered = useMemo(
    () => selectedIds.size > 0 && filteredIds.some((id) => selectedIds.has(id)),
    [selectedIds, filteredIds]
  );
  const allFilteredSelected = useMemo(
    () => filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id)),
    [selectedIds, filteredIds]
  );

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }

  async function handleBulkApprove() {
    const ids = [...selectedIds].filter((id) => {
      const reg = registrations.find((r) => r.id === id);
      return reg?.status === "pending";
    });
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      await bulkUpdateRegistrationStatus(ids, "approved");
      setRegistrations((prev) =>
        prev.map((r) =>
          ids.includes(r.id)
            ? { ...r, status: "approved" as const, reviewed_at: new Date().toISOString() }
            : r
        )
      );
      setSelectedIds(new Set());
    } catch {
      // handled silently
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkReject() {
    const ids = [...selectedIds].filter((id) => {
      const reg = registrations.find((r) => r.id === id);
      return reg?.status === "pending";
    });
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      await bulkUpdateRegistrationStatus(ids, "rejected");
      setRegistrations((prev) =>
        prev.map((r) =>
          ids.includes(r.id)
            ? { ...r, status: "rejected" as const, reviewed_at: new Date().toISOString() }
            : r
        )
      );
      setSelectedIds(new Set());
    } catch {
      // handled silently
    } finally {
      setBulkLoading(false);
    }
  }

  function handleCopyList() {
    const approved = registrations.filter((r) => r.status === "approved");
    const lines = approved.map((r, i) => {
      const vals = Object.values(r.data)
        .filter((v) => v !== null && v !== undefined && v !== "")
        .map((v) => String(v));
      return `${i + 1}. ${vals.join(" - ")}`;
    });
    const text = lines.join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  }

  function handleExport() {
    const csv = exportRegistrationsCSV(filtered, []);
    downloadCSV(`registrations-${Date.now()}.csv`, csv);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2000);
  }

  const selectedCount = selectedIds.size;
  const selectedPendingCount = useMemo(() => {
    return [...selectedIds].filter((id) => {
      const reg = registrations.find((r) => r.id === id);
      return reg?.status === "pending";
    }).length;
  }, [selectedIds, registrations]);

  return (
    <div className="min-h-screen bg-[#09090B] space-y-6">
      {/* Header */}
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
          <h1 className="text-3xl font-bold text-white">Registrations</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Review and manage all event registrations across your platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleCopyList}
            variant="outline"
            className={cn(
              "gap-2 transition-all",
              copySuccess
                ? "border-green-500/30 text-green-400 bg-green-500/10"
                : "border-white/[0.08] text-zinc-300 hover:text-white hover:border-white/[0.15]"
            )}
          >
            {copySuccess ? (
              <CheckCheck className="h-4 w-4" />
            ) : (
              <ClipboardCopy className="h-4 w-4" />
            )}
            {copySuccess ? "Copied!" : "Copy List"}
          </Button>
          <Button
            onClick={handleExport}
            className={cn(
              "gap-2 transition-all",
              exportSuccess
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white shadow-[0_2px_12px_rgba(255,122,0,0.3)]"
            )}
            disabled={filtered.length === 0}
          >
            {exportSuccess ? (
              <Check className="h-4 w-4" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exportSuccess ? "Exported!" : "Export CSV"}
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Registrations"
          value={stats.total}
          icon={Users}
          color="bg-orange-500/10 text-orange-400"
          delay={0}
        />
        <StatsCard
          label="Pending Review"
          value={stats.pending}
          icon={Clock}
          color="bg-yellow-500/10 text-yellow-400"
          delay={0.05}
        />
        <StatsCard
          label="Approved"
          value={stats.approved}
          icon={UserCheck}
          color="bg-green-500/10 text-green-400"
          delay={0.1}
        />
        <StatsCard
          label="Rejected"
          value={stats.rejected}
          icon={UserX}
          color="bg-red-500/10 text-red-400"
          delay={0.15}
        />
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative w-full sm:w-52">
          <Select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
          >
            <option value="">All Events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </Select>
        </div>
        <div className="relative w-full sm:w-44">
          <Select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "" | RegistrationResponseStatus)
            }
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </motion.div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between gap-4 rounded-xl border border-orange-500/20 bg-orange-500/[0.06] px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-orange-300 font-medium">
                  {selectedCount} selected
                </span>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs text-zinc-400 hover:text-white transition-colors underline underline-offset-2"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center gap-2">
                {selectedPendingCount > 0 && (
                  <>
                    <Button
                      onClick={handleBulkApprove}
                      disabled={bulkLoading}
                      size="sm"
                      className="gap-1.5 bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25 hover:border-green-500/40"
                    >
                      {bulkLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Approve ({selectedPendingCount})
                    </Button>
                    <Button
                      onClick={handleBulkReject}
                      disabled={bulkLoading}
                      size="sm"
                      className="gap-1.5 bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 hover:border-red-500/40"
                    >
                      {bulkLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      Reject ({selectedPendingCount})
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count + Select All */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between"
        >
          <p className="text-xs text-zinc-500">
            {filtered.length} registration{filtered.length !== 1 ? "s" : ""}
            {(eventFilter || statusFilter || search) && " found"}
          </p>
          {filtered.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs text-zinc-500 hover:text-orange-400 transition-colors"
            >
              <span
                className={cn(
                  "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                  allFilteredSelected
                    ? "border-orange-500 bg-orange-500"
                    : "border-zinc-600"
                )}
              >
                {allFilteredSelected && (
                  <Check className="h-2.5 w-2.5 text-white" />
                )}
              </span>
              {allFilteredSelected ? "Deselect all" : "Select all"}
            </button>
          )}
        </motion.div>
      )}

      {/* Registration list */}
      {loading ? (
        <LoadingSkeleton />
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((reg) => (
              <RegistrationCard
                key={reg.id}
                registration={reg}
                eventName={eventMap.get(reg.event_id)?.title ?? "Unknown Event"}
                selected={selectedIds.has(reg.id)}
                onToggle={() => toggleSelect(reg.id)}
                updatingId={updatingId}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06] mb-4">
            <AlertCircle className="h-8 w-8 text-zinc-500" />
          </div>
          <h3 className="text-lg font-semibold text-white">No registrations found</h3>
          <p className="text-sm text-zinc-400 mt-1 text-center max-w-md">
            {search || eventFilter || statusFilter
              ? "Try adjusting your filters or search query to find what you're looking for."
              : "No registrations have been submitted yet. They will appear here once users start registering."}
          </p>
        </motion.div>
      )}
    </div>
  );
}
