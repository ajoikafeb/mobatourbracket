"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Filter, Search } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { EmptyState } from "@/components/shared/empty-state";
import { EventCard } from "@/components/public/event-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useEvents, useEventCategories } from "@/hooks/use-events";
import { EVENT_CATEGORY_MAP, EVENT_STATUS_MAP } from "@/lib/types";
import type { EventCategory, EventStatus } from "@/lib/types";

const STATUS_OPTIONS: EventStatus[] = [
  "registration_open",
  "registration_closed",
  "upcoming",
  "running",
  "completed",
];

function SkeletonCard() {
  return (
    <div className="rounded-[20px] border border-white/[0.04] bg-white/[0.03] overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-white/[0.04]" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-white/[0.06] rounded-lg w-3/4" />
        <div className="h-3 bg-white/[0.04] rounded-lg w-1/2" />
        <div className="h-3 bg-white/[0.04] rounded-lg w-2/3" />
        <div className="pt-3 mt-3 border-t border-white/[0.06] flex justify-between">
          <div className="h-3 bg-white/[0.04] rounded-lg w-16" />
          <div className="h-3 bg-white/[0.04] rounded-lg w-12" />
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const { events, loading } = useEvents(true);
  const { categories } = useEventCategories();

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = events;
    if (activeCategory !== "all") {
      result = result.filter((e) => e.category === activeCategory);
    }
    if (activeStatus !== "all") {
      result = result.filter((e) => e.status === activeStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [events, activeCategory, activeStatus, search]);

  const categoryTabs = useMemo(() => {
    const cats = categories.length > 0
      ? categories.map((c) => ({ value: c.slug, label: c.name }))
      : Object.entries(EVENT_CATEGORY_MAP).map(([value, label]) => ({ value, label }));
    return [{ value: "all", label: "All" }, ...cats];
  }, [categories]);

  return (
    <div className="min-h-screen bg-[#09090B]">
      <AnimatedBackground />
      <Navbar />

      <main className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15">
                <CalendarDays className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Events
                </h1>
                <p className="text-sm text-zinc-400 mt-0.5">
                  Browse upcoming tournaments, giveaways, and community events
                </p>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 space-y-4"
          >
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="pl-9 h-10"
              />
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-2">
              {categoryTabs.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border",
                    activeCategory === cat.value
                      ? "bg-orange-500/15 text-orange-400 border-orange-500/25"
                      : "bg-white/[0.03] text-zinc-500 border-white/[0.06] hover:text-zinc-300 hover:border-white/[0.1]"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-zinc-600" />
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setActiveStatus("all")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 border",
                    activeStatus === "all"
                      ? "bg-white/[0.08] text-white border-white/[0.12]"
                      : "text-zinc-600 border-transparent hover:text-zinc-400"
                  )}
                >
                  All Status
                </button>
                {STATUS_OPTIONS.map((status) => {
                  const cfg = EVENT_STATUS_MAP[status];
                  return (
                    <button
                      key={status}
                      onClick={() => setActiveStatus(status)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 border",
                        activeStatus === status
                          ? cfg.color
                          : "text-zinc-600 border-transparent hover:text-zinc-400"
                      )}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No events found"
              description={
                search || activeCategory !== "all" || activeStatus !== "all"
                  ? "Try adjusting your filters or search query."
                  : "Events will appear here once they are published."
              }
            />
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((event, idx) => (
                  <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                  >
                    <EventCard event={event} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
