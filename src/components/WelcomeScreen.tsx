import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import {
  FolderOpen as FolderIcon,
  PlayCircleFilled as PlayIcon,
  BookmarkBorder as BookmarkIcon,
  TrendingUp as TrendingIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSetAtom } from "jotai";
import {
  rootHandleAtom,
  permissionStatusAtom,
  courseDataStateAtom,
  videoRootPathAtom,
} from "../store";
import { setStoredHandle } from "../utils/idb";
import { scanCourseDirectory } from "../utils/scanner";

export const WelcomeScreen: React.FC = () => {
  const setRootHandleState = useSetAtom(rootHandleAtom);
  const setPermissionStatus = useSetAtom(permissionStatusAtom);
  const setCourseData = useSetAtom(courseDataStateAtom);
  const setVideoRootPath = useSetAtom(videoRootPathAtom);
  const navigate = useNavigate();

  const setRootHandle = (handle: FileSystemDirectoryHandle | null) => {
    setRootHandleState(handle);
    if (handle) {
      setStoredHandle(handle).catch((err) =>
        console.error("Failed to store handle in IDB:", err),
      );
      setPermissionStatus("granted");
    }
  };

  const handleSelectFolder = async () => {
    try {
      if (!("showDirectoryPicker" in window)) {
        alert(
          "Your browser doesn't support directory scanning. Please use Chrome or Edge.",
        );
        return;
      }
      // @ts-ignore
      const handle = await (window as any).showDirectoryPicker();
      if (handle) {
        setRootHandle(handle);
        const scannedData = await scanCourseDirectory(handle);
        setCourseData(scannedData);
        setVideoRootPath(handle.name);
        navigate("/");
      }
    } catch (err) {
      console.error("Directory picker error:", err);
    }
  };

  const features = [
    {
      icon: <PlayIcon sx={{ fontSize: 28, color: "#60a5fa" }} />,
      title: "Video Player",
      desc: "Subtitles, shortcuts & auto-progress tracking",
    },
    {
      icon: <BookmarkIcon sx={{ fontSize: 28, color: "#a78bfa" }} />,
      title: "Bookmarks & Notes",
      desc: "Save timestamps and revisit key moments",
    },
    {
      icon: <TrendingIcon sx={{ fontSize: 28, color: "#34d399" }} />,
      title: "Study Streaks",
      desc: "Track daily goals and build study habits",
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        p: 4,
      }}
    >
      <Box sx={{ textAlign: "center", maxWidth: 600 }}>
        <Box
          component="img"
          src="/brain.svg"
          sx={{
            width: 80,
            height: 80,
            mb: 2,
            filter: "drop-shadow(0 4px 12px rgba(59, 130, 246, 0.4))",
          }}
          alt="WatchFlow"
        />
        <Typography
          variant="h3"
          fontWeight={900}
          sx={{
            mb: 1,
            letterSpacing: "-1.5px",
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)"
                : "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Welcome to WatchFlow
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 420, mx: "auto" }}
        >
          Select your video folder to get started. We'll scan the directory and
          set up your viewing dashboard automatically.
        </Typography>

        <Button
          variant="contained"
          size="large"
          startIcon={<FolderIcon />}
          onClick={handleSelectFolder}
          sx={{
            px: 5,
            py: 1.8,
            borderRadius: 3,
            fontWeight: 700,
            fontSize: "1.05rem",
            textTransform: "none",
            boxShadow: "0 8px 32px rgba(59, 130, 246, 0.35)",
            "&:hover": {
              boxShadow: "0 12px 40px rgba(59, 130, 246, 0.5)",
              transform: "translateY(-1px)",
            },
            transition: "all 0.2s ease",
            mb: 5,
          }}
        >
          Select Video Folder
        </Button>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {features.map((f) => (
            <Paper
              key={f.title}
              sx={{
                p: 2.5,
                width: 180,
                borderRadius: 3,
                border: 1,
                borderColor: "divider",
                textAlign: "center",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                },
              }}
            >
              {f.icon}
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{ mt: 1, mb: 0.5 }}
              >
                {f.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {f.desc}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
