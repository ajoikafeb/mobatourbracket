"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Trophy, Users, Sparkles } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { TeamDetailCard } from "@/components/shared/team-detail-card";
import { useTeams } from "@/hooks/use-teams";
import { useBracketsWithTeams } from "@/hooks/use-brackets";
import { cn } from "@/lib/utils";
import type { BracketWithTeam } from "@/lib/types";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const ROUND_CONFIG: Record<string, { label: string; flex: number }> = {
  "Round of 16": { label: "R16", flex: 1 },
  "Quarter Final": { label: "QF", flex: 1.15 },
  "Semi Final": { label: "SF", flex: 1.3 },
  "Grand Final": { label: "GF", flex: 1.5 },
  Champion: { label: "Winner", flex: 1.8 },
};

function TeamCard({
  bracket,
  onHover,
  onClick,
  isHovered,
  isSelected,
  isMobile,
}: {
  bracket: BracketWithTeam;
  onHover: (bracket: BracketWithTeam | null) => void;
  onClick: (bracket: BracketWithTeam, el: HTMLDivElement) => void;
  isHovered: boolean;
  isSelected: boolean;
  isMobile: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const team = bracket.team;
  const isChampion = bracket.round === "Champion";
  const isEmpty = !bracket.team_name;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onMouseEnter={() => !isMobile && onHover(bracket)}
      onMouseLeave={() => !isMobile && onHover(null)}
      onClick={() => {
        if (isEmpty) return;
        if (isMobile) {
          onClick(bracket, cardRef.current!);
        } else if (isSelected) {
          onHover(null);
        } else {
          onClick(bracket, cardRef.current!);
        }
      }}
      className={cn("relative", isEmpty ? "" : "cursor-pointer")}
    >
      <motion.div
        whileHover={isEmpty ? {} : { scale: 1.04, y: -2 }}
        whileTap={isEmpty ? {} : { scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "relative rounded-[16px] border px-4 py-3 transition-all duration-300",
          "bg-white/[0.04] backdrop-blur-sm",

          isEmpty && "opacity-30 border-white/[0.04]",

          !isEmpty && !bracket.is_winner && !bracket.is_current && !isChampion &&
            "border-white/[0.08] hover:border-orange-500/25 hover:shadow-lg hover:shadow-orange-500/5",

          bracket.is_current &&
            "border-orange-500/40 shadow-lg shadow-orange-500/10",

          bracket.is_winner && !isChampion &&
            "border-orange-500/30 shadow-lg shadow-orange-500/15",

          isChampion &&
            bracket.is_winner &&
            "border-amber-400/40 shadow-xl shadow-amber-500/20",

          isChampion &&
            !bracket.is_winner &&
            "border-white/[0.08]",

          (isHovered || isSelected) &&
            !isEmpty &&
            "border-orange-500/40 shadow-xl shadow-orange-500/15 bg-orange-500/[0.06]"
        )}
      >
        {isChampion && bracket.is_winner && (
          <motion.div
            className="absolute inset-0 rounded-[16px] bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 pointer-events-none"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {bracket.is_current && !isEmpty && (
          <motion.div
            className="absolute inset-0 rounded-[16px] border-2 border-orange-500/30 pointer-events-none"
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.01, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <div className="relative flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden transition-all duration-300",
                bracket.is_winner && !isChampion
                  ? "bg-orange-500/20 border border-orange-500/20"
                  : isChampion && bracket.is_winner
                  ? "bg-gradient-to-br from-amber-500/30 to-orange-500/20 border border-amber-400/30"
                  : "bg-white/5 border border-white/[0.06]"
              )}
            >
              {team?.logo ? (
                <img
                  src={team.logo}
                  alt={team.team_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className={cn(
                    "text-xs font-bold",
                    bracket.is_winner ? "text-orange-400" : "text-zinc-500"
                  )}
                >
                  {getInitials(bracket.team_name || "TBD")}
                </span>
              )}
            </div>

            {bracket.is_winner && (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                className={cn(
                  "absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full",
                  isChampion
                    ? "bg-gradient-to-br from-amber-400 to-orange-500"
                    : "bg-orange-500"
                )}
              >
                <Trophy className="h-2.5 w-2.5 text-white" />
              </motion.div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm font-semibold truncate transition-colors duration-200",
                isEmpty
                  ? "text-zinc-600"
                  : bracket.is_winner
                  ? isChampion
                    ? "bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent"
                    : "text-orange-400"
                  : isHovered || isSelected
                  ? "text-orange-300"
                  : "text-white"
              )}
            >
              {bracket.team_name || "TBD"}
            </p>
            {bracket.team_seed > 0 && !isEmpty && (
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Seed #{bracket.team_seed}
              </p>
            )}
          </div>

          {!isEmpty && (
            <motion.div
              animate={{
                opacity: isHovered || isSelected ? 1 : 0.3,
                x: isHovered || isSelected ? 0 : 5,
              }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0"
            >
              <Users className="h-3.5 w-3.5 text-zinc-500" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {isChampion && bracket.is_winner && (
        <motion.div
          className="absolute -inset-1 rounded-[20px] bg-gradient-to-r from-amber-500/10 via-orange-500/15 to-amber-500/10 blur-xl pointer-events-none -z-10"
          animate={{
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}

function BracketRound({
  roundName,
  teams,
  delay,
  onTeamHover,
  onTeamClick,
  hoveredId,
  selectedId,
  isMobile,
}: {
  roundName: string;
  teams: BracketWithTeam[];
  delay: number;
  onTeamHover: (bracket: BracketWithTeam | null) => void;
  onTeamClick: (bracket: BracketWithTeam, el: HTMLDivElement) => void;
  hoveredId: string | null;
  selectedId: string | null;
  isMobile: boolean;
}) {
  const config = ROUND_CONFIG[roundName] || { label: roundName, flex: 1 };
  const isChampion = roundName === "Champion";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col gap-4"
      style={{ flex: config.flex }}
    >
      <div className="text-center mb-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider",
            isChampion ? "text-orange-400" : "text-zinc-500"
          )}
        >
          {isChampion && <Sparkles className="h-3 w-3" />}
          {config.label}
        </span>
      </div>
      <div
        className={cn(
          "flex flex-col justify-around h-full",
          isChampion ? "gap-6" : "gap-4"
        )}
      >
        {teams.map((bracket) => (
          <TeamCard
            key={bracket.id}
            bracket={bracket}
            onHover={onTeamHover}
            onClick={onTeamClick}
            isHovered={hoveredId === bracket.id}
            isSelected={selectedId === bracket.id}
            isMobile={isMobile}
          />
        ))}
        {teams.length === 0 && (
          <div className="h-12 rounded-[16px] border border-dashed border-white/5 flex items-center justify-center">
            <span className="text-xs text-zinc-600">Empty</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function BracketPage() {
  const { teams } = useTeams();
  const { brackets, loading } = useBracketsWithTeams(teams);

  const [hoveredBracket, setHoveredBracket] = useState<BracketWithTeam | null>(null);
  const [selectedBracket, setSelectedBracket] = useState<BracketWithTeam | null>(null);
  const [detailAnchor, setDetailAnchor] = useState<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function checkSize() {
      setIsMobile(window.innerWidth < 768);
    }
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const handleHover = useCallback((bracket: BracketWithTeam | null) => {
    setHoveredBracket(bracket);
    if (bracket) {
      setSelectedBracket(bracket);
    }
  }, []);

  const handleClick = useCallback(
    (bracket: BracketWithTeam, el: HTMLDivElement) => {
      if (isMobile) {
        setSelectedBracket(bracket);
      } else {
        if (selectedBracket?.id === bracket.id) {
          setSelectedBracket(null);
          setDetailAnchor(null);
        } else {
          setSelectedBracket(bracket);
          setDetailAnchor(el);
        }
      }
    },
    [isMobile, selectedBracket]
  );

  const handleClose = useCallback(() => {
    setSelectedBracket(null);
    setHoveredBracket(null);
    setDetailAnchor(null);
  }, []);

  const rounds = [
    "Round of 16",
    "Quarter Final",
    "Semi Final",
    "Grand Final",
    "Champion",
  ];
  const groupedRounds = rounds.map((round) => ({
    name: round,
    teams: brackets
      .filter((b) => b.round === round)
      .sort((a, b) => a.position - b.position),
  }));

  const activeBracket =
    (hoveredBracket || selectedBracket) &&
    (hoveredBracket || selectedBracket)!.team_name
      ? hoveredBracket || selectedBracket
      : null;

  return (
    <div className="min-h-screen bg-[#09090B]">
      <AnimatedBackground />
      <Navbar />

      <main className="relative z-10">
        <PageWrapper>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/20">
                <Swords className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Tournament Bracket
                </h1>
                <p className="text-sm text-zinc-400">
                  Single Elimination — {brackets.filter((b) => b.team_name).length} teams
                  <span className="hidden sm:inline"> · Click a team for details</span>
                </p>
              </div>
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : brackets.length === 0 ? (
              <EmptyState
                icon={Swords}
                title="No bracket yet"
                description="The tournament bracket hasn't been created yet. Check back soon!"
              />
            ) : (
              <div className="overflow-x-auto pb-8 -mx-4 px-4">
                <div className="flex gap-5 min-w-[900px]">
                  {groupedRounds.map((round, i) => (
                    <BracketRound
                      key={round.name}
                      roundName={round.name}
                      teams={round.teams}
                      delay={i * 0.1}
                      onTeamHover={handleHover}
                      onTeamClick={handleClick}
                      hoveredId={hoveredBracket?.id || null}
                      selectedId={selectedBracket?.id || null}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </PageWrapper>
      </main>

      <AnimatePresence>
        {activeBracket && activeBracket.team && (
          <TeamDetailCard
            key={activeBracket.id}
            team={activeBracket.team}
            bracket={activeBracket}
            onClose={handleClose}
            anchorRef={{ current: detailAnchor }}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
