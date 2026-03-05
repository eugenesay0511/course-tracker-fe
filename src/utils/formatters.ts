export const formatDuration = (secs: number): string => {
  if (!secs) return "0s";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ""}`.trim();
  return `${s}s`;
};

export const formatTime = (secs: number): string => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export const getTodayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const getStreakDays = (
  log: { date: string; watchedSeconds: number }[],
  goalMinutes: number,
): number => {
  if (!log || log.length === 0 || goalMinutes <= 0) return 0;

  const logMap = new Map(log.map((entry) => [entry.date, entry.watchedSeconds]));
  let streak = 0;
  const d = new Date();

  // Check today first — if today doesn't meet goal, check if yesterday started a streak
  const todayKey = getTodayKey();
  const todaySeconds = logMap.get(todayKey) || 0;
  const todayMet = todaySeconds >= goalMinutes * 60;

  if (!todayMet) {
    // Check if we should count a streak ending yesterday
    d.setDate(d.getDate() - 1);
  }

  while (true) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const secs = logMap.get(key) || 0;
    if (secs >= goalMinutes * 60) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};
