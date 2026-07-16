import type { EngineTeam, SeedingMode } from "./types";

export function generateSeedOrder(bracketSize: number): number[] {
  if (bracketSize <= 1) return [0];
  if (bracketSize === 2) return [0, 1];

  const half = bracketSize / 2;
  const smaller = generateSeedOrder(half);
  const result: number[] = [];

  for (const seed of smaller) {
    result.push(seed);
    result.push(bracketSize - 1 - seed);
  }

  return result;
}

export function applySeeding(
  teams: EngineTeam[],
  bracketSize: number,
  mode: SeedingMode,
  manualSeeds?: Record<string, number>
): (EngineTeam | null)[] {
  const seedOrder = generateSeedOrder(bracketSize);
  const slots: (EngineTeam | null)[] = new Array(bracketSize).fill(null);

  let sortedTeams: EngineTeam[];

  switch (mode) {
    case "random": {
      sortedTeams = [...teams];
      for (let i = sortedTeams.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sortedTeams[i], sortedTeams[j]] = [sortedTeams[j], sortedTeams[i]];
      }
      sortedTeams.forEach((t, i) => {
        t.seed = i + 1;
      });
      break;
    }
    case "manual": {
      sortedTeams = [...teams];
      if (manualSeeds) {
        for (const team of sortedTeams) {
          if (manualSeeds[team.id] !== undefined) {
            team.seed = manualSeeds[team.id];
          }
        }
      }
      sortedTeams.sort((a, b) => a.seed - b.seed);
      break;
    }
    case "imported":
    default: {
      sortedTeams = [...teams].sort((a, b) => a.seed - b.seed);
      break;
    }
  }

  for (let i = 0; i < sortedTeams.length && i < bracketSize; i++) {
    const position = seedOrder[i];
    slots[position] = sortedTeams[i];
  }

  return slots;
}
