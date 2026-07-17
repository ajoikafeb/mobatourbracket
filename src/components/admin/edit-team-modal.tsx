"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Loader2, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateTeam } from "@/services/team-service";
import type { Team } from "@/lib/types";
import { cn } from "@/lib/utils";

interface EditTeamModalProps {
  team: Team;
  onClose: () => void;
  onSaved: (updated: Team) => void;
}

function getPlayersFromTeam(team: Team): string[] {
  const players: string[] = [];
  const fields: (string | null)[] = [
    team.player_1,
    team.player_2,
    team.player_3,
    team.player_4,
    team.player_5,
    (team as Team & { player_6?: string }).player_6,
    team.substitute,
  ];
  for (const f of fields) {
    if (f && f.trim()) players.push(f.trim());
  }
  return players;
}

function teamPlayersToFields(players: string[]): Pick<Team, "player_1" | "player_2" | "player_3" | "player_4" | "player_5" | "substitute"> {
  return {
    player_1: players[0] || "",
    player_2: players[1] || "",
    player_3: players[2] || "",
    player_4: players[3] || "",
    player_5: players[4] || "",
    substitute: players[5] || null,
  };
}

export function EditTeamModal({ team, onClose, onSaved }: EditTeamModalProps) {
  const [teamName, setTeamName] = useState(team.team_name);
  const [players, setPlayers] = useState<string[]>(getPlayersFromTeam(team));
  const [newPlayer, setNewPlayer] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddPlayer = useCallback(() => {
    const name = newPlayer.trim();
    if (!name) return;
    if (players.includes(name)) {
      setError("Player already exists in this team.");
      return;
    }
    setPlayers((prev) => [...prev, name]);
    setNewPlayer("");
    setError(null);
  }, [newPlayer, players]);

  const handleRemovePlayer = useCallback((index: number) => {
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleMovePlayer = useCallback((index: number, direction: -1 | 1) => {
    setPlayers((prev) => {
      const next = [...prev];
      const swap = index + direction;
      if (swap < 0 || swap >= next.length) return prev;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!teamName.trim()) {
      setError("Team name is required.");
      return;
    }
    if (players.length === 0) {
      setError("At least one player is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const playerFields = teamPlayersToFields(players);
      const updated = await updateTeam(team.id, {
        team_name: teamName.trim(),
        captain: players[0] || "",
        ...playerFields,
      });
      onSaved(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to save: ${msg}`);
    } finally {
      setSaving(false);
    }
  }, [team.id, teamName, players, onSaved]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141416] shadow-2xl shadow-black/60"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-bold text-white">Edit Team</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Seed #{team.seed}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(85vh-140px)]">
          {/* Team Name */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Team Name
            </label>
            <Input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              className="h-10"
            />
          </div>

          {/* Players */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Players ({players.length})
            </label>

            <div className="space-y-1.5">
              <AnimatePresence mode="popLayout">
                {players.map((player, idx) => (
                  <motion.div
                    key={`${player}-${idx}`}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                      <GripVertical className="h-4 w-4 text-zinc-700 shrink-0" />
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-white/5 text-[10px] text-zinc-500 font-medium shrink-0">
                        {idx + 1}
                      </span>
                      <span className="flex-1 text-sm text-white truncate">
                        {player}
                      </span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => handleMovePlayer(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 rounded-lg text-zinc-600 hover:text-white hover:bg-white/[0.06] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleMovePlayer(idx, 1)}
                          disabled={idx === players.length - 1}
                          className="p-1 rounded-lg text-zinc-600 hover:text-white hover:bg-white/[0.06] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemovePlayer(idx)}
                          className="p-1 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Add Player */}
            <div className="flex items-center gap-2 mt-2">
              <Input
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddPlayer();
                  }
                }}
                placeholder="Add player name..."
                className="h-9 text-sm"
              />
              <Button
                onClick={handleAddPlayer}
                disabled={!newPlayer.trim()}
                size="sm"
                variant="outline"
                className="shrink-0 gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={saving}
            className="text-zinc-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
