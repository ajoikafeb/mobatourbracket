"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Trophy, X, Star, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useTeams } from "@/hooks/use-teams";
import { useBracketsWithTeams } from "@/hooks/use-brackets";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";
import type { BracketWithTeam, Team } from "@/lib/types";
import { ROUND_ORDER, ROUND_CONFIG } from "@/lib/types";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getTeamPlayers(bracket: BracketWithTeam, playersPerTeam?: number) {
  const team = bracket.team;
  if (!team) return [];
  const allPlayers = [
    { role: "Player 1", name: team.player_1 },
    { role: "Player 2", name: team.player_2 },
    { role: "Player 3", name: team.player_3 },
    { role: "Player 4", name: team.player_4 },
    { role: "Player 5", name: team.player_5 },
    { role: "Player 6", name: (team as Team & { player_6?: string }).player_6 },
    ...(team.substitute ? [{ role: "Substitute", name: team.substitute }] : []),
  ].filter((p) => p.name);
  if (team.captain && team.captain !== team.player_1) {
    allPlayers.unshift({ role: "Captain", name: team.captain });
  }
  if (playersPerTeam) {
    return allPlayers.slice(0, playersPerTeam);
  }
  return allPlayers;
}

function getActiveRounds(brackets: BracketWithTeam[]) {
  const activeRoundNames = new Set(brackets.map((b) => b.round));
  return ROUND_ORDER.filter((name) => activeRoundNames.has(name));
}

function TeamCard({
  bracket,
  onHover,
  onClick,
  isHovered,
  isSelected,
}: {
  bracket: BracketWithTeam;
  onHover: (bracket: BracketWithTeam | null) => void;
  onClick: (bracket: BracketWithTeam) => void;
  isHovered: boolean;
  isSelected: boolean;
}) {
  const team = bracket.team;
  const isChampion = bracket.round === "Champion";
  const isEmpty = !bracket.team_name;
  const isBye = bracket.is_bye;

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onMouseEnter={() => onHover(bracket)}
      onMouseLeave={() => onHover(null)}
      onClick={() => {
        if (isEmpty || isBye) return;
        onClick(bracket);
      }}
      className={cn(
        "relative mb-3 last:mb-0",
        (isEmpty || isBye) ? "" : "cursor-pointer"
      )}
    >
      <motion.div
        whileHover={isEmpty || isBye ? {} : { scale: 1.03, y: -2 }}
        whileTap={isEmpty || isBye ? {} : { scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "relative rounded-xl border px-3 py-2.5 transition-all duration-300 sm:px-4 sm:py-3",
          "bg-white/[0.04] backdrop-blur-sm",
          isEmpty && !isBye && "opacity-30 border-white/[0.04]",
          isBye && "opacity-30 border-white/[0.04] border-dashed",
          !isEmpty &&
            !bracket.is_winner &&
            !bracket.is_current &&
            !isChampion &&
            "border-white/[0.08] hover:border-orange-500/25 hover:shadow-lg hover:shadow-orange-500/5",
          bracket.is_current &&
            !isEmpty &&
            "border-orange-500/40 shadow-lg shadow-orange-500/10",
          bracket.is_winner &&
            !isChampion &&
            "border-orange-500/30 shadow-lg shadow-orange-500/15",
          isChampion &&
            bracket.is_winner &&
            "border-amber-400/40 shadow-xl shadow-amber-500/20",
          isChampion && !bracket.is_winner && "border-white/[0.08]",
          (isHovered || isSelected) &&
            !isEmpty &&
            !isBye &&
            "border-orange-500/40 shadow-xl shadow-orange-500/15 bg-orange-500/[0.06]"
        )}
      >
        {isChampion && bracket.is_winner && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 pointer-events-none"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {bracket.is_current && !isEmpty && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-orange-500/30 pointer-events-none"
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.01, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <div className="relative flex items-center gap-2.5 sm:gap-3">
          <div className="relative flex-shrink-0">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden transition-all duration-300 sm:h-9 sm:w-9 sm:rounded-xl",
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
                    "text-[10px] font-bold sm:text-xs",
                    bracket.is_winner ? "text-orange-400" : "text-zinc-500"
                  )}
                >
                  {isBye ? "B" : getInitials(bracket.team_name || "TBD")}
                </span>
              )}
            </div>

            {bracket.is_winner && (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                className={cn(
                  "absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full sm:h-4 sm:w-4",
                  isChampion
                    ? "bg-gradient-to-br from-amber-400 to-orange-500"
                    : "bg-orange-500"
                )}
              >
                <Trophy className="h-2 w-2 text-white sm:h-2.5 sm:w-2.5" />
              </motion.div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-xs font-semibold truncate transition-colors duration-200 sm:text-sm",
                isBye
                  ? "text-zinc-600 italic"
                  : isEmpty
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
              {isBye ? "BYE" : bracket.team_name || "TBD"}
            </p>
            {bracket.team_seed > 0 && !isEmpty && !isBye && (
              <p className="text-[9px] text-zinc-500 mt-0.5 sm:text-[10px]">
                Seed #{bracket.team_seed}
              </p>
            )}
          </div>

          {!isEmpty && !isBye && (
            <motion.div
              animate={{
                opacity: isHovered || isSelected ? 1 : 0.3,
                x: isHovered || isSelected ? 0 : 5,
              }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0"
            >
              <ChevronRight className="h-3.5 w-3.5 text-zinc-500 sm:h-4 sm:w-4" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {isChampion && bracket.is_winner && (
        <motion.div
          className="absolute -inset-1 rounded-[16px] bg-gradient-to-r from-amber-500/10 via-orange-500/15 to-amber-500/10 blur-xl pointer-events-none -z-10"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}

function ChampionShowcase({ bracket }: { bracket: BracketWithTeam }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.6 }}
      className="flex flex-col items-center gap-4"
    >
      <motion.div
        animate={{
          rotate: [0, -5, 5, -5, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 border border-amber-400/30 sm:h-20 sm:w-20"
      >
        {bracket.team?.logo ? (
          <img
            src={bracket.team.logo}
            alt={bracket.team_name}
            className="h-full w-full object-cover rounded-2xl"
          />
        ) : (
          <Trophy className="h-8 w-8 text-amber-400 sm:h-10 sm:w-10" />
        )}
      </motion.div>

      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Star className="h-3.5 w-3.5 text-amber-400 sm:h-4 sm:w-4" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400 sm:text-xs">
            Champion
          </span>
          <Star className="h-3.5 w-3.5 text-amber-400 sm:h-4 sm:w-4" />
        </div>
        <p className="text-lg font-bold bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300 bg-clip-text text-transparent sm:text-xl">
          {bracket.team_name}
        </p>
      </div>
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
}: {
  roundName: string;
  teams: BracketWithTeam[];
  delay: number;
  onTeamHover: (bracket: BracketWithTeam | null) => void;
  onTeamClick: (bracket: BracketWithTeam) => void;
  hoveredId: string | null;
  selectedId: string | null;
}) {
  const config = ROUND_CONFIG[roundName] || { label: roundName, shortLabel: roundName };
  const isChampion = roundName === "Champion";

  if (isChampion) {
    const championBracket = teams.find((b) => b.is_winner) || teams[0];
    if (!championBracket) return null;
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay }}
        className="flex flex-col items-center justify-center gap-4"
      >
        <div className="text-center mb-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-orange-400 sm:text-sm">
            <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            {config.shortLabel}
          </span>
        </div>
        <ChampionShowcase bracket={championBracket} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col gap-3"
    >
      <div className="text-center mb-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:text-sm">
          {config.shortLabel}
        </span>
      </div>
      <div className="flex flex-col justify-center">
        {teams.length > 0 ? (
          teams.map((bracket) => (
            <TeamCard
              key={bracket.id}
              bracket={bracket}
              onHover={onTeamHover}
              onClick={onTeamClick}
              isHovered={hoveredId === bracket.id}
              isSelected={selectedId === bracket.id}
            />
          ))
        ) : (
          <div className="h-10 rounded-xl border border-dashed border-white/5 flex items-center justify-center sm:h-12">
            <span className="text-[10px] text-zinc-600 sm:text-xs">Empty</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TeamDetailSheet({
  bracket,
  onClose,
  playersPerTeam,
}: {
  bracket: BracketWithTeam;
  onClose: () => void;
  playersPerTeam?: number;
}) {
  const players = getTeamPlayers(bracket, playersPerTeam);
  const isChampion = bracket.round === "Champion";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full max-w-lg rounded-t-2xl border border-white/[0.08] p-5",
          "bg-[#18181B]/95 backdrop-blur-xl",
          "sm:rounded-2xl sm:mx-4",
          "pb-8 sm:pb-5"
        )}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/10 mt-3 sm:hidden" />

        <button
          onClick={onClose}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors sm:top-4 sm:right-4"
        >
          <X className="h-4 w-4 text-zinc-400" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden",
              bracket.is_winner
                ? isChampion
                  ? "bg-gradient-to-br from-amber-500/30 to-orange-500/20 border border-amber-400/30"
                  : "bg-orange-500/20 border border-orange-500/20"
                : "bg-white/5 border border-white/[0.06]"
            )}
          >
            {bracket.team?.logo ? (
              <img
                src={bracket.team.logo}
                alt={bracket.team_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-zinc-400">
                {getInitials(bracket.team_name || "TBD")}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {bracket.team_name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-zinc-400">
                Seed #{bracket.team_seed}
              </span>
              <span className="text-zinc-600">·</span>
              <span className="text-xs text-zinc-400">
                {ROUND_CONFIG[bracket.round]?.label || bracket.round}
              </span>
              {bracket.is_winner && (
                <>
                  <span className="text-zinc-600">·</span>
                  <span className="inline-flex items-center gap-1 text-xs text-orange-400">
                    <Trophy className="h-3 w-3" />
                    Winner
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2 sm:text-xs">
            Roster
          </p>
          {players.map((player, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 text-[10px] font-semibold text-zinc-500">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{player.name}</p>
              </div>
              {player.role === "Captain" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                  <Star className="h-2.5 w-2.5" />
                  CPT
                </span>
              )}
              {player.role === "Substitute" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-500/10 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                  SUB
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function BracketPage() {
  const { teams } = useTeams();
  const { brackets, loading } = useBracketsWithTeams(teams);
  const { settings } = useSettings();

  const [hoveredBracket, setHoveredBracket] = useState<BracketWithTeam | null>(null);
  const [selectedBracket, setSelectedBracket] = useState<BracketWithTeam | null>(null);

  const activeRounds = useMemo(() => getActiveRounds(brackets), [brackets]);

  const groupedRounds = useMemo(
    () =>
      activeRounds.map((roundName) => ({
        name: roundName,
        teams: brackets
          .filter((b) => b.round === roundName)
          .sort((a, b) => a.position - b.position),
      })),
    [brackets, activeRounds]
  );

  const totalTeams = useMemo(
    () => brackets.filter((b) => b.team_name && !b.is_bye).length,
    [brackets]
  );

  const handleHover = useCallback((bracket: BracketWithTeam | null) => {
    setHoveredBracket(bracket);
  }, []);

  const handleClick = useCallback(
    (bracket: BracketWithTeam) => {
      if (selectedBracket?.id === bracket.id) {
        setSelectedBracket(null);
      } else {
        setSelectedBracket(bracket);
      }
    },
    [selectedBracket]
  );

  const handleClose = useCallback(() => {
    setSelectedBracket(null);
    setHoveredBracket(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090B]">
      <AnimatedBackground />
      <Navbar />

      <main className="relative z-10">
        <PageWrapper>
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <div className="flex items-center gap-4 mb-10 sm:mb-12">
              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/20 border border-orange-500/20 sm:h-14 sm:w-14"
              >
                <Swords className="h-6 w-6 text-orange-400 sm:h-7 sm:w-7" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  {settings?.tournament_name || "Tournament Bracket"}
                </h1>
                <p className="text-sm text-zinc-400">
                  Single Elimination — {totalTeams} teams
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
              <div className="overflow-x-auto pb-8 -mx-4 px-4 scrollbar-thin">
                <div className="flex items-start gap-0 min-w-[900px]">
                  {groupedRounds.map((round, i) => (
                    <div key={round.name} className="contents">
                      {i > 0 && (
                        <div className="flex flex-col items-center justify-center self-stretch px-1">
                          <motion.div
                            initial={{ opacity: 0, scaleX: 0 }}
                            animate={{ opacity: 1, scaleX: 1 }}
                            transition={{ duration: 0.4, delay: i * 0.1 + 0.2 }}
                            className="w-6 sm:w-10 flex items-center justify-center"
                          >
                            <svg width="40" height="20" className="text-zinc-700">
                              <line x1="0" y1="10" x2="40" y2="10" stroke="currentColor" strokeWidth="1.5" />
                              <polygon points="35,5 40,10 35,15" fill="currentColor" />
                            </svg>
                          </motion.div>
                        </div>
                      )}
                      <BracketRound
                        roundName={round.name}
                        teams={round.teams}
                        delay={i * 0.1}
                        onTeamHover={handleHover}
                        onTeamClick={handleClick}
                        hoveredId={hoveredBracket?.id || null}
                        selectedId={selectedBracket?.id || null}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {brackets.length > 0 && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center justify-center gap-6 mt-8 text-xs text-zinc-600"
              >
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-orange-500/40" />
                  Winner
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full border border-orange-500/40 animate-pulse" />
                  Current Match
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-white/10 border border-white/10" />
                  Upcoming
                </span>
              </motion.div>
            )}
          </div>
        </PageWrapper>
      </main>

      <AnimatePresence>
        {selectedBracket && selectedBracket.team && (
          <TeamDetailSheet
            key={selectedBracket.id}
            bracket={selectedBracket}
            onClose={handleClose}
            playersPerTeam={settings?.players_per_team}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
