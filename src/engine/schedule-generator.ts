import type { EngineMatch, ScheduleConfig } from "./types";

export function generateSchedule(
  matches: EngineMatch[],
  config: ScheduleConfig
): EngineMatch[] {
  const scheduled = matches
    .filter((m) => m.teamAName && m.teamBName && m.teamAName !== "BYE" && m.teamBName !== "BYE")
    .sort((a, b) => {
      if (a.roundOrder !== b.roundOrder) return a.roundOrder - b.roundOrder;
      return a.matchIndex - b.matchIndex;
    });

  const [hours, minutes] = config.startTime.split(":").map(Number);
  const baseDate = new Date(`${config.startDate}T00:00:00`);
  baseDate.setHours(hours, minutes, 0, 0);

  let currentTime = baseDate.getTime();
  const slotMs = config.matchDurationMinutes * 60 * 1000;
  const breakMs = config.breakDurationMinutes * 60 * 1000;

  for (const match of scheduled) {
    match.startTime = new Date(currentTime).toISOString();
    currentTime += slotMs;
    match.endTime = new Date(currentTime).toISOString();
    currentTime += breakMs;
  }

  return scheduled;
}
