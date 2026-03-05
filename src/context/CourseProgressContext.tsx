import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import staticCourseData from "../data/course-data.json";
import { getStoredHandle, setStoredHandle } from "../utils/idb";
import { getTodayKey } from "../utils/formatters";
import type {
  VideoProgress,
  CourseProgressState,
  CourseData,
  Bookmark,
} from "../types";

interface CourseProgressContextType {
  progress: CourseProgressState;
  courseData: CourseData;
  rootHandle: FileSystemDirectoryHandle | null;
  permissionStatus: PermissionState | null;
  updateVideoProgress: (
    videoId: string,
    currentTime: number,
    duration: number,
  ) => void;
  markVideoCompleted: (videoId: string) => void;
  markVideoUncompleted: (videoId: string) => void;
  setVideoRootPath: (path: string) => void;
  setAutoplay: (autoplay: boolean) => void;
  setOutlinePosition: (position: "left" | "right") => void;
  setCourseData: (data: CourseData) => void;
  setRootHandle: (handle: FileSystemDirectoryHandle | null) => void;
  requestPermission: () => Promise<boolean>;
  exportProgress: () => void;
  importProgress: (jsonString: string) => boolean;
  clearProgress: () => void;
  getProgress: (videoId: string) => VideoProgress | undefined;
  // Bookmark methods
  addBookmark: (videoId: string, timestamp: number, note: string) => void;
  removeBookmark: (bookmarkId: string) => void;
  updateBookmark: (bookmarkId: string, note: string) => void;
  // Study goal
  setDailyGoal: (minutes: number) => void;
}

const CourseProgressContext = createContext<
  CourseProgressContextType | undefined
>(undefined);

const STORAGE_KEY = "course_tracker_progress";
const DATA_STORAGE_KEY = "course_tracker_data";
const DEFAULT_ROOT_PATH = "";

const loadProgress = (): CourseProgressState => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (!parsed.settings) {
        parsed.settings = {
          videoRootPath: DEFAULT_ROOT_PATH,
          autoplay: false,
          outlinePosition: "left",
          dailyGoalMinutes: 30,
        };
      }
      if (parsed.settings.autoplay === undefined) {
        parsed.settings.autoplay = false;
      }
      if (parsed.settings.outlinePosition === undefined) {
        parsed.settings.outlinePosition = "left";
      }
      if (parsed.settings.dailyGoalMinutes === undefined) {
        parsed.settings.dailyGoalMinutes = 30;
      }
      if (!Array.isArray(parsed.bookmarks)) {
        parsed.bookmarks = [];
      }
      if (!Array.isArray(parsed.dailyWatchLog)) {
        parsed.dailyWatchLog = [];
      }
      return {
        lastWatchedVideoId: parsed.lastWatchedVideoId || null,
        videos: parsed.videos || {},
        settings: parsed.settings,
        bookmarks: parsed.bookmarks,
        dailyWatchLog: parsed.dailyWatchLog,
      };
    }
  } catch (e) {
    console.error("Failed to load progress from localStorage", e);
  }
  return {
    lastWatchedVideoId: null,
    videos: {},
    settings: {
      videoRootPath: DEFAULT_ROOT_PATH,
      autoplay: false,
      outlinePosition: "left",
      dailyGoalMinutes: 30,
    },
    bookmarks: [],
    dailyWatchLog: [],
  };
};

const loadCourseData = (): CourseData => {
  try {
    const data = localStorage.getItem(DATA_STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as CourseData;
    }

    // Check if it was saved in the old key (legacy support)
    const oldProgressData = localStorage.getItem(STORAGE_KEY);
    if (oldProgressData) {
      const parsedOld = JSON.parse(oldProgressData);
      if (
        parsedOld.courseData &&
        Array.isArray(parsedOld.courseData) &&
        parsedOld.courseData.length > 0
      ) {
        localStorage.setItem(
          DATA_STORAGE_KEY,
          JSON.stringify(parsedOld.courseData),
        );
        return parsedOld.courseData as CourseData;
      }
    }
  } catch (e) {
    console.error("Failed to load course data from localStorage", e);
  }
  return staticCourseData as CourseData;
};

export const CourseProgressProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [progress, setProgress] = useState<CourseProgressState>(loadProgress);
  const [courseData, setCourseDataState] = useState<CourseData>(loadCourseData);
  const [rootHandle, setRootHandleState] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionState | null>(null);

  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [progress]);

  useEffect(() => {
    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(courseData));
  }, [courseData]);

  // Load handle from IndexedDB on mount
  useEffect(() => {
    const initHandle = async () => {
      const handle = await getStoredHandle();
      if (handle) {
        setRootHandleState(handle);
        // Check permission status
        // @ts-ignore
        const status = await handle.queryPermission({ mode: "read" });
        setPermissionStatus(status);
      }
    };
    initHandle();
  }, []);

  const updateVideoProgress = useCallback(
    (videoId: string, currentTime: number, duration: number) => {
      setProgress((prev) => {
        const prevVideo = prev.videos[videoId] || {
          currentTime: 0,
          duration: 0,
          completed: false,
        };
        const completed =
          prevVideo.completed ||
          (duration > 0 && currentTime / duration > 0.95);

        // Calculate watch time delta and log inline (no separate setState)
        const delta = currentTime - (prevVideo.currentTime || 0);
        let updatedLog = prev.dailyWatchLog;
        if (delta > 0 && delta < 5) {
          const today = getTodayKey();
          updatedLog = [...prev.dailyWatchLog];
          const todayIdx = updatedLog.findIndex((e) => e.date === today);
          if (todayIdx >= 0) {
            updatedLog[todayIdx] = {
              ...updatedLog[todayIdx],
              watchedSeconds: updatedLog[todayIdx].watchedSeconds + delta,
            };
          } else {
            updatedLog.push({ date: today, watchedSeconds: delta });
          }
          // Keep only last 90 days
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 90);
          const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`;
          updatedLog = updatedLog.filter((e) => e.date >= cutoffKey);
        }

        return {
          ...prev,
          lastWatchedVideoId: videoId,
          videos: {
            ...prev.videos,
            [videoId]: { currentTime, duration, completed },
          },
          dailyWatchLog: updatedLog,
        };
      });
    },
    [],
  );

  const markVideoCompleted = useCallback((videoId: string) => {
    setProgress((prev) => ({
      ...prev,
      videos: {
        ...prev.videos,
        [videoId]: {
          ...(prev.videos[videoId] || { currentTime: 0, duration: 0 }),
          completed: true,
        },
      },
    }));
  }, []);

  const markVideoUncompleted = useCallback((videoId: string) => {
    setProgress((prev) => ({
      ...prev,
      videos: {
        ...prev.videos,
        [videoId]: {
          ...(prev.videos[videoId] || {
            currentTime: 0,
            duration: 0,
            completed: false,
          }),
          currentTime: 0,
          completed: false,
        },
      },
    }));
  }, []);

  const setVideoRootPath = useCallback((path: string) => {
    setProgress((prev) => ({
      ...prev,
      settings: { ...prev.settings, videoRootPath: path },
    }));
  }, []);

  const setAutoplay = useCallback((autoplay: boolean) => {
    setProgress((prev) => ({
      ...prev,
      settings: { ...prev.settings, autoplay },
    }));
  }, []);

  const setOutlinePosition = useCallback((position: "left" | "right") => {
    setProgress((prev) => ({
      ...prev,
      settings: { ...prev.settings, outlinePosition: position },
    }));
  }, []);

  const setDailyGoal = useCallback((minutes: number) => {
    setProgress((prev) => ({
      ...prev,
      settings: { ...prev.settings, dailyGoalMinutes: minutes },
    }));
  }, []);

  const setCourseData = useCallback((data: CourseData) => {
    setCourseDataState(data);
  }, []);

  const setRootHandle = useCallback(
    (handle: FileSystemDirectoryHandle | null) => {
      setRootHandleState(handle);
      if (handle) {
        setStoredHandle(handle).catch((err) =>
          console.error("Failed to store handle in IDB:", err),
        );
        setPermissionStatus("granted");
      }
    },
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
  }, [rootHandle]);

  const exportProgress = useCallback(() => {
    const dataToExport = { ...progress, courseData };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", "course_progress.json");
    linkElement.click();
  }, [progress, courseData]);

  const importProgress = useCallback(
    (jsonString: string) => {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed && typeof parsed === "object" && parsed.videos) {
          setProgress({
            lastWatchedVideoId: parsed.lastWatchedVideoId || null,
            videos: parsed.videos || {},
            settings: { ...progress.settings, ...(parsed.settings || {}) },
            bookmarks: parsed.bookmarks || progress.bookmarks || [],
            dailyWatchLog: parsed.dailyWatchLog || progress.dailyWatchLog || [],
          });
          if (parsed.courseData && Array.isArray(parsed.courseData)) {
            setCourseDataState(parsed.courseData);
          }
          return true;
        }
      } catch (e) {
        console.error("Failed to import progress", e);
      }
      return false;
    },
    [progress.settings, progress.bookmarks, progress.dailyWatchLog],
  );

  const clearProgress = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      lastWatchedVideoId: null,
      videos: {},
    }));
  }, []);

  const getProgress = useCallback(
    (videoId: string): VideoProgress | undefined => {
      return progress.videos[videoId];
    },
    [progress.videos],
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
    [],
  );

  const removeBookmark = useCallback((bookmarkId: string) => {
    setProgress((prev) => ({
      ...prev,
      bookmarks: prev.bookmarks.filter((b) => b.id !== bookmarkId),
    }));
  }, []);

  const updateBookmark = useCallback((bookmarkId: string, note: string) => {
    setProgress((prev) => ({
      ...prev,
      bookmarks: prev.bookmarks.map((b) =>
        b.id === bookmarkId ? { ...b, note } : b,
      ),
    }));
  }, []);

  const value = React.useMemo(
    () => ({
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
    }),
    [
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
    ],
  );

  return (
    <CourseProgressContext.Provider value={value}>
      {children}
    </CourseProgressContext.Provider>
  );
};

export const useCourseProgress = () => {
  const context = useContext(CourseProgressContext);
  if (context === undefined) {
    throw new Error(
      "useCourseProgress must be used within a CourseProgressProvider",
    );
  }
  return context;
};
