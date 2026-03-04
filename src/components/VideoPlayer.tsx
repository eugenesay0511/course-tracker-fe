import React, { useEffect, useRef, useState, useCallback } from "react";
import { Box, Typography, IconButton, Tooltip, Stack } from "@mui/material";
import {
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  FolderOpen as ChapterIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Keyboard as KeyboardIcon,
  Replay as RestartIcon,
} from "@mui/icons-material";
import { Modal, Backdrop, Fade, Paper, Divider } from "@mui/material";
import type { VideoProgress } from "../types";

// Vidstack Core Imports
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import {
  MediaPlayer,
  MediaProvider,
  Track,
  type MediaPlayerInstance,
} from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";

interface VideoPlayerProps {
  videoId: string;
  videoSrc: string | null;
  subtitleSrc?: string | null;
  title: string;
  chapterTitle?: string;
  updateVideoProgress: (
    videoId: string,
    currentTime: number,
    duration: number,
  ) => void;
  getProgress: (videoId: string) => VideoProgress | undefined;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  autoplay?: boolean;
  onToggleAutoplay?: (enabled: boolean) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  videoSrc,
  subtitleSrc,
  title,
  chapterTitle,
  updateVideoProgress,
  getProgress,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  autoplay = false,
  onToggleAutoplay,
}) => {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const [vttUrl, setVttUrl] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // State ref to keep track of the most recent time sent to the hook, to throttle updates
  const lastUpdatedTimeRef = useRef<number>(0);
  const playedInitialResumeRef = useRef<boolean>(false);

  useEffect(() => {
    playedInitialResumeRef.current = false;
  }, [videoId]);

  const onCanPlay = useCallback(() => {
    const player = playerRef.current;
    if (player && !playedInitialResumeRef.current) {
      const savedProgress = getProgress(videoId);
      if (savedProgress && savedProgress.currentTime > 0) {
        const percent =
          savedProgress.currentTime / (savedProgress.duration || 1);
        if (percent < 0.99) {
          player.currentTime = savedProgress.currentTime;
        } else {
          player.currentTime = 0;
        }
      }
      playedInitialResumeRef.current = true;
    }

    // Automatically focus the player so keyboard shortcuts work right away
    if (player) {
      setTimeout(() => {
        // Handle varying Vidstack API versions
        if (
          (player as any).el &&
          typeof (player as any).el.focus === "function"
        ) {
          (player as any).el.focus();
        } else if (typeof (player as any).focus === "function") {
          (player as any).focus();
        }
      }, 50);
    }
  }, [videoId, getProgress]);

  useEffect(() => {
    if (!subtitleSrc) {
      setVttUrl(null);
      return;
    }

    // Fetch the SRT file and convert to VTT URL
    fetch(subtitleSrc)
      .then((res) => res.text())
      .then((srtText) => {
        // Convert SRT to VTT (replace commas with periods in timestamps)
        const vttText =
          "WEBVTT\n\n" +
          srtText.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
        const blob = new Blob([vttText], { type: "text/vtt" });
        const url = URL.createObjectURL(blob);
        setVttUrl(url);
      })
      .catch((err) => console.error("Failed to load subtitles:", err));

    return () => {
      // Cleanup previous blob URL
      setVttUrl((oldUrl: string | null) => {
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        return null;
      });
    };
  }, [subtitleSrc]);

  // Force subtitles to be enabled by default as soon as the VTT URL is ready
  useEffect(() => {
    if (vttUrl) {
      const timer = setTimeout(() => {
        const player = playerRef.current;
        if (player && player.textTracks) {
          const tracks = Array.from(player.textTracks);
          for (const track of tracks) {
            if (track && track.kind === "subtitles") {
              track.mode = "showing";
            }
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [vttUrl]);

  const handleTimeUpdate = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    const currentTime = player.state.currentTime;
    const duration = player.state.duration || 1;

    // Throttle updates to every ~1 second to prevent excessive React re-renders and localStorage writes
    if (Math.abs(currentTime - lastUpdatedTimeRef.current) > 1) {
      lastUpdatedTimeRef.current = currentTime;
      updateVideoProgress(videoId, currentTime, duration);
    }
  }, [videoId, updateVideoProgress]);

  const handleEnded = useCallback(() => {
    if (autoplay && onNext) {
      onNext();
    }
  }, [autoplay, onNext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const player = playerRef.current;
    if (!player) return;
    if (
      [" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
    ) {
      e.preventDefault();
    }

    const key = e.key.toLowerCase();

    switch (key) {
      case " ":
      case "k":
        if (player.state.paused) player.play();
        else player.pause();
        break;
      case "f":
        if (!player.state.fullscreen) {
          player.enterFullscreen().catch((err) => {
            console.error(`Fullscreen error: ${err.message}`);
          });
        } else {
          player.exitFullscreen();
        }
        break;
      case "m":
        player.muted = !player.state.muted;
        break;
      case "arrowright":
      case "l":
        player.currentTime = Math.min(
          player.state.duration,
          player.state.currentTime + 5,
        );
        break;
      case "arrowleft":
      case "j":
        player.currentTime = Math.max(0, player.state.currentTime - 5);
        break;
      case "arrowup":
        player.volume = Math.min(1, player.state.volume + 0.1);
        break;
      case "arrowdown":
        player.volume = Math.max(0, player.state.volume - 0.1);
        break;
      case ",":
      case "<":
        if (onPrevious && hasPrevious) onPrevious();
        break;
      case ".":
      case ">":
        if (onNext && hasNext) onNext();
        break;
      case "c":
        if (player.textTracks) {
          const tracks = Array.from(player.textTracks);
          for (const track of tracks) {
            if (track && track.kind === "subtitles") {
              track.mode = track.mode === "showing" ? "hidden" : "showing";
            }
          }
        }
        break;
      case "?":
      case "/":
        setShowShortcuts((prev) => !prev);
        break;
    }
  };

  const ShortcutRow = ({ keys, label }: { keys: string[]; label: string }) => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 1,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ display: "flex", gap: 0.5 }}>
        {keys.map((k) => (
          <Paper
            key={k}
            sx={{
              px: 1,
              py: 0.3,
              fontSize: "0.75rem",
              fontWeight: "bold",
              bgcolor: "action.hover",
              border: 1,
              borderColor: "divider",
            }}
          >
            {k}
          </Paper>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "background.default",
        px: 1,
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          position: "relative",
          bgcolor: "black",
          borderRadius: 3,
          overflow: "hidden",
          border: 1,
          borderColor: "divider",
          mb: 3,
          "& video": {
            objectFit: "contain !important",
            height: "100% !important",
            width: "100% !important",
          },
        }}
      >
        <MediaPlayer
          ref={playerRef}
          src={videoSrc ? { src: videoSrc, type: "video/mp4" } : ""}
          title={title}
          fullscreenOrientation="none"
          keyShortcuts={{ seekForward: null, seekBackward: null }}
          onTimeUpdate={handleTimeUpdate}
          onCanPlay={onCanPlay}
          onEnded={handleEnded}
          autoPlay={autoplay}
          style={{ width: "100%", height: "100%", outline: "none" }}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          <MediaProvider>
            {vttUrl && (
              <Track
                src={vttUrl}
                kind="subtitles"
                label="English"
                lang="en-US"
                default
              />
            )}
          </MediaProvider>
          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </Box>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Box
          sx={{
            flexGrow: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </Typography>
          {chapterTitle && (
            <>
              <Divider
                orientation="vertical"
                flexItem
                sx={{ height: 20, my: "auto", opacity: 0.3 }}
              />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "text.secondary",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  whiteSpace: "nowrap",
                }}
              >
                <ChapterIcon
                  sx={{ fontSize: 16, color: "primary.main", opacity: 0.8 }}
                />
                {chapterTitle}
              </Box>
            </>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, ml: 2, alignItems: "center" }}>
          <Tooltip title="View Keyboard Shortcuts">
            <IconButton
              onClick={() => setShowShortcuts(true)}
              sx={{
                bgcolor: "action.hover",
                "&:hover": {
                  bgcolor: "action.selected",
                  color: "primary.main",
                },
              }}
            >
              <InfoIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Restart Video">
            <IconButton
              onClick={() => {
                if (playerRef.current) {
                  playerRef.current.currentTime = 0;
                  playerRef.current.play();
                }
              }}
              sx={{
                bgcolor: "action.hover",
                "&:hover": {
                  bgcolor: "action.selected",
                  color: "primary.main",
                },
              }}
            >
              <RestartIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={autoplay ? "Autoplay is on" : "Autoplay is off"}>
            <Box
              onClick={() => onToggleAutoplay?.(!autoplay)}
              sx={{
                width: 44,
                height: 24,
                borderRadius: 12,
                bgcolor: autoplay
                  ? "primary.main"
                  : "action.disabledBackground",
                position: "relative",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                alignItems: "center",
                border: 1,
                borderColor: autoplay ? "primary.main" : "divider",
                mr: 1,
                "&:hover": {
                  borderColor: "primary.main",
                },
              }}
            >
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  bgcolor: "white",
                  position: "absolute",
                  left: autoplay ? "calc(100% - 21px)" : "3px",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                {autoplay ? (
                  <Box
                    sx={{
                      width: 0,
                      height: 0,
                      borderTop: "3.5px solid transparent",
                      borderBottom: "3.5px solid transparent",
                      borderLeft: "6px solid",
                      borderLeftColor: "primary.main",
                      ml: 0.3,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 5,
                      height: 5,
                      bgcolor: "text.disabled",
                      borderRadius: "50%",
                    }}
                  />
                )}
              </Box>
            </Box>
          </Tooltip>
          <Tooltip title="Previous Video">
            <span>
              <IconButton
                onClick={onPrevious}
                disabled={!hasPrevious}
                sx={{
                  bgcolor: "background.paper",
                  boxShadow: 1,
                  "&:hover": { bgcolor: "action.selected" },
                  "&.Mui-disabled": { bgcolor: "transparent", opacity: 0.4 },
                }}
              >
                <PrevIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Next Video">
            <span>
              <IconButton
                onClick={onNext}
                disabled={!hasNext}
                sx={{
                  bgcolor: "background.paper",
                  boxShadow: 1,
                  "&:hover": { bgcolor: "action.selected" },
                  "&.Mui-disabled": { bgcolor: "transparent", opacity: 0.4 },
                }}
              >
                <NextIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Stack>

      {/* Shortcuts Info Modal */}
      {showShortcuts && (
        <Modal
          open={showShortcuts}
          onClose={() => setShowShortcuts(false)}
          closeAfterTransition
          slots={{ backdrop: Backdrop }}
          slotProps={{
            backdrop: {
              timeout: 500,
              sx: (theme) => ({
                backdropFilter: "blur(4px)",
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(0,0,0,0.8)"
                    : "rgba(255,255,255,0.8)",
              }),
            },
          }}
        >
          <Fade in={showShortcuts}>
            <Paper
              onKeyDown={(e) => {
                if (e.key === "/" || e.key === "?") {
                  setShowShortcuts(false);
                }
              }}
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 400,
                bgcolor: "background.paper",
                border: 1,
                borderColor: "divider",
                boxShadow: 24,
                p: 4,
                borderRadius: 4,
                outline: "none",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <KeyboardIcon color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Keyboard Shortcuts
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => setShowShortcuts(false)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              <Divider sx={{ mb: 2, opacity: 0.1 }} />

              <Stack spacing={0.5}>
                <ShortcutRow label="Play / Pause" keys={["Space", "K"]} />
                <ShortcutRow label="Full Screen" keys={["F"]} />
                <ShortcutRow label="Mute / Unmute" keys={["M"]} />
                <ShortcutRow label="Seek Forward 5s" keys={["→", "L"]} />
                <ShortcutRow label="Seek Backward 5s" keys={["←", "J"]} />
                <ShortcutRow label="Increase Volume" keys={["↑"]} />
                <ShortcutRow label="Decrease Volume" keys={["↓"]} />
                <ShortcutRow label="Next Video" keys={[".", ">"]} />
                <ShortcutRow label="Previous Video" keys={[",", "<"]} />
                <ShortcutRow label="Toggle Subtitles" keys={["C"]} />
                <ShortcutRow label="Show Shortcuts" keys={["?", "/"]} />
              </Stack>

              <Box
                sx={{
                  mt: 3,
                  pt: 2,
                  borderTop: 1,
                  borderColor: "divider",
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Focus the video player to use these shortcuts
                </Typography>
              </Box>
            </Paper>
          </Fade>
        </Modal>
      )}
    </Box>
  );
};
