"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditTeamModal } from "./edit-team-modal";
import { useTeams } from "@/hooks/use-teams";
import { cn } from "@/lib/utils";
import type { Team } from "@/lib/types";

interface TeamListModalProps {
  onClose: () => void;
}

export function TeamListModal({ onClose }: TeamListModalProps) {
  const { teams, loading, refetch } = useTeams();
  const [search, setSearch] = useState("");
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const filtered = teams.filter((t) =>
    t.team_name.toLowerCase().includes(search.toLowerCase()) ||
    t.captain.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaved = useCallback(
    (_updated: Team) => {
      setEditingTeam(null);
      refetch();
    },
    [refetch]
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141416] shadow-2xl shadow-black/60"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15">
                <Users className="h-4.5 w-4.5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Manage Teams</h2>
                <p className="text-xs text-zinc-500 mt-0.5">{teams.length} teams total</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b border-white/[0.04]">
            <Input
              placeholder="Search teams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Team List */}
          <div className="overflow-y-auto max-h-[calc(85vh-180px)] p-4 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-sm text-zinc-500">
                {search ? "No teams match your search." : "No teams found."}
              </div>
            ) : (
              filtered.map((team) => {
                const players = [
                  team.player_1,
                  team.player_2,
                  team.player_3,
                  team.player_4,
                  team.player_5,
                  (team as Team & { player_6?: string }).player_6,
                  team.substitute,
                ].filter(Boolean);

                return (
                  <div
                    key={team.id}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] px-4 py-3 transition-colors"
                  >
                    {/* Seed */}
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-zinc-400 shrink-0">
                      #{team.seed}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {team.team_name}
                      </p>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {players.join(" · ")}
                      </p>
                    </div>

                    {/* Edit button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-zinc-500 hover:text-orange-400 hover:bg-orange-500/10"
                      onClick={() => setEditingTeam(team)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {editingTeam && (
          <EditTeamModal
            key={editingTeam.id}
            team={editingTeam}
            onClose={() => setEditingTeam(null)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </>
  );
}
