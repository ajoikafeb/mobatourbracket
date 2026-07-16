import type { PlayerImportResult, EnginePlayer } from "./types";

export function parsePlayers(rawText: string): PlayerImportResult {
  const lines = rawText.split(/\r?\n/);
  let blankLinesRemoved = 0;
  const players: EnginePlayer[] = [];
  let originalIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") {
      blankLinesRemoved++;
      continue;
    }
    const username = trimmed.startsWith("@") ? trimmed.slice(1).trim() : trimmed;
    if (username === "") {
      blankLinesRemoved++;
      continue;
    }
    const normalized = username.replace(/\s+/g, " ");
    players.push({ username: normalized, originalIndex });
    originalIndex++;
  }

  const usernameMap = new Map<string, number[]>();
  for (let i = 0; i < players.length; i++) {
    const name = players[i].username.toLowerCase();
    const indices = usernameMap.get(name) || [];
    indices.push(i);
    usernameMap.set(name, indices);
  }

  const duplicates = Array.from(usernameMap.entries())
    .filter(([_, indices]) => indices.length > 1)
    .map(([username, indices]) => ({
      username: players[indices[0]].username,
      count: indices.length,
      indices,
    }));

  return {
    players,
    duplicates,
    totalImported: players.length,
    blankLinesRemoved,
  };
}
