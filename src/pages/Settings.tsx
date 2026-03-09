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
import { useSearchParams } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";
import {
  settingsAtom,
  videoRootPathAtom,
  dailyGoalMinutesAtom,
  courseDataStateAtom,
  rootHandleAtom,
  permissionStatusAtom,
  clearProgressAtom,
  importProgressAtom,
} from "../store";
import { db, setStoredHandle } from "../utils/idb";
import { getFormattedDateTime } from "../utils/formatters";
import { CourseLocationSettings } from "../components/settings/CourseLocationSettings";
import { StudyGoalSettings } from "../components/settings/StudyGoalSettings";
import { DataStorageSettings } from "../components/settings/DataStorageSettings";

export const Settings: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const settings = useAtomValue(settingsAtom);
  const setVideoRootPath = useSetAtom(videoRootPathAtom);
  const setDailyGoal = useSetAtom(dailyGoalMinutesAtom);
  const setCourseData = useSetAtom(courseDataStateAtom);
  const setRootHandleState = useSetAtom(rootHandleAtom);
  const setPermissionStatus = useSetAtom(permissionStatusAtom);
  const courseData = useAtomValue(courseDataStateAtom);
  const clearProgressFn = useSetAtom(clearProgressAtom);
  const importProgressFn = useSetAtom(importProgressAtom);

  const setRootHandle = (handle: FileSystemDirectoryHandle | null) => {
    setRootHandleState(handle);
    if (handle) {
      setStoredHandle(handle).catch((err) =>
        console.error("Failed to store handle in IDB:", err),
      );
      setPermissionStatus("granted");
    }
  };

  const exportProgress = async () => {
    // Collect all data from Jotai + Dexie
    const videoProgress = await db.videoProgress.toArray();
    const bookmarks = await db.bookmarks.toArray();
    const dailyLogs = await db.dailyLogs.toArray();

    // Convert video bindings array to an object dictionary for simpler JSON structure fallback
    const videosDict: Record<string, any> = {};
    videoProgress.forEach((v) => {
      videosDict[v.videoId] = v;
    });

    const dataToExport = {
      settings,
      videos: videosDict,
      bookmarks,
      dailyWatchLog: dailyLogs,
      courseData,
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
  const [searchParams] = useSearchParams();

  const handleSavePath = (pathOverride?: string, newCourseData?: any[]) => {
    let pathToSave =
      pathOverride !== undefined ? pathOverride : settings.videoRootPath.trim();

    // Remote surrounding quotes if pasted (e.g. "C:\Path" -> C:\Path)
    pathToSave = pathToSave.replace(/^["']|["']$/g, "");

    // Allow empty path ONLY if we are providing a new handle/data from scanning
    if (!pathToSave && !newCourseData) {
      setError("Please provide a path or use 'Select Folder'");
      return;
    }

    setVideoRootPath(pathToSave);
    if (newCourseData) {
      setCourseData(newCourseData);
    }
    setSnackbarOpen(true);
    setError(null);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            boxShadow: (theme: Theme) =>
              theme.palette.mode === "dark"
                ? "0 24px 48px rgba(0,0,0,0.6)"
                : "0 24px 48px rgba(0,0,0,0.1)",
            backgroundImage: "none",
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
          gap: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            p: 1,
            borderRadius: 2,
            bgcolor: "primary.main",
            color: "primary.contrastText",
          }}
        >
          <SettingsIcon fontSize="small" />
        </Box>
        <Typography variant="h6" fontWeight="bold" component="span">
          Preferences
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 16,
            top: 20,
            color: (theme: Theme) => theme.palette.text.secondary,
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Group 1: Course Location */}
          <CourseLocationSettings
            settings={settings}
            searchParams={searchParams}
            onSavePath={handleSavePath}
            setRootHandle={setRootHandle}
            onClose={onClose}
          />

          {/* Group 2: Daily Goal */}
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
