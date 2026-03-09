import React from "react";
import { Box, Typography, Paper, Slider } from "@mui/material";
import { Timer as TimerIcon } from "@mui/icons-material";
import type { Settings } from "../../types";

interface StudyGoalSettingsProps {
  settings: Settings;
  setDailyGoal: (goal: number) => void;
}

export const StudyGoalSettings: React.FC<StudyGoalSettingsProps> = ({
  settings,
  setDailyGoal,
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <TimerIcon color="primary" />
        <Typography variant="h6" fontWeight="bold">
          Study Goal
        </Typography>
      </Box>
      <Paper
        variant="outlined"
        sx={{ p: 3, borderRadius: 3, bgcolor: "background.default" }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Set a daily watching goal to keep up your learning streak.
          </Typography>
          <Typography variant="h6" color="primary.main" fontWeight={800}>
            {settings.dailyGoalMinutes}m
          </Typography>
        </Box>
        <Box sx={{ px: 2, mt: 3, mb: 1 }}>
          <Slider
            value={settings.dailyGoalMinutes}
            onChange={(_e, value) => setDailyGoal(value as number)}
            min={5}
            max={120}
            step={5}
            marks={[
              { value: 5, label: "5m" },
              { value: 30, label: "30m" },
              { value: 60, label: "1h" },
              { value: 120, label: "2h" },
            ]}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${v}m`}
            sx={{
              "& .MuiSlider-thumb": {
                width: 20,
                height: 20,
                transition: "0.3s cubic-bezier(.47,1.64,.41,.8)",
                "&:hover, &.Mui-focusVisible": {
                  boxShadow: `0px 0px 0px 8px rgba(59, 130, 246, 0.16)`,
                },
                "&.Mui-active": {
                  width: 24,
                  height: 24,
                },
              },
              "& .MuiSlider-valueLabel": {
                borderRadius: 2,
                fontWeight: "bold",
              },
              "& .MuiSlider-markLabel": {
                fontWeight: 600,
                color: "text.disabled",
                "&[data-index='0']": {
                  transform: "translateX(0%)",
                },
                "&[data-index='3']": {
                  transform: "translateX(-100%)",
                },
              },
              "& .MuiSlider-markLabelActive": {
                color: "text.primary",
              },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};
