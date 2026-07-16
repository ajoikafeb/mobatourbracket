import type {
  EngineBracket,
  EngineBracketSlot,
  EngineMatch,
  EngineTeam,
  RoundName,
  SeedingMode,
} from "./types";
import { ROUND_ORDER } from "./types";
import { generateId } from "./utils";
import { applySeeding, generateSeedOrder } from "./seeding";

export function determineBracketSize(teamCount: number): number {
  if (teamCount <= 2) return 2;
  let size = 2;
  while (size < teamCount) {
    size *= 2;
  }
  return Math.min(size, 64);
}

export function getRoundsForBracket(bracketSize: number): RoundName[] {
  const totalRounds = Math.log2(bracketSize);
  const allRounds: RoundName[] = [
    "Round of 64",
    "Round of 32",
    "Round of 16",
    "Quarter Final",
    "Semi Final",
    "Grand Final",
  ];
  const startIdx = allRounds.length - totalRounds;
  const rounds = allRounds.slice(startIdx);
  rounds.push("Champion");
  return rounds;
}

export function generateBracket(
  teams: EngineTeam[],
  seedingMode: SeedingMode,
  bestOf: number,
  manualSeeds?: Record<string, number>
): EngineBracket {
  const bracketSize = determineBracketSize(teams.length);
  const totalByes = bracketSize - teams.length;
  const rounds = getRoundsForBracket(bracketSize);
  const seedOrder = generateSeedOrder(bracketSize);

  const slots: EngineBracketSlot[] = [];
  const matches: EngineMatch[] = [];

  for (let roundIdx = 0; roundIdx < rounds.length - 1; roundIdx++) {
    const round = rounds[roundIdx];
    const matchCount = Math.pow(2, rounds.length - 2 - roundIdx);
    for (let pos = 0; pos < matchCount * 2; pos++) {
      slots.push({
        id: generateId(),
        round,
        roundOrder: roundIdx,
        position: pos,
        teamId: null,
        teamName: "",
        teamSeed: 0,
        isBye: false,
        isWinner: false,
        matchId: null,
        nextSlotId: null,
      });
    }
  }

  const championSlot: EngineBracketSlot = {
    id: generateId(),
    round: "Champion",
    roundOrder: rounds.length - 1,
    position: 0,
    teamId: null,
    teamName: "",
    teamSeed: 0,
    isBye: false,
    isWinner: false,
    matchId: null,
    nextSlotId: null,
  };
  slots.push(championSlot);

  const firstRoundSlots = slots.filter((s) => s.roundOrder === 0);
  const seededSlots = applySeeding(teams, bracketSize, seedingMode, manualSeeds);

  for (let i = 0; i < bracketSize; i++) {
    const slot = firstRoundSlots[i];
    const team = seededSlots[i];
    if (team) {
      slot.teamId = team.id;
      slot.teamName = team.name;
      slot.teamSeed = team.seed;
    } else {
      slot.isBye = true;
      slot.teamName = "BYE";
    }
  }

  let matchIndex = 0;
  const processedRoundSizes = new Set<number>();

  for (let roundIdx = 0; roundIdx < rounds.length - 1; roundIdx++) {
    const round = rounds[roundIdx];
    const roundSlots = slots.filter((s) => s.roundOrder === roundIdx);

    const currentRoundSize = roundSlots.length;
    if (processedRoundSizes.has(currentRoundSize)) continue;
    processedRoundSizes.add(currentRoundSize);

    const pairs = buildSeededPairs(currentRoundSize);
    const nextRoundName =
      roundIdx < rounds.length - 2 ? rounds[roundIdx + 1] : "Champion";
    const nextRoundSlots = slots.filter((s) => s.roundOrder === roundIdx + 1);

    for (const [a, b] of pairs) {
      const slotA = roundSlots[a];
      const slotB = roundSlots[b];
      if (!slotA || !slotB) continue;

      const isByeA = slotA.isBye;
      const isByeB = slotB.isBye;

      if (isByeA && !isByeB) {
        const nextSlot = findEmptySlot(nextRoundSlots);
        if (nextSlot) {
          nextSlot.teamName = slotB.teamName;
          nextSlot.teamSeed = slotB.teamSeed;
          nextSlot.teamId = slotB.teamId;
        }
      } else if (!isByeA && isByeB) {
        const nextSlot = findEmptySlot(nextRoundSlots);
        if (nextSlot) {
          nextSlot.teamName = slotA.teamName;
          nextSlot.teamSeed = slotA.teamSeed;
          nextSlot.teamId = slotA.teamId;
        }
      } else if (!isByeA && !isByeB) {
        const match: EngineMatch = {
          id: generateId(),
          round,
          roundOrder: roundIdx,
          matchIndex,
          slotAId: slotA.id,
          slotBId: slotB.id,
          teamAId: slotA.teamId,
          teamBId: slotB.teamId,
          teamAName: slotA.teamName,
          teamBName: slotB.teamName,
          scoreA: 0,
          scoreB: 0,
          status: "waiting",
          winnerId: null,
          winnerName: null,
          bestOf,
          bracketSlot: matchIndex,
          startTime: null,
          endTime: null,
        };

        slotA.matchId = match.id;
        slotB.matchId = match.id;

        const nextSlotA = nextRoundSlots[a] || findEmptySlot(nextRoundSlots);
        const nextSlotB = nextRoundSlots[b] || findEmptySlot(nextRoundSlots);
        if (nextSlotA) slotA.nextSlotId = nextSlotA.id;
        if (nextSlotB) slotB.nextSlotId = nextSlotB.id;

        matches.push(match);
        matchIndex++;
      }
    }
  }

  return { slots, matches, rounds, bracketSize, totalTeams: teams.length, totalByes };
}

function buildSeededPairs(n: number): [number, number][] {
  if (n <= 1) return [];
  const order = generateSeedOrder(n);
  const pairs: [number, number][] = [];
  for (let i = 0; i < n / 2; i++) {
    pairs.push([order[i * 2], order[i * 2 + 1]]);
  }
  return pairs;
}

function findEmptySlot(slots: EngineBracketSlot[]): EngineBracketSlot | undefined {
  return slots.find((s) => !s.teamName && !s.isBye);
}
