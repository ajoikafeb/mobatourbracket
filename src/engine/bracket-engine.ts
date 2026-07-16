import type {
  EngineBracket,
  EngineBracketConfig,
  EngineBracketStats,
  EngineMatch,
  EngineRound,
  EngineTeam,
  MatchStatus,
  RoundName,
  SeedingMode,
} from "./types";
import { getRoundName, ROUND_ORDER } from "./types";
import { generateId } from "./utils";
import { applySeeding, generateSeedOrder } from "./seeding";

export function determineBracketSize(teamCount: number): number {
  if (teamCount <= 1) return 1;
  if (teamCount <= 2) return 2;
  let size = 2;
  while (size < teamCount) {
    size *= 2;
  }
  return Math.min(size, 64);
}

export function generateBracket(
  teams: EngineTeam[],
  seedingMode: SeedingMode,
  bestOf: number,
  manualSeeds?: Record<string, number>
): EngineBracket {
  const bracketSize = determineBracketSize(teams.length);
  const totalByes = bracketSize - teams.length;

  const sortedTeams = sortTeamsForSeeding(teams, seedingMode);
  const seedOrder = generateSeedOrder(bracketSize);
  const slots: (EngineTeam | null)[] = new Array(bracketSize).fill(null);

  for (let i = 0; i < sortedTeams.length && i < bracketSize; i++) {
    slots[seedOrder[i]] = { ...sortedTeams[i] };
  }

  const rounds = buildRounds(bracketSize);
  const matches = buildMatches(rounds, slots, bestOf);
  const champion = findChampion(matches);
  const stats = computeStats(matches);

  const config: EngineBracketConfig = {
    bracketSize,
    totalByes,
    bestOf,
    seedingMode,
  };

  return { teams: sortedTeams, rounds, matches, champion, stats, config };
}

function sortTeamsForSeeding(
  teams: EngineTeam[],
  mode: SeedingMode
): EngineTeam[] {
  const sorted = [...teams];
  switch (mode) {
    case "random": {
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      }
      sorted.forEach((t, i) => {
        t.seed = i + 1;
      });
      break;
    }
    default:
      sorted.sort((a, b) => a.seed - b.seed);
      break;
  }
  return sorted;
}

function buildRounds(bracketSize: number): EngineRound[] {
  const totalRounds = Math.log2(bracketSize);
  const rounds: EngineRound[] = [];

  for (let i = 0; i < totalRounds; i++) {
    const name = getRoundName(bracketSize, i);
    rounds.push({ name, order: i, matches: [] });
  }
  rounds.push({ name: "Champion", order: totalRounds, matches: [] });

  return rounds;
}

function buildMatches(
  rounds: EngineRound[],
  seededSlots: (EngineTeam | null)[],
  bestOf: number
): EngineMatch[] {
  const allMatches: EngineMatch[] = [];
  const bracketSize = seededSlots.length;
  const totalRounds = rounds.length - 1;

  let prevRoundMatches: EngineMatch[] = [];

  for (let roundIdx = 0; roundIdx < totalRounds; roundIdx++) {
    const round = rounds[roundIdx];
    const matchCount = bracketSize / Math.pow(2, roundIdx + 1);

    const roundMatches: EngineMatch[] = [];

    if (roundIdx === 0) {
      const seedOrder = generateSeedOrder(bracketSize);
      for (let i = 0; i < matchCount; i++) {
        const slotAIndex = seedOrder[i * 2];
        const slotBIndex = seedOrder[i * 2 + 1];
        const teamA = seededSlots[slotAIndex];
        const teamB = seededSlots[slotBIndex];

        const isByeA = !teamA;
        const isByeB = !teamB;

        let winner: EngineTeam | null = null;
        let loserId: string | null = null;
        let status: MatchStatus = "waiting";

        if (isByeA && !isByeB) {
          winner = teamB;
          status = "finished";
        } else if (!isByeA && isByeB) {
          winner = teamA;
          status = "finished";
        }

        if (winner) {
          const loser = isByeA ? teamA : teamB;
          loserId = loser?.id || null;
        }

        const match: EngineMatch = {
          id: generateId(),
          round: round.name,
          roundOrder: roundIdx,
          matchIndex: i,
          matchNumber: i + 1,
          teamA: teamA ? { ...teamA } : null,
          teamB: teamB ? { ...teamB } : null,
          scoreA: 0,
          scoreB: 0,
          status,
          winnerId: winner?.id || null,
          loserId,
          scheduledTime: null,
          bestOf,
          nextMatchId: null,
          nextSlot: null,
        };

        roundMatches.push(match);
        allMatches.push(match);
      }
    } else {
      for (let i = 0; i < matchCount; i++) {
        const match: EngineMatch = {
          id: generateId(),
          round: round.name,
          roundOrder: roundIdx,
          matchIndex: i,
          matchNumber: allMatches.length + i + 1,
          teamA: null,
          teamB: null,
          scoreA: 0,
          scoreB: 0,
          status: "waiting",
          winnerId: null,
          loserId: null,
          scheduledTime: null,
          bestOf,
          nextMatchId: null,
          nextSlot: null,
        };

        roundMatches.push(match);
        allMatches.push(match);
      }
    }

    round.matches = roundMatches;

    if (prevRoundMatches.length > 0) {
      for (let i = 0; i < prevRoundMatches.length; i++) {
        const nextMatchIndex = Math.floor(i / 2);
        const nextMatch = roundMatches[nextMatchIndex];
        if (!nextMatch) continue;

        prevRoundMatches[i].nextMatchId = nextMatch.id;
        prevRoundMatches[i].nextSlot = i % 2 === 0 ? "A" : "B";

        const winner = prevRoundMatches[i].winnerId
          ? prevRoundMatches[i].teamA?.id === prevRoundMatches[i].winnerId
            ? prevRoundMatches[i].teamA
            : prevRoundMatches[i].teamB
          : null;

        if (winner) {
          if (i % 2 === 0) {
            nextMatch.teamA = { ...winner };
          } else {
            nextMatch.teamB = { ...winner };
          }
        }
      }
    }

    prevRoundMatches = roundMatches;
  }

  markEliminated(allMatches);

  return allMatches;
}

function markEliminated(matches: EngineMatch[]): void {
  const finished = matches.filter((m) => m.status === "finished");
  const allTeams = new Set<string>();

  for (const m of matches) {
    if (m.teamA) allTeams.add(m.teamA.id);
    if (m.teamB) allTeams.add(m.teamB.id);
  }

  const eliminated = new Set<string>();
  for (const m of finished) {
    if (m.loserId) eliminated.add(m.loserId);
  }

  for (const m of matches) {
    if (m.teamA && eliminated.has(m.teamA.id)) {
      m.teamA = { ...m.teamA, isEliminated: true };
    }
    if (m.teamB && eliminated.has(m.teamB.id)) {
      m.teamB = { ...m.teamB, isEliminated: true };
    }
  }
}

function findChampion(matches: EngineMatch[]): EngineTeam | null {
  const grandFinal = matches.find((m) => m.round === "Grand Final");
  if (grandFinal?.status === "finished" && grandFinal.winnerId) {
    const winner =
      grandFinal.teamA?.id === grandFinal.winnerId
        ? grandFinal.teamA
        : grandFinal.teamB;
    return winner ? { ...winner, isEliminated: false } : null;
  }
  return null;
}

export function computeStats(matches: EngineMatch[]): EngineBracketStats {
  const real = matches.filter((m) => m.status !== "cancelled");
  const completed = real.filter((m) => m.status === "finished").length;
  const live = real.filter((m) => m.status === "live").length;
  const waiting = real.filter((m) => m.status === "waiting" || m.status === "upcoming").length;

  return {
    totalMatches: real.length,
    completedMatches: completed,
    liveMatches: live,
    waitingMatches: waiting,
    progress: real.length > 0 ? Math.round((completed / real.length) * 100) : 0,
  };
}
