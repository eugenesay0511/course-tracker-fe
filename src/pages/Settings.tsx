import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  Slider,
  Fade,
} from "@mui/material";
import {
  Download as ExportIcon,
  Upload as ImportIcon,
  CheckCircle as SuccessIcon,
  DeleteForever as DeleteIcon,
  Timer as TimerIcon,
  Close as CloseIcon,
  FolderOpen as FolderIcon,
  Storage as StorageIcon,
  Settings as SettingsIcon,
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
import { scanCourseDirectory } from "../utils/scanner";

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

  const [rootPath, setRootPath] = useState(settings.videoRootPath);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [showGuide, setShowGuide] = useState(false);

  const handleSavePath = (pathOverride?: string, newCourseData?: any[]) => {
    let pathToSave =
      pathOverride !== undefined ? pathOverride : rootPath.trim();

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

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        const res = await importProgress(content);
        if (res) {
          setSnackbarOpen(true);
        } else {
          setError("Failed to import. Invalid file format.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleBrowseAndScan = async () => {
    try {
      if ("showDirectoryPicker" in window) {
        // @ts-ignore
        const handle = await (window as any).showDirectoryPicker();
        if (handle) {
          const folderName = handle.name;

          // Try to reconstruct the path if the user has already typed something in
          const currentVal = rootPath.trim();
          let newPath = folderName;

          if (currentVal) {
            // Remove existing quotes if any
            const strippedVal = currentVal.replace(/^["']|["']$/g, "");
            const lastSlash = Math.max(
              strippedVal.lastIndexOf("/"),
              strippedVal.lastIndexOf("\\"),
            );
            if (lastSlash !== -1) {
              const baseDir = strippedVal.substring(0, lastSlash + 1);
              newPath = baseDir + folderName;
            }
          }

          // Store the handle for Vercel/Production mode
          setRootHandle(handle);

          const scannedData = await scanCourseDirectory(handle);
          setRootPath(newPath);
          handleSavePath(newPath, scannedData);

          // After success, close the settings dialog
          setTimeout(() => onClose(), 500);
        }
      } else {
        alert(
          "Your browser doesn't support directory scanning. Please update your path manually.",
        );
      }
    } catch (err) {
      console.error("Directory picker error:", err);
    }
  };

  const handleClearProgress = () => {
    clearProgress();
    setConfirmClearOpen(false);
    setSnackbarOpen(true);
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
            boxShadow: (theme) =>
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
            color: (theme) => theme.palette.text.secondary,
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
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <FolderIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Course Location
              </Typography>
            </Box>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: "background.default",
                borderColor:
                  searchParams.get("action") === "select-folder"
                    ? "primary.main"
                    : "divider",
                boxShadow:
                  searchParams.get("action") === "select-folder"
                    ? "0 0 0 2px rgba(59, 130, 246, 0.5)"
                    : "none",
                transition: "all 0.2s",
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select the folder on your computer where your course videos are
                stored.
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 1.5,
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  placeholder="e.g. C:/Courses/React"
                  value={rootPath}
                  onChange={(e) => setRootPath(e.target.value)}
                  error={!!error}
                  helperText={error}
                  slotProps={{
                    input: {
                      sx: { borderRadius: 2, bgcolor: "background.paper" },
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleBrowseAndScan}
                  startIcon={<FolderIcon />}
                  sx={{
                    borderRadius: 2,
                    whiteSpace: "nowrap",
                    px: 3,
                    height: 40,
                    textTransform: "none",
                    fontWeight: "bold",
                    flexShrink: 0,
                  }}
                >
                  Browse
                </Button>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Button
                  size="small"
                  onClick={() => setShowGuide(!showGuide)}
                  sx={{
                    textTransform: "none",
                    color: "text.secondary",
                    fontWeight: 800,
                    letterSpacing: 1,
                    mb: 1,
                    p: 0,
                    minWidth: 0,
                    "&:hover": {
                      bgcolor: "transparent",
                      color: "primary.main",
                    },
                  }}
                >
                  {showGuide
                    ? "HIDE FOLDER STRUCTURE GUIDE"
                    : "SHOW FOLDER STRUCTURE GUIDE"}
                </Button>

                {showGuide && (
                  <Fade in={showGuide}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: "action.hover",
                        fontFamily: "monospace",
                        fontSize: "0.75rem",
                        lineHeight: 1.4,
                        color: "text.secondary",
                        border: 1,
                        borderColor: "divider",
                      }}
                    >
                      <Box
                        sx={{ color: "text.primary", fontWeight: 700, mb: 0.5 }}
                      >
                        Folder Structure:
                      </Box>
                      <Box>Root Folder/</Box>
                      <Box sx={{ pl: 1.5 }}>
                        <Box>├── Chapter Name/</Box>
                        <Box sx={{ pl: 1.5 }}>
                          <Box>├── Video Title.mp4</Box>
                          <Box>└── Video Title.srt (optional)</Box>
                        </Box>
                      </Box>
                    </Box>
                  </Fade>
                )}
              </Box>
            </Paper>
          </Box>

          {/* Group 2: Daily Goal */}
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
                  }}
                />
              </Box>
            </Paper>
          </Box>

          {/* Group 3: Data Management */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <StorageIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Data & Storage
              </Typography>
            </Box>
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 3,
                bgcolor: "background.default",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Backup Progress
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Export or import your learning data.
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ExportIcon />}
                    onClick={exportProgress}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Export
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    component="label"
                    startIcon={<ImportIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Import
                    <input
                      type="file"
                      hidden
                      accept=".json"
                      onChange={handleImport}
                    />
                  </Button>
                </Box>
              </Box>

              <Divider />

              <Box
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 2,
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(239, 68, 68, 0.04)"
                      : "rgba(239, 68, 68, 0.02)",
                }}
              >
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="error"
                    fontWeight="bold"
                  >
                    Delete Data
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Permanently clear all watch history.
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setConfirmClearOpen(true)}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    boxShadow: "none",
                  }}
                >
                  Clear
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
      </DialogContent>

      <Dialog
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ color: "error.main", fontWeight: "bold" }}>
          Clear All Progress?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently reset all your video progress, watched time,
            and completed status. Your course location and settings will remain.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setConfirmClearOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleClearProgress}
            color="error"
            variant="contained"
            sx={{ borderRadius: 2, boxShadow: "none" }}
          >
            Clear Everything
          </Button>
        </DialogActions>
      </Dialog>

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
