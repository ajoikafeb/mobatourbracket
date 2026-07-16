"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Crown,
  Users,
  Trophy,
  Swords,
  Target,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Team, BracketWithTeam } from "@/lib/types";

interface TeamDetailCardProps {
  team: Team;
  bracket: BracketWithTeam;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface PopoverStyle {
  position: "absolute";
  left: number | string;
  top: number;
  transform?: string;
}

export function TeamDetailCard({
  team,
  bracket,
  onClose,
  anchorRef,
}: TeamDetailCardProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<"top" | "bottom" | "center">("center");
  const [isMobile, setIsMobile] = useState(true);
  const [isTablet, setIsTablet] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<PopoverStyle>({
    position: "absolute",
    left: 0,
    top: 0,
  });
  const [latestMatch, setLatestMatch] = useState<{
    opponent: string;
    score: string;
    result: "win" | "loss";
  } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    function checkSize() {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    }
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  useEffect(() => {
    function calcPopoverStyle() {
      if (isMobile) return;
      const anchor = anchorRef.current;
      if (!anchor) {
        setPosition("center");
        return;
      }
      const rect = anchor.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      const midY = rect.top + rect.height / 2;
      const pos = midY > window.innerHeight / 2 ? "top" : "bottom";
      setPosition(pos);

      if (isTablet) {
        setPopoverStyle({
          position: "absolute",
          left: "50%",
          top: rect.top + scrollY + rect.height / 2,
          transform: "translate(-50%, -50%)",
        });
        return;
      }

      setPopoverStyle({
        position: "absolute",
        left: rect.right + scrollX + 12,
        top: pos === "top" ? scrollY + rect.top - 40 : scrollY + rect.top - 120,
      });
    }
    calcPopoverStyle();
    window.addEventListener("resize", calcPopoverStyle);
    return () => window.removeEventListener("resize", calcPopoverStyle);
  }, [anchorRef, isMobile, isTablet]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("matches")
        .select("*")
        .or(`team_a.eq.${team.team_name},team_b.eq.${team.team_name}`)
        .eq("status", "finished")
        .order("match_date", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const isTeamA = data.team_a === team.team_name;
        const opponent = isTeamA ? data.team_b : data.team_a;
        const teamScore = isTeamA ? data.score_a : data.score_b;
        const oppScore = isTeamA ? data.score_b : data.score_a;
        setLatestMatch({
          opponent,
          score: `${teamScore} - ${oppScore}`,
          result: teamScore > oppScore ? "win" : "loss",
        });
      }
    })();
  }, [team.team_name, supabase]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        innerRef.current &&
        !innerRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, anchorRef]);

  const players = [
    { name: team.player_1, role: "Player 1" },
    { name: team.player_2, role: "Player 2" },
    { name: team.player_3, role: "Player 3" },
    { name: team.player_4, role: "Player 4" },
    { name: team.player_5, role: "Player 5" },
  ].filter((p) => p.name);

  const cardContent = (
    <div
      ref={innerRef}
      className={cn(
        "w-full overflow-hidden",
        "rounded-[20px] border border-orange-500/20",
        "bg-[#09090B]/90 backdrop-blur-2xl",
        "shadow-2xl shadow-orange-500/10",
        isMobile
          ? "rounded-b-none max-h-[80vh] overflow-y-auto"
          : isTablet
          ? "w-[380px] max-h-[80vh] overflow-y-auto"
          : "w-[380px]"
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative p-5">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 overflow-hidden">
                  {team.logo ? (
                    <img
                      src={team.logo}
                      alt={team.team_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-orange-400">
                      {getInitials(team.team_name)}
                    </span>
                  )}
                </div>
                {bracket.is_winner && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500"
                  >
                    <Trophy className="h-3 w-3 text-white" />
                  </motion.div>
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">
                  {team.team_name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Crown className="h-3 w-3 text-orange-400" />
                  <span className="text-xs text-orange-400">
                    {team.captain || "No captain"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/[0.06] px-2.5 py-1">
              <Target className="h-3 w-3 text-zinc-400" />
              <span className="text-[11px] font-medium text-zinc-300">
                {bracket.round}
              </span>
            </div>
            {bracket.team_seed > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/[0.06] px-2.5 py-1">
                <span className="text-[11px] font-medium text-zinc-300">
                  Seed #{bracket.team_seed}
                </span>
              </div>
            )}
            {bracket.is_current && (
              <div className="flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                </span>
                <span className="text-[11px] font-medium text-red-400">
                  Live
                </span>
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="h-3 w-3 text-zinc-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Roster
              </span>
            </div>
            <div className="space-y-1">
              {players.map((player, i) => (
                <div
                  key={player.name}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-[10px] font-bold text-zinc-400">
                    {i + 1}
                  </div>
                  <span className="text-sm text-white flex-1">
                    {player.name}
                  </span>
                  {player.name === team.captain && (
                    <Crown className="h-3 w-3 text-orange-400" />
                  )}
                </div>
              ))}
              {team.substitute && (
                <div className="flex items-center gap-2.5 rounded-xl px-3 py-2 bg-white/[0.03] border border-dashed border-white/[0.06]">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-[10px] font-bold text-zinc-500">
                    S
                  </div>
                  <span className="text-sm text-zinc-400 flex-1">
                    {team.substitute}
                  </span>
                  <span className="text-[10px] text-zinc-600 uppercase font-medium">
                    Sub
                  </span>
                </div>
              )}
            </div>
          </div>

          {latestMatch && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Swords className="h-3 w-3 text-zinc-500" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Latest Match
                </span>
              </div>
              <div
                className={cn(
                  "rounded-xl border px-3 py-2.5",
                  latestMatch.result === "win"
                    ? "border-green-500/20 bg-green-500/5"
                    : "border-red-500/20 bg-red-500/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white font-medium">
                    {team.team_name}
                  </span>
                  <span className="text-xs font-bold text-zinc-300">
                    {latestMatch.score}
                  </span>
                  <span className="text-sm text-zinc-400">
                    {latestMatch.opponent}
                  </span>
                </div>
                <div className="mt-1 text-center">
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase",
                      latestMatch.result === "win"
                        ? "text-green-400"
                        : "text-red-400"
                    )}
                  >
                    {latestMatch.result === "win" ? "Victory" : "Defeat"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative z-10 w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pb-2 pt-4">
              <div className="h-1 w-10 rounded-full bg-zinc-600" />
            </div>
            {cardContent}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.95,
        y: isTablet ? 0 : position === "top" ? 20 : -20,
      }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{
        opacity: 0,
        scale: 0.95,
        y: isTablet ? 0 : position === "top" ? 20 : -20,
      }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed z-[100]"
      style={popoverStyle}
    >
      {cardContent}
    </motion.div>
  );
}
