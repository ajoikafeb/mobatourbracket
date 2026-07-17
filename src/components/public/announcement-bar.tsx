"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Info,
  AlertTriangle,
  CheckCircle,
  Megaphone,
  Bell,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Announcement, AnnouncementType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AnnouncementBarProps {
  announcements: Announcement[];
  className?: string;
}

const typeConfig: Record<
  AnnouncementType,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string }
> = {
  info: {
    icon: Info,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  success: {
    icon: CheckCircle,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  event: {
    icon: Megaphone,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  update: {
    icon: Bell,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
};

export function AnnouncementBar({ announcements, className }: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const visible = announcements.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  const pinned = visible.filter((a) => a.pinned);
  const others = visible.filter((a) => !a.pinned);

  function dismiss(id: string) {
    setDismissed((prev) => new Set(prev).add(id));
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className={cn("space-y-2", className)}>
      <AnimatePresence mode="popLayout">
        {pinned.map((a) => (
          <PinnedAnnouncement
            key={a.id}
            announcement={a}
            onDismiss={() => dismiss(a.id)}
          />
        ))}
      </AnimatePresence>

      {others.length > 0 && (
        <div className="space-y-1.5">
          <AnimatePresence mode="popLayout">
            {others.map((a) => (
              <CompactAnnouncement
                key={a.id}
                announcement={a}
                expanded={expanded.has(a.id)}
                onToggle={() => toggleExpand(a.id)}
                onDismiss={() => dismiss(a.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function PinnedAnnouncement({
  announcement,
  onDismiss,
}: {
  announcement: Announcement;
  onDismiss: () => void;
}) {
  const config = typeConfig[announcement.type];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div
        className={cn(
          "relative rounded-2xl border bg-white/[0.035] backdrop-blur-xl p-4 overflow-hidden",
          "border-orange-500/25 shadow-[0_0_20px_rgba(255,122,0,0.04)]"
        )}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-orange-500/[0.04] blur-2xl" />
        </div>

        <div className="relative flex items-start gap-3">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
              config.bg,
              config.border
            )}
          >
            <Icon className={cn("h-4 w-4", config.color)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="text-sm font-semibold text-white truncate">
                {announcement.title}
              </h4>
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-400">
                Pinned
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
              {announcement.content}
            </p>
          </div>

          <button
            onClick={onDismiss}
            className="shrink-0 p-1 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function CompactAnnouncement({
  announcement,
  expanded,
  onToggle,
  onDismiss,
}: {
  announcement: Announcement;
  expanded: boolean;
  onToggle: () => void;
  onDismiss: () => void;
}) {
  const config = typeConfig[announcement.type];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -4, height: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div
        className={cn(
          "rounded-xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-xl overflow-hidden transition-all duration-300",
          expanded && "border-white/[0.1]"
        )}
      >
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
        >
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
              config.bg,
              config.border
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", config.color)} />
          </div>

          <span className="flex-1 text-xs font-medium text-zinc-300 truncate">
            {announcement.title}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="shrink-0 p-1 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-4 pb-3 pt-0 pl-14">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {announcement.content}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
