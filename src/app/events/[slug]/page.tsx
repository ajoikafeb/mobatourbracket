"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import {
  MapPin,
  Calendar,
  Users,
  ArrowLeft,
  Tag,
  Clock,
  ExternalLink,
  Target,
  Trophy,
} from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvent } from "@/hooks/use-events";
import {
  EVENT_STATUS_MAP,
  EVENT_CATEGORY_MAP,
} from "@/lib/types";
import { cn, formatDate, formatTime } from "@/lib/utils";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(params);
  const { event, loading } = useEvent(slug);

  return (
    <div className="min-h-screen bg-[#09090B]">
      <AnimatedBackground />
      <Navbar />

      <main className="relative z-10">
        <PageWrapper>
          {loading ? (
            <EventDetailSkeleton />
          ) : !event ? (
            <NotFoundState />
          ) : (
            <EventContent event={event} />
          )}
        </PageWrapper>
      </main>

      <Footer />
    </div>
  );
}

function EventDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <Skeleton className="h-6 w-32 mb-8" />
      <Skeleton className="h-80 w-full rounded-[20px] mb-8" />
      <Skeleton className="h-10 w-3/4 mb-4" />
      <Skeleton className="h-6 w-1/3 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-24 rounded-[20px]" />
        <Skeleton className="h-24 rounded-[20px]" />
        <Skeleton className="h-24 rounded-[20px]" />
      </div>
      <Skeleton className="h-40 w-full rounded-[20px] mt-8" />
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-32 text-center">
      <motion.div
        variants={fadeUp}
        custom={0}
        initial="hidden"
        animate="visible"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
          <Calendar className="h-10 w-10 text-zinc-600" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Event Not Found</h1>
        <p className="text-zinc-500 mb-8 max-w-md mx-auto">
          The event you&apos;re looking for doesn&apos;t exist or may have been removed.
        </p>
        <Link href="/events">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}

function EventContent({ event }: { event: NonNullable<ReturnType<typeof useEvent>["event"]> }) {
  const statusConfig = EVENT_STATUS_MAP[event.status];
  const categoryLabel = EVENT_CATEGORY_MAP[event.category];
  const canRegister =
    event.registration_status === "open" &&
    event.status !== "draft" &&
    event.status !== "cancelled" &&
    event.status !== "completed";
  const isFull =
    event.max_participants > 0 &&
    event.current_participants >= event.max_participants;
  const spotsLeft = event.max_participants > 0
    ? event.max_participants - event.current_participants
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Back link */}
      <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-orange-400 transition-colors duration-200 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          All Events
        </Link>
      </motion.div>

      {/* Hero Banner */}
      <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible">
        <div className="relative overflow-hidden rounded-[20px] border border-white/[0.06] bg-white/[0.035] aspect-[21/9] mb-8">
          {event.banner ? (
            <Image
              src={event.banner}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-[#09090B] to-[#09090B]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/40 to-transparent" />

          {/* Floating badges on banner */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                  statusConfig.color
                )}
              >
                {statusConfig.label}
              </span>
              {event.category && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400">
                  <Tag className="h-3 w-3" />
                  {categoryLabel}
                </span>
              )}
              {event.featured && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
                  Featured
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Event Info */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          variants={fadeUp}
          custom={2}
          className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4"
        >
          {event.title}
        </motion.h1>

        {/* Meta row */}
        <motion.div
          variants={fadeUp}
          custom={3}
          className="flex flex-wrap items-center gap-4 text-sm text-zinc-400 mb-8"
        >
          {event.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-orange-400/70" />
              {event.location}
            </span>
          )}
          {event.start_date && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-orange-400/70" />
              {formatDate(event.start_date)}
              {event.start_date && (
                <> at {formatTime(event.start_date)}</>
              )}
              {event.end_date && (
                <> — {formatDate(event.end_date)} at {formatTime(event.end_date)}</>
              )}
            </span>
          )}
        </motion.div>

        {/* Stats cards */}
        <motion.div
          variants={fadeUp}
          custom={4}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <Card className="p-5 bg-white/[0.03] border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">
                  {event.current_participants}
                  {event.max_participants > 0 && (
                    <span className="text-sm font-normal text-zinc-500">
                      {" "}/ {event.max_participants}
                    </span>
                  )}
                </p>
                <p className="text-xs text-zinc-500">Participants</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white/[0.03] border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/20">
                <Calendar className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {event.start_date ? formatDate(event.start_date) : "TBA"}
                </p>
                <p className="text-xs text-zinc-500">Start Date</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white/[0.03] border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
                <MapPin className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white truncate max-w-[180px]">
                  {event.location || "TBA"}
                </p>
                <p className="text-xs text-zinc-500">Location</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Registration CTA */}
        {canRegister && (
          <motion.div variants={fadeUp} custom={5} className="mb-8">
            <Card className="p-6 border-orange-500/20 bg-orange-500/[0.03]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">
                    Registration {event.registration_status === "open" ? "Open" : "Invite Only"}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {isFull
                      ? "This event is currently full."
                      : spotsLeft !== null
                        ? `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} remaining`
                        : "Spots available"}
                  </p>
                </div>
                <Link href={`/events/${event.slug}/register`}>
                  <Button
                    size="lg"
                    className="gap-2 shrink-0"
                    disabled={isFull}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Register Now
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Prediction CTA */}
        {(
          <motion.div variants={fadeUp} custom={5.5} className="mb-8">
            <Card className="p-6 border-purple-500/20 bg-purple-500/[0.03]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">
                    Make Your Predictions
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Predict match winners and climb the leaderboard
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/events/${event.slug}/predictors`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-yellow-400 hover:bg-yellow-500/10"
                    >
                      <Trophy className="h-3.5 w-3.5" />
                      Predictors
                    </Button>
                  </Link>
                  <Link href={`/events/${event.slug}/predict`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                    >
                      <Target className="h-3.5 w-3.5" />
                      Predict Now
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Description */}
        {event.description && (
          <motion.div variants={fadeUp} custom={6}>
            <Card className="p-6 sm:p-8 bg-white/[0.03] border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white mb-4">About This Event</h2>
              <div
                className="prose prose-invert prose-zinc max-w-none text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
