import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Grid,
} from "@mui/material";
import {
  LocalFireDepartment as FireIcon,
  TrendingUp as TrendingIcon,
} from "@mui/icons-material";
import { useCourseProgress } from "../hooks/useCourseProgress";
import {
  formatDuration,
  getTodayKey,
  getStreakDays,
} from "../utils/formatters";

export const StudyStreakCard: React.FC = () => {
  const { progress } = useCourseProgress();
  const dailyGoal = progress.settings?.dailyGoalMinutes || 30;
  const log = progress.dailyWatchLog || [];

  const today = getTodayKey();

  const todaySeconds = useMemo(() => {
    const entry = log.find((e) => e.date === today);
    return entry?.watchedSeconds || 0;
  }, [log, today]);

  const streak = useMemo(() => getStreakDays(log, dailyGoal), [log, dailyGoal]);

  const todayPercent = Math.min(100, (todaySeconds / (dailyGoal * 60)) * 100);
  const goalReached = todayPercent >= 100;

  // Last 7 days data
  const last7Days = useMemo(() => {
    const days: {
      key: string;
      label: string;
      seconds: number;
      met: boolean;
    }[] = [];
    const d = new Date();
    for (let i = 6; i >= 0; i--) {
      const dd = new Date(d);
      dd.setDate(dd.getDate() - i);
      const key = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(dd.getDate()).padStart(2, "0")}`;
      const entry = log.find((e) => e.date === key);
      const secs = entry?.watchedSeconds || 0;
      days.push({
        key,
        label: dd.toLocaleDateString(undefined, { weekday: "short" }),
        seconds: secs,
        met: secs >= dailyGoal * 60,
      });
    }
    return days;
  }, [log, dailyGoal]);

  const maxSecondsInWeek = Math.max(
    dailyGoal * 60,
    ...last7Days.map((d) => d.seconds),
  );

  const getMotivation = () => {
    if (goalReached && streak >= 7) return "🏆 Incredible! A full week streak!";
    if (goalReached && streak >= 3)
      return `🔥 ${streak} day streak! Keep it burning!`;
    if (goalReached) return "✅ Goal reached today! Great job!";
    if (todayPercent > 50) return "💪 Almost there! Keep going!";
    if (streak > 0) return `🔥 ${streak} day streak! Don't break it!`;
    return "📚 Start watching to build your streak!";
  };

  return (
    <Card
      sx={(theme) => ({
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
            : "linear-gradient(135deg, #ffffff 0%, #f4f9ff 100%)",
        border: 1,
        borderColor: "divider",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
            : "0 20px 40px -4px rgba(148, 163, 184, 0.25)",
        borderRadius: 4,
      })}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography
          variant="subtitle2"
          color="primary.main"
          fontWeight="bold"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            textTransform: "uppercase",
            letterSpacing: 1,
            mb: 2,
          }}
        >
          <TrendingIcon sx={{ fontSize: 18 }} />
          Study Streak
        </Typography>

        <Grid container spacing={3}>
          {/* Streak count */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                py: 1,
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor:
                    streak > 0 ? "rgba(239, 68, 68, 0.1)" : "action.hover",
                  border: 2,
                  borderColor: streak > 0 ? "#ef4444" : "divider",
                  mb: 1,
                }}
              >
                <FireIcon
                  sx={{
                    fontSize: 36,
                    color: streak > 0 ? "#ef4444" : "text.disabled",
                  }}
                />
              </Box>
              <Typography variant="h4" fontWeight={900}>
                {streak}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {streak === 1 ? "day streak" : "day streak"}
              </Typography>
            </Box>
          </Grid>

          {/* Today's progress */}
          <Grid size={{ xs: 12, sm: 8 }}>
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Today's Progress
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color={goalReached ? "success.main" : "text.primary"}
                >
                  {formatDuration(todaySeconds)} / {dailyGoal}m
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={todayPercent}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: "action.hover",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 5,
                    background: goalReached
                      ? "linear-gradient(90deg, #10b981, #34d399)"
                      : "linear-gradient(90deg, #3b82f6, #60a5fa)",
                  },
                }}
              />
            </Box>

            {/* Last 7 days mini chart */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1, display: "block" }}
            >
              Last 7 days
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 0.8,
                alignItems: "flex-end",
                height: 48,
              }}
            >
              {last7Days.map((day) => {
                const height =
                  maxSecondsInWeek > 0
                    ? Math.max(4, (day.seconds / maxSecondsInWeek) * 48)
                    : 4;
                return (
                  <Box
                    key={day.key}
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 0.3,
                    }}
                  >
                    <Box
                      sx={{
                        width: "100%",
                        height: `${height}px`,
                        borderRadius: 1,
                        bgcolor: day.met
                          ? "#10b981"
                          : day.seconds > 0
                            ? "primary.main"
                            : "action.hover",
                        transition: "height 0.3s ease",
                        opacity: day.met ? 1 : 0.6,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.6rem",
                        color:
                          day.key === today ? "primary.main" : "text.disabled",
                        fontWeight: day.key === today ? 700 : 400,
                      }}
                    >
                      {day.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            {/* Motivation message */}
            <Typography
              variant="body2"
              sx={{
                mt: 2,
                fontWeight: 600,
                color: goalReached ? "success.main" : "text.secondary",
              }}
            >
              {getMotivation()}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
