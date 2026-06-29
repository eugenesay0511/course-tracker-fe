import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  LocalFireDepartment as FireIcon,
  TrendingUp as TrendingIcon,
} from "@mui/icons-material";
import { useAtomValue } from "jotai";
import { dailyGoalMinutesAtom } from "../store";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../utils/idb";
import {
  formatDuration,
  getTodayKey,
  getStreakDays,
} from "../utils/formatters";
import HeatMap from "@uiw/react-heat-map";

export const StudyStreakCard: React.FC = () => {
  const dailyGoal = useAtomValue(dailyGoalMinutesAtom) || 30;
  const logArray = useLiveQuery(() => db.dailyLogs.toArray(), []);
  const log = useMemo(() => logArray || [], [logArray]);

  const today = getTodayKey();

  const todaySeconds = useMemo(() => {
    const entry = log.find((e) => e.date === today);
    return entry?.watchedSeconds || 0;
  }, [log, today]);

  const streak = useMemo(() => getStreakDays(log, dailyGoal), [log, dailyGoal]);

  const todayPercent = Math.min(100, (todaySeconds / (dailyGoal * 60)) * 100);
  const goalReached = todayPercent >= 100;

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // Dynamic width tracking
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(320);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Calculate grid size based on container width:
  // Each week column is (rectSize + space) = 15 + 3 = 18px wide.
  // We leave 40px on the left for weekday labels (Sun, Mon, Tue...).
  const { heatmapData, startDate, svgWidth, daysCount } = useMemo(() => {
    const labelOffset = 40;
    const rightMargin = 20;
    const colWidth = 18;
    const availableWidth = Math.max(150, containerWidth - labelOffset - rightMargin);
    const columnsCount = Math.floor(availableWidth / colWidth);
    const days = Math.max(7, columnsCount * 7);
    const calculatedWidth = columnsCount * colWidth + labelOffset + rightMargin;

    const data: { date: string; count: number; seconds: number }[] = [];
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - days);

    const logMap = new Map(log.map((e) => [e.date, e.watchedSeconds]));

    for (let i = days; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const heatKey = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;

      const seconds = logMap.get(key) || 0;

      if (seconds > 0) {
        const percent = seconds / (dailyGoal * 60);
        let level = 1;
        if (percent >= 1.0) level = 4;
        else if (percent >= 0.5) level = 3;
        else if (percent >= 0.25) level = 2;

        data.push({
          date: heatKey,
          count: level,
          seconds: seconds,
        });
      }
    }

    return {
      heatmapData: data,
      startDate: start,
      svgWidth: calculatedWidth,
      daysCount: days,
    };
  }, [log, dailyGoal, containerWidth]);

  const colors = useMemo(() => {
    return {
      1: "#d1fae5", // Lightest emerald
      2: "#a7f3d0", // Light emerald
      3: "#34d399", // Medium emerald
      4: "#059669", // Dark rich emerald
    };
  }, []);

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
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: isDarkMode
          ? "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)"
          : "#ffffff",
        border: 1,
        borderColor: "divider",
        boxShadow: isDarkMode
          ? "0 10px 40px -10px rgba(0,0,0,0.5)"
          : "0 10px 40px -10px rgba(0,0,0,0.08)",
        borderRadius: 4,
      }}
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

          {/* Study Heat Map */}
          <Box ref={containerRef}>
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
              Last {Math.round(daysCount / 30)} Months
            </Typography>
            <Box
              sx={{
                width: "100%",
                mt: 1,
                pb: 1,
                display: "flex",
                justifyContent: "flex-start",
                "--rhm-rect-bg": isDarkMode ? "#243042" : "#e2e8f0",
                "& .w-heat-map": {
                  width: "100% !important",
                },
                "& svg": {
                  width: "100% !important",
                  height: "auto !important",
                },
                "& .w-heat-map text, & svg text, & text": {
                  fill: `${isDarkMode ? "#cbd5e1" : "#475569"} !important`, // Slate text colors visible in dark/light modes
                  fontWeight: "500 !important",
                },
                "& svg rect[fill='#ebedf0'], & svg rect[fill='#EBEDF0'], & svg rect[fill*='ebedf0'], & svg rect[fill*='EBEDF0']":
                  {
                    fill: `${isDarkMode ? "#243042" : "#e2e8f0"} !important`,
                  },
              }}
            >
              <Box sx={{ width: "100%" }}>
                <HeatMap
                  value={heatmapData}
                  startDate={startDate}
                  endDate={new Date()}
                  rectSize={15}
                  space={3}
                  width={svgWidth}
                  panelColors={colors}
                  legendCellSize={0}
                  rectProps={{ rx: 2, ry: 2 }}
                  style={
                    {
                      "--rhm-rect-bg": isDarkMode ? "#243042" : "#e2e8f0",
                    } as React.CSSProperties
                  }
                  rectRender={(props, data) => {
                    if (!data || !data.date) return <rect {...props} />;
                    const seconds = (data as any).seconds || 0;
                    const tooltipText = `${data.date}: ${formatDuration(seconds)} / ${dailyGoal}m`;
                    return (
                      <Tooltip
                        title={tooltipText}
                        key={data.date}
                        arrow
                        placement="top"
                      >
                        <rect {...props} />
                      </Tooltip>
                    );
                  }}
                />
              </Box>
            </Box>

            {/* Motivation message */}
            <Typography
              variant="body2"
              align="center"
              sx={{
                fontWeight: 600,
                color: goalReached ? "success.main" : "text.secondary",
                mt: 2,
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
