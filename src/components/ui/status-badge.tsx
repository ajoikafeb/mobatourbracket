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
    dotClass: "bg-zinc-400",
    containerClass:
      "border-zinc-500/30 bg-zinc-500/20 text-zinc-400",
  },
  live: {
    label: "Live",
    dotClass: "bg-red-500",
    containerClass: "border-red-500/30 bg-red-500/20 text-red-400",
  },
  finished: {
    label: "Finished",
    dotClass: "bg-green-500",
    containerClass:
      "border-green-500/30 bg-green-500/20 text-green-400",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        config.containerClass,
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {status === "live" && (
          <motion.span
            className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
            animate={{ scale: [1, 1.8, 1], opacity: [0.75, 0, 0.75] }}
            transition={{ duration: 1.5, repeat: Infinity }}
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
