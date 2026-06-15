import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, Button } from "@mui/material";
import { Lock as LockIcon } from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";

import { CourseOutline } from "../components/CourseOutline";
import { VideoPlayer } from "../components/VideoPlayer";
import { useAtomValue, useAtom, useSetAtom } from "jotai";
import {
  courseDataStateAtom,
  rootHandleAtom,
  permissionStatusAtom,
  settingsAtom,
  autoplayAtom,
  outlinePositionAtom,
  playbackSpeedAtom,
  activeCourseIdAtom,
  folderErrorAtom,
  updateVideoProgress,
  markVideoUncompleted,
  addBookmark,
  removeBookmark,
} from "../store";
import { 
  FolderOff as FolderOffIcon,
  ArrowBack as BackIcon
} from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../utils/idb";
import type { VideoProgress } from "../types";

export const CoursePlayer: React.FC = () => {
  const courseData = useAtomValue(courseDataStateAtom);
  const rootHandle = useAtomValue(rootHandleAtom);
  const [permissionStatus, setPermissionStatus] = useAtom(permissionStatusAtom);
  const settings = useAtomValue(settingsAtom);
  
  const [activeCourseId, setActiveCourseId] = useAtom(activeCourseIdAtom);
  const folderError = useAtomValue(folderErrorAtom);
  const activeCourse = useLiveQuery(
    async () => (activeCourseId ? db.courses.get(activeCourseId) : null),
    [activeCourseId]
  );
  const lastWatchedVideoId = activeCourse?.lastWatchedVideoId || null;

  const bookmarksArray = useLiveQuery(async () => {
    if (!activeCourseId) return [];
    const all = await db.bookmarks.toArray();
    return all.filter(
      (b) =>
        b.videoId.startsWith(`${activeCourseId}::`) ||
        (activeCourseId === "default" && !b.videoId.includes("::")),
    );
  }, [activeCourseId]);

  const videosProgressArray = useLiveQuery(async () => {
    if (!activeCourseId) return [];
    const all = await db.videoProgress.toArray();
    return all.filter(
      (p) =>
        p.videoId.startsWith(`${activeCourseId}::`) ||
        (activeCourseId === "default" && !p.videoId.includes("::")),
    );
  }, [activeCourseId]);

  const bookmarks = React.useMemo(() => bookmarksArray || [], [bookmarksArray]);
  const videosProgress = React.useMemo(() => {
    const dict: Record<string, VideoProgress> = {};
    if (videosProgressArray) {
      videosProgressArray.forEach((p: VideoProgress) => {
        dict[p.videoId] = p;
      });
    }
    return dict;
  }, [videosProgressArray]);

  const setAutoplay = useSetAtom(autoplayAtom);
  const setOutlinePosition = useSetAtom(outlinePositionAtom);
  const setPlaybackSpeed = useSetAtom(playbackSpeedAtom);

  const updateProgressWrapper = useCallback(
    (videoId: string, currentTime: number, duration: number) => {
      updateVideoProgress({ videoId, currentTime, duration });
    },
    [],
  );

  const getProgress = useCallback(
    (videoId: string): VideoProgress | undefined => {
      return videosProgress[videoId];
    },
    [videosProgress],
  );

  const markVideoUncompletedWrapper = useCallback(
    (videoId: string) => markVideoUncompleted(videoId),
    [],
  );

  const addBookmarkWrapper = useCallback(
    (videoId: string, timestamp: number, note: string) => {
      addBookmark({ videoId, timestamp, note });
    },
    [],
  );

  const removeBookmarkWrapper = useCallback(
    (bookmarkId: string) => removeBookmark(bookmarkId),
    [],
  );

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!rootHandle) return false;
    try {
      // @ts-ignore
      const status = await rootHandle.requestPermission({ mode: "read" });
      setPermissionStatus(status);
      return status === "granted";
    } catch (err) {
      console.error("Failed to request permission:", err);
      return false;
    }
  }, [rootHandle, setPermissionStatus]);

  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [resolvedVideoSrc, setResolvedVideoSrc] = useState<string | null>(null);
  const [resolvedSubtitleSrc, setResolvedSubtitleSrc] = useState<string | null>(
    null,
  );
  const [resolvedForVideoId, setResolvedForVideoId] = useState<string | null>(
    null,
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const videoIdParam = searchParams.get("v");
  const seekTimeParam = searchParams.get("t");
  const initialSeekTime = seekTimeParam ? parseFloat(seekTimeParam) : undefined;

  const videoRootPath = settings?.videoRootPath || "";

  // Sync active video from query param, last watched, or the first video of the course
  useEffect(() => {
    if (activeCourse === undefined) return; // Wait until active course is loaded

    // If a URL parameter is present, it is the absolute source of truth.
    if (videoIdParam) {
      if (String(activeVideoId) !== videoIdParam) {
        setActiveVideoId(videoIdParam);
      }
      return; // Exit early to prevent race conditions with progress updates
    }

    // Fallbacks if NO URL parameter exists
    if (lastWatchedVideoId) {
      if (String(activeVideoId) !== String(lastWatchedVideoId)) {
        setActiveVideoId(String(lastWatchedVideoId));
      }
    } else if (courseData.length > 0 && courseData[0].videos.length > 0) {
      if (String(activeVideoId) !== String(courseData[0].videos[0].id)) {
        setActiveVideoId(String(courseData[0].videos[0].id));
      }
    }
  }, [videoIdParam, lastWatchedVideoId, courseData, activeVideoId, activeCourse]);

  // Update last watched video in store whenever active video changes
  useEffect(() => {
    if (activeCourse === undefined) return; // Wait until active course is loaded
    if (activeVideoId && activeVideoId !== lastWatchedVideoId && activeCourseId) {
      db.courses.update(activeCourseId, {
        lastWatchedVideoId: activeVideoId,
        lastAccessed: Date.now(),
      });
    }
  }, [activeVideoId, lastWatchedVideoId, activeCourseId, activeCourse]);

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

  // Blob URL cache with LRU eviction — keeps last 20 resolved URLs
  const MAX_BLOB_CACHE = 20;
  const blobCacheRef = React.useRef<Map<string, string>>(new Map());

  // Helper to resolve a file path to a blob URL (cached with LRU)
  const resolveFile = React.useCallback(
    async (path: string, forceRefresh = false): Promise<string> => {
      const cache = blobCacheRef.current;

      if (!forceRefresh && cache.has(path)) {
        // Move to end (most recently used) by deleting and re-inserting
        const url = cache.get(path)!;
        cache.delete(path);
        cache.set(path, url);
        return url;
      }

      const parts = path.split(/[/\\]/);
      let current = rootHandle!;
      for (let i = 0; i < parts.length - 1; i++) {
        current = await current.getDirectoryHandle(parts[i]);
      }
      const fileHandle = await current.getFileHandle(parts[parts.length - 1]);
      const file = await fileHandle.getFile();
      const url = URL.createObjectURL(file);

      // Evict oldest entry if over capacity
      if (cache.size >= MAX_BLOB_CACHE) {
        const oldest = cache.keys().next().value;
        if (oldest) {
          URL.revokeObjectURL(cache.get(oldest)!);
          cache.delete(oldest);
        }
      }
      cache.set(path, url);
      return url;
    },
    [rootHandle],
  );

  // Resolve file paths to URLs (Blob URLs for production, @fs for local dev)
  useEffect(() => {
    let cancelled = false;

    const resolveUrls = async () => {
      if (!activeVideo) {
        setResolvedVideoSrc(null);
        setResolvedSubtitleSrc(null);
        return;
      }

      if (rootHandle && permissionStatus === "granted") {
        try {
          const vUrl = await resolveFile(activeVideo.path);
          if (cancelled) return;
          setResolvedVideoSrc(vUrl);
          setResolvedForVideoId(activeVideoId);

          if (activeVideo.srtPath) {
            const sUrl = await resolveFile(activeVideo.srtPath);
            if (cancelled) return;
            setResolvedSubtitleSrc(sUrl);
          } else {
            setResolvedSubtitleSrc(null);
          }
        } catch (err) {
          console.error("Failed to resolve file handles:", err);
          if (!cancelled) {
            setResolvedVideoSrc(`/@fs/${videoRootPath}/${activeVideo.path}`);
            setResolvedForVideoId(activeVideoId);
            setResolvedSubtitleSrc(
              activeVideo.srtPath
                ? `/@fs/${videoRootPath}/${activeVideo.srtPath}`
                : null,
            );
          }
        }
      } else {
        if (!cancelled) {
          setResolvedVideoSrc(`/@fs/${videoRootPath}/${activeVideo.path}`);
          setResolvedForVideoId(activeVideoId);
          setResolvedSubtitleSrc(
            activeVideo.srtPath
              ? `/@fs/${videoRootPath}/${activeVideo.srtPath}`
              : null,
          );
        }
      }
    };

    resolveUrls();

    return () => {
      cancelled = true;
    };
  }, [activeVideo, rootHandle, permissionStatus, videoRootPath, resolveFile]);

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

  // Prefetch next/prev video blob URLs for instant switching
  useEffect(() => {
    if (!rootHandle || permissionStatus !== "granted") return;
    const toPrefetch = [nextVideo, prevVideo].filter(Boolean);
    for (const v of toPrefetch) {
      if (v?.path && !blobCacheRef.current.has(v.path)) {
        resolveFile(v.path).catch(() => {});
      }
    }
  }, [nextVideo, prevVideo, rootHandle, permissionStatus, resolveFile]);

  const handleNext = () =>
    nextVideo && setSearchParams({ v: String(nextVideo.id) });
  const handlePrevious = () =>
    prevVideo && setSearchParams({ v: String(prevVideo.id) });

  const needsPermission = rootHandle && permissionStatus === "prompt";
  const isDataLoading = bookmarksArray === undefined || videosProgressArray === undefined;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection:
          settings?.outlinePosition === "right" ? "row-reverse" : "row",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: "350px",
          flexShrink: 0,
          borderRight: settings?.outlinePosition === "right" ? 0 : 1,
          borderLeft: settings?.outlinePosition === "right" ? 1 : 0,
          borderColor: "divider",
        }}
      >
        <CourseOutline
          data={courseData}
          activeVideoId={activeVideoId}
          onVideoSelect={handleVideoSelect}
          getProgress={getProgress}
          markVideoUncompleted={markVideoUncompletedWrapper}
          outlinePosition={settings?.outlinePosition}
          onTogglePosition={setOutlinePosition}
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
        {folderError ? (
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
            <FolderOffIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Folder Not Found
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: 500 }}
            >
              The folder for <strong>{activeCourse?.name}</strong> is missing or inaccessible. 
              Video playback is disabled. To restore playback, please re-add this folder in the Library.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<BackIcon />}
              onClick={() => setActiveCourseId(null)}
              sx={{ borderRadius: 2, px: 4, py: 1.5, fontWeight: "bold" }}
            >
              Go back to Library
            </Button>
          </Box>
        ) : needsPermission && (
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

        {isDataLoading || courseData.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Typography variant="h6" color="text.secondary">
              {isDataLoading ? "Loading Progress..." : "Loading Course Data..."}
            </Typography>
          </Box>
        ) : activeVideoId && activeVideo ? (
          <VideoPlayer
            key={`${activeVideoId}-${initialSeekTime || ""}`}
            videoId={activeVideoId}
            videoSrc={
              resolvedForVideoId === activeVideoId ? resolvedVideoSrc : null
            }
            subtitleSrc={
              resolvedForVideoId === activeVideoId ? resolvedSubtitleSrc : null
            }
            title={activeVideo.title}
            chapterTitle={activeVideo.chapterTitle}
            updateVideoProgress={updateProgressWrapper}
            getProgress={getProgress}
            onNext={handleNext}
            onPrevious={handlePrevious}
            hasNext={!!nextVideo}
            hasPrevious={!!prevVideo}
            autoplay={settings?.autoplay}
            onToggleAutoplay={setAutoplay}
            initialSeekTime={initialSeekTime}
            bookmarks={bookmarks}
            onAddBookmark={addBookmarkWrapper}
            onRemoveBookmark={removeBookmarkWrapper}
            playbackSpeed={settings?.playbackSpeed ?? 1}
            onChangePlaybackSpeed={setPlaybackSpeed}
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
