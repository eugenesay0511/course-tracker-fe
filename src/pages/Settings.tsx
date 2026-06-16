import React, { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  type Theme,
} from "@mui/material";
import {
  CheckCircle as SuccessIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useAtomValue, useSetAtom } from "jotai";
import {
  settingsAtom,
  dailyGoalMinutesAtom,
  clearProgressAtom,
  importProgressAtom,
} from "../store";
import { db } from "../utils/idb";
import { getFormattedDateTime } from "../utils/formatters";
import { StudyGoalSettings } from "../components/settings/StudyGoalSettings";
import { DataStorageSettings } from "../components/settings/DataStorageSettings";

export const Settings: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const settings = useAtomValue(settingsAtom);
  const setDailyGoal = useSetAtom(dailyGoalMinutesAtom);
  const clearProgressFn = useSetAtom(clearProgressAtom);
  const importProgressFn = useSetAtom(importProgressAtom);


  const exportProgress = async () => {
    // Collect all data from Jotai + Dexie
    const videoProgress = await db.videoProgress.toArray();
    const bookmarks = await db.bookmarks.toArray();
    const dailyLogs = await db.dailyLogs.toArray();

    const dataToExport = {
      videos: videoProgress,
      bookmarks,
      dailyWatchLog: dailyLogs,
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute(
      "download",
      `course_progress_${getFormattedDateTime()}.json`,
    );
    linkElement.click();
  };

  const importProgress = (jsonString: string) => {
    return importProgressFn(jsonString);
  };

  const clearProgress = () => {
    clearProgressFn();
  };

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [, setError] = useState<string | null>(null);


  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(8px)",
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(0,0,0,0.7)"
                : "rgba(255,255,255,0.5)",
          },
        },
        paper: {
          sx: {
            borderRadius: 5,
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(30, 41, 59, 0.95)"
                : "#ffffff",
            backdropFilter: "blur(20px)",
            border: "1px solid",
            borderColor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
            boxShadow: (theme: Theme) =>
              theme.palette.mode === "dark"
                ? "0 25px 50px -12px rgba(0, 0, 0, 0.8)"
                : "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            backgroundImage: "none",
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 3,
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderBottom: "1px solid",
          borderColor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.05)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            p: 1.25,
            borderRadius: 2.5,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
          }}
        >
          <SettingsIcon sx={{ fontSize: 20 }} />
        </Box>
        <Box>
          <Typography
            variant="h6"
            fontWeight="900"
            sx={{ letterSpacing: "-0.5px", lineHeight: 1.2 }}
          >
            Preferences
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontWeight: 600 }}
          >
            System configuration & user settings
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 20,
            top: 24,
            color: "text.secondary",
            bgcolor: "action.hover",
            "&:hover": {
              bgcolor: "action.selected",
              color: "text.primary",
            },
            transition: "all 0.2s",
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: { xs: 3, sm: 4 } }}>

          {/* Group 1: Daily Goal */}
          <StudyGoalSettings settings={settings} setDailyGoal={setDailyGoal} />

          {/* Group 3: Data Management */}
          <DataStorageSettings
            exportProgress={exportProgress}
            importProgress={importProgress}
            clearProgress={clearProgress}
            setSnackbarOpen={setSnackbarOpen}
            setError={setError}
          />
        </Box>
      </DialogContent>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SuccessIcon color="secondary" />
            <span>Settings updated!</span>
          </Box>
        }
      />
    </Dialog>
  );
};
