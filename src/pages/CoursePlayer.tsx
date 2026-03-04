import React, { useState, useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import { Lock as LockIcon } from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";

import { CourseOutline } from "../components/CourseOutline";
import { VideoPlayer } from "../components/VideoPlayer";
import { useCourseProgress } from "../hooks/useCourseProgress";

export const CoursePlayer: React.FC = () => {
  const {
    progress,
    courseData,
    rootHandle,
    permissionStatus,
    updateVideoProgress,
    getProgress,
    markVideoUncompleted,
    requestPermission,
  } = useCourseProgress() as any;
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [resolvedVideoSrc, setResolvedVideoSrc] = useState<string | null>(null);
  const [resolvedSubtitleSrc, setResolvedSubtitleSrc] = useState<string | null>(
    null,
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const videoIdParam = searchParams.get("v");

  const videoRootPath = progress.settings?.videoRootPath || "";

  // Sync active video from query param, last watched, or the first video of the course
  useEffect(() => {
    // If a URL parameter is present, it is the absolute source of truth.
    if (videoIdParam) {
      if (String(activeVideoId) !== videoIdParam) {
        setActiveVideoId(videoIdParam);
      }
      return; // Exit early to prevent race conditions with progress updates
    }

    // Fallbacks if NO URL parameter exists
    if (progress.lastWatchedVideoId) {
      if (String(activeVideoId) !== String(progress.lastWatchedVideoId)) {
        setActiveVideoId(String(progress.lastWatchedVideoId));
      }
    } else if (courseData.length > 0 && courseData[0].videos.length > 0) {
      if (String(activeVideoId) !== String(courseData[0].videos[0].id)) {
        setActiveVideoId(String(courseData[0].videos[0].id));
      }
    }
  }, [videoIdParam, progress.lastWatchedVideoId, courseData, activeVideoId]);

  // Handle manual video selection (via outline)
  const handleVideoSelect = React.useCallback(
    (v: any) => {
      // We ONLY update the URL here. The useEffect above will catch this change
      // and update the `activeVideoId` state, acting as a single source of truth.
      setSearchParams({ v: String(v.id) });
    },
    [setSearchParams],
  );

  // Find active video object
  const activeVideo = React.useMemo(() => {
    if (!activeVideoId) return null;
    for (const chapter of courseData) {
      const video = chapter.videos.find(
        (v: any) => String(v.id) === String(activeVideoId),
      );
      if (video) return { ...video, chapterTitle: chapter.title };
    }
    return null;
  }, [activeVideoId, courseData]);

  // Resolve file paths to URLs (Blob URLs for Vercel, @fs for local)
  useEffect(() => {
    const resolveUrls = async () => {
      if (!activeVideo) {
        setResolvedVideoSrc(null);
        setResolvedSubtitleSrc(null);
        return;
      }

      // If we have a rootHandle (File System Access API), use it to create Blob URLs
      // This is required for Vercel/Production hosting
      if (rootHandle && permissionStatus === "granted") {
        try {
          const resolveFile = async (path: string) => {
            const parts = path.split(/[/\\]/);
            let current = rootHandle;
            for (let i = 0; i < parts.length - 1; i++) {
              current = await current.getDirectoryHandle(parts[i]);
            }
            const fileHandle = await current.getFileHandle(
              parts[parts.length - 1],
            );
            const file = await fileHandle.getFile();
            return URL.createObjectURL(file);
          };

          const vUrl = await resolveFile(activeVideo.path);
          setResolvedVideoSrc(vUrl);

          if (activeVideo.srtPath) {
            const sUrl = await resolveFile(activeVideo.srtPath);
            setResolvedSubtitleSrc(sUrl);
          } else {
            setResolvedSubtitleSrc(null);
          }

          return () => {
            URL.revokeObjectURL(vUrl);
          };
        } catch (err) {
          console.error("Failed to resolve file handles:", err);
          // Fallback to @fs if handle resolution fails
          setResolvedVideoSrc(`/@fs/${videoRootPath}/${activeVideo.path}`);
          setResolvedSubtitleSrc(
            activeVideo.srtPath
              ? `/@fs/${videoRootPath}/${activeVideo.srtPath}`
              : null,
          );
        }
      } else {
        // Localhost dev mode fallback or permission not granted yet
        setResolvedVideoSrc(`/@fs/${videoRootPath}/${activeVideo.path}`);
        setResolvedSubtitleSrc(
          activeVideo.srtPath
            ? `/@fs/${videoRootPath}/${activeVideo.srtPath}`
            : null,
        );
      }
    };

    resolveUrls();
  }, [activeVideo, rootHandle, permissionStatus, videoRootPath]);

  // Flattened video list for sequential navigation
  const allVideos = React.useMemo(() => {
    return courseData.flatMap((chapter: any) => chapter.videos);
  }, [courseData]);

  const currentIndex = allVideos.findIndex((v: any) => v.id === activeVideoId);
  const nextVideo =
    currentIndex !== -1 && currentIndex < allVideos.length - 1
      ? allVideos[currentIndex + 1]
      : null;
  const prevVideo = currentIndex > 0 ? allVideos[currentIndex - 1] : null;

  const handleNext = () =>
    nextVideo && setSearchParams({ v: String(nextVideo.id) });
  const handlePrevious = () =>
    prevVideo && setSearchParams({ v: String(prevVideo.id) });

  const needsPermission = rootHandle && permissionStatus === "prompt";

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: "350px",
          flexShrink: 0,
          borderRight: 1,
          borderColor: "divider",
        }}
      >
        <CourseOutline
          data={courseData}
          activeVideoId={activeVideoId}
          onVideoSelect={handleVideoSelect}
          getProgress={getProgress}
          markVideoUncompleted={markVideoUncompleted}
        />
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          p: 3,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          position: "relative",
        }}
      >
        {needsPermission && (
          <Box
            sx={(theme) => ({
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(0,0,0,0.85)"
                  : "rgba(255,255,255,0.85)",
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              p: 4,
              backdropFilter: "blur(4px)",
            })}
          >
            <LockIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Local File Access Required
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: 500 }}
            >
              For security, the browser needs your permission to access the
              local course folder on your computer after a refresh.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={requestPermission}
              sx={{ borderRadius: 2, px: 4, py: 1.5, fontWeight: "bold" }}
            >
              Restore Access & Play
            </Button>
          </Box>
        )}

        {courseData.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Loading Course Data...
            </Typography>
          </Box>
        ) : activeVideoId && activeVideo ? (
          <VideoPlayer
            videoId={activeVideoId}
            videoSrc={resolvedVideoSrc}
            subtitleSrc={resolvedSubtitleSrc}
            title={activeVideo.title}
            chapterTitle={activeVideo.chapterTitle}
            updateVideoProgress={updateVideoProgress}
            getProgress={getProgress}
            onNext={handleNext}
            onPrevious={handlePrevious}
            hasNext={!!nextVideo}
            hasPrevious={!!prevVideo}
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 2,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Select a video to start learning
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};
