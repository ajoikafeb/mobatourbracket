"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Event } from "@/lib/types";
import { EVENT_STATUS_MAP, EVENT_CATEGORY_MAP } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

interface EventCardProps {
  event: Event;
  className?: string;
}

export function EventCard({ event, className }: EventCardProps) {
  const statusConfig = EVENT_STATUS_MAP[event.status];
  const categoryLabel = EVENT_CATEGORY_MAP[event.category];
  const spotsLeft =
    event.max_participants > 0
      ? event.max_participants - event.current_participants
      : null;

  return (
    <Link href={`/events/${event.slug}`} className="block group">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Card
          className={cn(
            "relative overflow-hidden bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12] transition-all duration-500 rounded-[20px] h-full",
            className
          )}
        >
          {/* Banner / Thumbnail */}
          <div className="relative aspect-[16/9] overflow-hidden">
            {event.banner || event.thumbnail ? (
              <Image
                src={event.banner || event.thumbnail || ""}
                alt={event.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-[#09090B] to-[#09090B]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/30 to-transparent" />

            {/* Top-right featured badge */}
            {event.featured && (
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/25 bg-yellow-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-400 backdrop-blur-sm">
                  Featured
                </span>
              </div>
            )}

            {/* Bottom badges */}
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium backdrop-blur-sm",
                  statusConfig.color
                )}
              >
                {statusConfig.label}
              </span>
              {categoryLabel && (
                <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-medium text-orange-400 backdrop-blur-sm">
                  <Tag className="h-2.5 w-2.5" />
                  {categoryLabel}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="text-base font-semibold text-white mb-2 line-clamp-2 group-hover:text-orange-400 transition-colors duration-200">
              {event.title}
            </h3>

            <div className="space-y-1.5 mb-4">
              {event.start_date && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>{formatDate(event.start_date)}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Users className="h-3 w-3" />
                <span>
                  {event.current_participants}
                  {event.max_participants > 0 && (
                    <>/{event.max_participants}</>
                  )}
                  {" "}joined
                </span>
              </div>
              {spotsLeft !== null && spotsLeft > 0 && (
                <span className="text-[10px] font-medium text-green-400">
                  {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left
                </span>
              )}
              {spotsLeft !== null && spotsLeft <= 0 && (
                <span className="text-[10px] font-medium text-red-400">
                  Full
                </span>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}
