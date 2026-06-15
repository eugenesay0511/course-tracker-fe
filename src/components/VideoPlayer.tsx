import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Box, Typography, IconButton, Tooltip, Stack } from "@mui/material";
import {
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  FolderOpen as ChapterIcon,
  Info as InfoIcon,
  Replay as RestartIcon,
} from "@mui/icons-material";

import type { VideoProgress, Bookmark } from "../types";
import { BookmarksPanel, type BookmarksPanelHandle } from "./BookmarksPanel";
import { useVideoShortcuts } from "../hooks/useVideoShortcuts";
import { VideoShortcutsModal } from "./video/VideoShortcutsModal";
import { ShortcutTooltip, shortcutTooltipProps } from "./video/ShortcutTooltip";

// Vidstack Core Imports
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import {
  MediaPlayer,
  MediaProvider,
  Track,
  type MediaPlayerInstance,
  useMediaState,
} from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";

interface BookmarkMarkersProps {
  bookmarks: Bookmark[];
  onSeek: (time: number) => void;
  playerRef: React.RefObject<MediaPlayerInstance | null>;
  videoId: string;
}

const BookmarkMarkers: React.FC<BookmarkMarkersProps> = ({
  bookmarks,
  onSeek,
  playerRef,
  videoId,
}) => {
  const duration = useMediaState("duration", playerRef);
  const [sliderTrackEl, setSliderTrackEl] = useState<Element | null>(null);

  useEffect(() => {
    setSliderTrackEl(null);
    const interval = setInterval(() => {
      const playerEl = (playerRef.current as any)?.el || document;
      const el = playerEl.querySelector(".vds-time-slider");
      if (el) {
        setSliderTrackEl(el);
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [videoId, playerRef]);

  const currentVideoBookmarks = bookmarks.filter((b) => b.videoId === videoId);

  if (!sliderTrackEl || !duration || duration <= 0 || currentVideoBookmarks.length === 0) return null;

  return createPortal(
    <div
      className="bookmarks-progress-overlay"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      {currentVideoBookmarks.map((bookmark) => {
        const percentage = (bookmark.timestamp / duration) * 100;
        return (
          <Tooltip
            key={bookmark.id}
            title={
              <Box sx={{ p: 0.25 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: "common.white",
                    fontSize: "0.875rem",
                    lineHeight: 1.3,
                  }}
                >
                  {bookmark.note || "Bookmark"}
                </Typography>
              </Box>
            }
            placement="top"
            arrow
            enterDelay={0}
            leaveDelay={150}
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: "rgba(28, 28, 30, 0.95)",
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  p: 1.25,
                  borderRadius: "8px",
                  maxWidth: 260,
                },
              },
              arrow: {
                sx: {
                  color: "rgba(28, 28, 30, 0.95)",
                },
              },
            }}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSeek(bookmark.timestamp);
              }}
              style={{
                position: "absolute",
                left: `${percentage}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#f59e0b", // Warm Amber/Gold
                border: "1.5px solid white",
                cursor: "pointer",
                pointerEvents: "auto",
                transition: "transform 0.1s ease, background-color 0.1s ease",
                boxShadow: "0 1px 4px rgba(0,0,0,0.6)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.5)";
                e.currentTarget.style.backgroundColor = "#fbbf24"; // Lighter gold hover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)";
                e.currentTarget.style.backgroundColor = "#f59e0b";
              }}
            />
          </Tooltip>
        );
      })}
    </div>,
    sliderTrackEl
  );
};

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
  initialSeekTime?: number;
  bookmarks?: Bookmark[];
  onAddBookmark?: (videoId: string, timestamp: number, note: string) => void;
  onRemoveBookmark?: (bookmarkId: string) => void;
  playbackSpeed?: number;
  onChangePlaybackSpeed?: (speed: number) => void;
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
  initialSeekTime,
  bookmarks = [],
  onAddBookmark,
  onRemoveBookmark,
  playbackSpeed = 1,
  onChangePlaybackSpeed,
}) => {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const bookmarksRef = useRef<BookmarksPanelHandle>(null);
  const [vttUrl, setVttUrl] = useState<string | null>(null);

  const { showShortcuts, setShowShortcuts, handleKeyDown } = useVideoShortcuts({
    playerRef,
    bookmarksRef,
    playbackSpeed,
    onChangePlaybackSpeed,
    onNext,
    onPrevious,
    hasNext,
    hasPrevious,
    autoplay,
    onToggleAutoplay,
  });

  const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // Sync playback rate when speed or video changes
  useEffect(() => {
    const player = playerRef.current;
    if (player) {
      player.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, videoId]);

  // State ref to keep track of the most recent time sent to the hook, to throttle updates
  const lastUpdatedTimeRef = useRef<number>(0);
  const playedInitialResumeRef = useRef<boolean>(false);

  useEffect(() => {
    playedInitialResumeRef.current = false;
  }, [videoId]);

  const onCanPlay = useCallback(() => {
    const player = playerRef.current;
    if (player && !playedInitialResumeRef.current) {
      // If an initial seek time is specified (e.g. from a bookmark click), use it
      if (initialSeekTime !== undefined && initialSeekTime > 0) {
        player.currentTime = initialSeekTime;
      } else {
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
      }
      playedInitialResumeRef.current = true;
    }

    // Apply persisted playback speed when the new video is ready
    // Use a small delay because Vidstack may reset playbackRate during its own init
    if (player) {
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.playbackRate = playbackSpeed;
        }
      }, 100);
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
  }, [videoId, getProgress, initialSeekTime, playbackSpeed]);

  // Also apply speed whenever playback actually starts (most reliable)
  const handlePlaying = useCallback(() => {
    const player = playerRef.current;
    if (player && player.playbackRate !== playbackSpeed) {
      player.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    if (!subtitleSrc) {
      setVttUrl(null);
      return;
    }

    // Fetch the SRT file and convert to VTT URL
    fetch(subtitleSrc)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.text();
      })
      .then((srtText) => {
        // Convert SRT to VTT (replace commas with periods in timestamps)
        const vttText =
          "WEBVTT\n\n" +
          srtText.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
        const blob = new Blob([vttText], { type: "text/vtt" });
        const url = URL.createObjectURL(blob);
        setVttUrl(url);
      })
      .catch(() => {
        // Silently ignore — can happen with stale blob URLs during rapid switching
      });

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

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "background.default",
        px: { xs: 0, lg: 4 },
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
          playsinline
          fullscreenOrientation="none"
          keyShortcuts={{ seekForward: null, seekBackward: null }}
          onTimeUpdate={handleTimeUpdate}
          onCanPlay={onCanPlay}
          onPlaying={handlePlaying}
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
          <BookmarkMarkers
            bookmarks={bookmarks}
            onSeek={(t) => {
              if (playerRef.current) playerRef.current.currentTime = t;
            }}
            playerRef={playerRef}
            videoId={videoId}
          />
        </MediaPlayer>
      </Box>

      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        sx={{ mb: 2, px: { xs: 1.5, sm: 0 } }}
      >
        <Box
          sx={{
            flexGrow: 1,
            width: "100%",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
          }}
        >
          {chapterTitle && (
            <Typography
              sx={{
                color: "primary.main",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontSize: "0.8rem",
                opacity: 0.85,
                display: "flex",
                alignItems: "center",
                gap: 0.75,
              }}
            >
              <ChapterIcon sx={{ fontSize: 16 }} />
              {chapterTitle}
            </Typography>
          )}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.02em",
              whiteSpace: "normal", // allow wrap on mobile instead of clipping
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, ml: { xs: 0, md: 2 }, flexWrap: "wrap", alignItems: "center" }}>
          {/* Bookmarks */}
          {onAddBookmark && onRemoveBookmark && (
            <BookmarksPanel
              ref={bookmarksRef}
              videoId={videoId}
              bookmarks={bookmarks}
              getCurrentTime={() => playerRef.current?.state.currentTime ?? 0}
              onAddBookmark={onAddBookmark}
              onRemoveBookmark={onRemoveBookmark}
              onSeek={(t) => {
                if (playerRef.current) playerRef.current.currentTime = t;
              }}
            />
          )}
          {/* Autoplay */}
          <Tooltip
            title={
              <ShortcutTooltip
                label={autoplay ? "Autoplay ON" : "Autoplay OFF"}
                shortcut="A"
              />
            }
            {...shortcutTooltipProps}
          >
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
                "&:hover": { borderColor: "primary.main" },
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
          {/* Speed */}
          <Tooltip
            title={<ShortcutTooltip label="Playback Speed" shortcut="+/-" />}
            {...shortcutTooltipProps}
          >
            <IconButton
              onClick={() => {
                const idx = SPEED_OPTIONS.indexOf(playbackSpeed);
                const nextIdx =
                  idx === -1
                    ? SPEED_OPTIONS.indexOf(1)
                    : (idx + 1) % SPEED_OPTIONS.length;
                const nextSpeed = SPEED_OPTIONS[nextIdx];
                onChangePlaybackSpeed?.(nextSpeed);
                const p = playerRef.current;
                if (p) p.playbackRate = nextSpeed;
              }}
              size="small"
              sx={{
                bgcolor: playbackSpeed !== 1 ? "primary.main" : "action.hover",
                color:
                  playbackSpeed !== 1 ? "primary.contrastText" : "text.primary",
                "&:hover": {
                  bgcolor:
                    playbackSpeed !== 1 ? "primary.dark" : "action.selected",
                },
                borderRadius: 2,
                minWidth: 38,
                height: 34,
                px: 1,
              }}
            >
              <Typography
                variant="caption"
                fontWeight="bold"
                sx={{ fontSize: "0.8rem", lineHeight: 1 }}
              >
                {playbackSpeed}x
              </Typography>
            </IconButton>
          </Tooltip>

          {/* Restart */}
          <Tooltip
            title={<ShortcutTooltip label="Restart Video" shortcut="0" />}
            {...shortcutTooltipProps}
          >
            <IconButton
              size="small"
              onClick={() => {
                if (playerRef.current) {
                  playerRef.current.currentTime = 0;
                  playerRef.current.play();
                }
              }}
              sx={{
                bgcolor: "action.hover",
                borderRadius: 2,
                "&:hover": {
                  bgcolor: "action.selected",
                  color: "primary.main",
                },
              }}
            >
              <RestartIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {/* Previous */}
          <Tooltip
            title={<ShortcutTooltip label="Previous Video" shortcut="<" />}
            {...shortcutTooltipProps}
          >
            <span>
              <IconButton
                size="small"
                onClick={onPrevious}
                disabled={!hasPrevious}
                sx={{
                  bgcolor: "action.hover",
                  borderRadius: 2,
                  "&:hover": {
                    bgcolor: "action.selected",
                    color: "primary.main",
                  },
                  "&.Mui-disabled": { bgcolor: "transparent", opacity: 0.3 },
                }}
              >
                <PrevIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          {/* Next */}
          <Tooltip
            title={<ShortcutTooltip label="Next Video" shortcut=">" />}
            {...shortcutTooltipProps}
          >
            <span>
              <IconButton
                size="small"
                onClick={onNext}
                disabled={!hasNext}
                sx={{
                  bgcolor: "action.hover",
                  borderRadius: 2,
                  "&:hover": {
                    bgcolor: "action.selected",
                    color: "primary.main",
                  },
                  "&.Mui-disabled": { bgcolor: "transparent", opacity: 0.3 },
                }}
              >
                <NextIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          {/* Shortcuts */}
          <Tooltip
            title={<ShortcutTooltip label="Keyboard Shortcuts" shortcut="?" />}
            {...shortcutTooltipProps}
          >
            <IconButton
              size="small"
              onClick={() => setShowShortcuts(true)}
              sx={{
                bgcolor: "action.hover",
                borderRadius: 2,
                "&:hover": {
                  bgcolor: "action.selected",
                  color: "primary.main",
                },
              }}
            >
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>

      {/* Shortcuts Info Modal */}
      <VideoShortcutsModal
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </Box>
  );
};
