import React, { useState } from "react";
import { Box, Typography, Paper, TextField, Button, Fade } from "@mui/material";
import { FolderOpen as FolderIcon } from "@mui/icons-material";
import { scanCourseDirectory } from "../../utils/scanner";
import type { Settings } from "../../types";

interface CourseLocationSettingsProps {
  settings: Settings;
  searchParams: URLSearchParams;
  onSavePath: (pathOverride?: string, newCourseData?: any[]) => void;
  setRootHandle: (handle: FileSystemDirectoryHandle | null) => void;
  onClose: () => void;
}

export const CourseLocationSettings: React.FC<CourseLocationSettingsProps> = ({
  settings,
  searchParams,
  onSavePath,
  setRootHandle,
  onClose,
}) => {
  const [rootPath, setRootPath] = useState(settings.videoRootPath);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

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
          onSavePath(newPath, scannedData);

          // After success, close the settings dialog
          setTimeout(() => onClose(), 500);
        }
      } else {
        alert(
          "Your browser doesn't support directory scanning. Please update your path manually.",
        );
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Directory picker error:", err);
      }
    }
  };

  const handleSaveWrapper = () => {
    let pathToSave = rootPath.trim();
    pathToSave = pathToSave.replace(/^["']|["']$/g, "");

    if (!pathToSave) {
      setError("Please provide a path or use 'Select Folder'");
      return;
    }
    setError(null);
    onSavePath(pathToSave);
  };

  return (
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
            onBlur={handleSaveWrapper}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSaveWrapper();
              }
            }}
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
                <Box sx={{ color: "text.primary", fontWeight: 700, mb: 0.5 }}>
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
  );
};
