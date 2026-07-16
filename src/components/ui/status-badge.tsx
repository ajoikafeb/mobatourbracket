"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatusBadgeProps {
  status: "waiting" | "live" | "finished";
  className?: string;
}

const statusConfig = {
  waiting: {
    label: "Waiting",
    dotClass: "bg-zinc-500",
    containerClass: "border-zinc-500/20 bg-zinc-500/10 text-zinc-400",
  },
  live: {
    label: "Live",
    dotClass: "bg-red-500",
    containerClass: "border-red-500/25 bg-red-500/10 text-red-400",
  },
  finished: {
    label: "Finished",
    dotClass: "bg-green-500",
    containerClass: "border-green-500/25 bg-green-500/10 text-green-400",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium tracking-wide",
        config.containerClass,
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {status === "live" && (
          <motion.span
            className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60"
            animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <span
          className={cn("relative inline-flex h-2 w-2 rounded-full", config.dotClass)}
        />
      </span>
      {config.label}
    </div>
  );
}
