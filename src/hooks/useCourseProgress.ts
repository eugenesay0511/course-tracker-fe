import { useAtom, useSetAtom } from "jotai";
import { useCallback } from "react";
import {
  courseProgressStateAtom,
  courseDataStateAtom,
  rootHandleAtom,
  permissionStatusAtom,
  videoRootPathAtom,
  autoplayAtom,
  outlinePositionAtom,
  dailyGoalMinutesAtom,
  updateVideoProgressAtom,
  markVideoCompletedAtom,
  markVideoUncompletedAtom,
  clearProgressAtom,
  importProgressAtom,
} from "../store";
import { getFormattedDateTime } from "../utils/formatters";
import { setStoredHandle } from "../utils/idb";
import type { VideoProgress, Bookmark, CourseData } from "../types";

export const useCourseProgress = () => {
  const [progress, setProgress] = useAtom(courseProgressStateAtom);
  const [courseData, setCourseDataState] = useAtom(courseDataStateAtom);
  const [rootHandle, setRootHandleState] = useAtom(rootHandleAtom);
  const [permissionStatus, setPermissionStatus] = useAtom(permissionStatusAtom);

  const setVideoRootPath = useSetAtom(videoRootPathAtom);
  const setAutoplay = useSetAtom(autoplayAtom);
  const setOutlinePosition = useSetAtom(outlinePositionAtom);
  const setDailyGoal = useSetAtom(dailyGoalMinutesAtom);

  const updateVideoProgressAtomFn = useSetAtom(updateVideoProgressAtom);
  const markVideoCompletedAtomFn = useSetAtom(markVideoCompletedAtom);
  const markVideoUncompletedAtomFn = useSetAtom(markVideoUncompletedAtom);

  const clearProgressFn = useSetAtom(clearProgressAtom);
  const importProgressFn = useSetAtom(importProgressAtom);

  const updateVideoProgress = useCallback(
    (videoId: string, currentTime: number, duration: number) => {
      updateVideoProgressAtomFn({ videoId, currentTime, duration });
    },
    [updateVideoProgressAtomFn]
  );

  const markVideoCompleted = useCallback(
    (videoId: string) => markVideoCompletedAtomFn(videoId),
    [markVideoCompletedAtomFn]
  );
  
  const markVideoUncompleted = useCallback(
    (videoId: string) => markVideoUncompletedAtomFn(videoId),
    [markVideoUncompletedAtomFn]
  );

  const setCourseData = useCallback(
    (data: CourseData) => setCourseDataState(data),
    [setCourseDataState]
  );

  const setRootHandle = useCallback(
    (handle: FileSystemDirectoryHandle | null) => {
      setRootHandleState(handle);
      if (handle) {
        setStoredHandle(handle).catch((err) =>
          console.error("Failed to store handle in IDB:", err)
        );
        setPermissionStatus("granted");
      }
    },
    [setRootHandleState, setPermissionStatus]
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

  const exportProgress = useCallback(() => {
    const dataToExport = { ...progress, courseData };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute(
      "download",
      `course_progress_${getFormattedDateTime()}.json`
    );
    linkElement.click();
  }, [progress, courseData]);

  const importProgress = useCallback(
    (jsonString: string) => {
      return importProgressFn(jsonString);
    },
    [importProgressFn]
  );

  const clearProgress = useCallback(() => {
    clearProgressFn();
  }, [clearProgressFn]);

  const getProgress = useCallback(
    (videoId: string): VideoProgress | undefined => {
      return progress.videos[videoId];
    },
    [progress.videos]
  );

  // Bookmark methods
  const addBookmark = useCallback(
    (videoId: string, timestamp: number, note: string) => {
      const newBookmark: Bookmark = {
        id: crypto.randomUUID(),
        videoId,
        timestamp,
        note,
        createdAt: Date.now(),
      };
      setProgress((prev) => ({
        ...prev,
        bookmarks: [...prev.bookmarks, newBookmark],
      }));
    },
    [setProgress]
  );

  const removeBookmark = useCallback(
    (bookmarkId: string) => {
      setProgress((prev) => ({
        ...prev,
        bookmarks: prev.bookmarks.filter((b) => b.id !== bookmarkId),
      }));
    },
    [setProgress]
  );

  const updateBookmark = useCallback(
    (bookmarkId: string, note: string) => {
      setProgress((prev) => ({
        ...prev,
        bookmarks: prev.bookmarks.map((b) =>
          b.id === bookmarkId ? { ...b, note } : b
        ),
      }));
    },
    [setProgress]
  );

  return {
    progress,
    courseData,
    rootHandle,
    permissionStatus,
    updateVideoProgress,
    markVideoCompleted,
    markVideoUncompleted,
    setVideoRootPath,
    setAutoplay,
    setOutlinePosition,
    setCourseData,
    setRootHandle,
    requestPermission,
    exportProgress,
    importProgress,
    clearProgress,
    getProgress,
    addBookmark,
    removeBookmark,
    updateBookmark,
    setDailyGoal,
  };
};
