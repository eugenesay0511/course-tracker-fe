import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
} from "@mui/material";
import {
  LocalFireDepartment as FireIcon,
  TrendingUp as TrendingIcon,
} from "@mui/icons-material";
import { useAtomValue } from "jotai";
import { dailyWatchLogAtom, dailyGoalMinutesAtom } from "../store";
import {
  formatDuration,
  getTodayKey,
  getStreakDays,
} from "../utils/formatters";

export const StudyStreakCard: React.FC = () => {
  const dailyGoal = useAtomValue(dailyGoalMinutesAtom) || 30;
  const log = useAtomValue(dailyWatchLogAtom) || [];

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
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)"
            : "#ffffff",
        border: 1,
        borderColor: "divider",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 10px 40px -10px rgba(0,0,0,0.5)"
            : "0 10px 40px -10px rgba(0,0,0,0.08)",
        borderRadius: 4,
      })}
    >
      <CardContent
        sx={{
          p: 3,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
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
            mb: 3,
          }}
        >
          <TrendingIcon sx={{ fontSize: 18 }} />
          Study Streak
        </Typography>

        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Main Streak Display */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 1,
              mb: 4,
              mt: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography
                variant="h1"
                fontWeight={900}
                sx={{
                  lineHeight: 1.1,
                  color: streak > 0 ? "text.primary" : "text.secondary",
                }}
              >
                {streak}
              </Typography>
              <FireIcon
                sx={{
                  fontSize: 36,
                  color: streak > 0 ? "#ef4444" : "text.disabled",
                  filter:
                    streak > 0
                      ? "drop-shadow(0 4px 12px rgba(239, 68, 68, 0.4))"
                      : "none",
                }}
              />
            </Box>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              fontWeight="bold"
              sx={{ textTransform: "uppercase", letterSpacing: 1 }}
            >
              Day Streak
            </Typography>
          </Box>

          {/* Today's Progress */}
          <Box sx={{ mb: 3 }}>
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

          {/* Last 7 Days Mini Chart */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight="bold"
              sx={{
                mb: 1.5,
                display: "block",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Last 7 Days
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "flex-end",
                height: 40,
                mt: 1,
                mb: 2,
              }}
            >
              {last7Days.map((day) => {
                const height =
                  maxSecondsInWeek > 0
                    ? Math.max(4, (day.seconds / maxSecondsInWeek) * 40)
                    : 4;
                return (
                  <Box
                    key={day.key}
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 0.5,
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
                        fontWeight: day.key === today ? 800 : 500,
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
              align="center"
              sx={{
                fontWeight: 600,
                color: goalReached ? "success.main" : "text.secondary",
                mt: 1,
              }}
            >
              {getMotivation()}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
