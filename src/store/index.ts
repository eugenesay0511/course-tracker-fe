import { atom } from "jotai";
import { atomWithStorage, unwrap } from "jotai/utils";
import type { PaletteMode } from "@mui/material";
import staticCourseData from "../data/course-data.json";
import { getTodayKey } from "../utils/formatters";
import type { CourseProgressState, CourseData, Bookmark } from "../types";
import { getIDBValue, setIDBValue, removeIDBValue } from "../utils/idb";

const STORAGE_KEY = "course_tracker_progress";
const DATA_STORAGE_KEY = "course_tracker_data";
const THEME_STORAGE_KEY = "watchflow-theme-mode";
const DEFAULT_ROOT_PATH = "";

const defaultProgress: CourseProgressState = {
  lastWatchedVideoId: null,
  videos: {},
  settings: {
    videoRootPath: DEFAULT_ROOT_PATH,
    autoplay: false,
    outlinePosition: "left",
    dailyGoalMinutes: 30,
    playbackSpeed: 1,
  },
  bookmarks: [],
  dailyWatchLog: [],
};

// --- Custom IDB Storage for Jotai ---
const createIDBStorage = <T>(defaultValue: T) => ({
  getItem: async (key: string): Promise<T> => {
    // 1. Try IndexedDB
    const idbValue = await getIDBValue<T>(key);
    if (idbValue !== null) return idbValue;

    // 2. Fallback/Migration: Try localStorage
    const localValue = localStorage.getItem(key);
    if (localValue !== null) {
      try {
        const parsed = JSON.parse(localValue);
        // Move to IDB and cleanup localStorage
        await setIDBValue(key, parsed);
        localStorage.removeItem(key);
        return parsed;
      } catch (e) {
        console.error(`Failed to migrate ${key} from localStorage`, e);
      }
    }

    return defaultValue;
  },
  setItem: async (key: string, value: T): Promise<void> => {
    await setIDBValue(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    await removeIDBValue(key);
  },
});

// --- Base Atoms with Storage ---

const baseCourseProgressStateAtom = atomWithStorage<CourseProgressState>(
  STORAGE_KEY,
  defaultProgress,
  {
    ...createIDBStorage(defaultProgress),
    getItem: async (key: string) => {
      const storage = createIDBStorage(defaultProgress);
      const parsed: any = await storage.getItem(key);

      // Merge with defaults to ensure all fields exist
      return {
        lastWatchedVideoId: parsed?.lastWatchedVideoId || null,
        videos: parsed?.videos || {},
        settings: {
          ...defaultProgress.settings,
          ...(parsed?.settings || {}),
        },
        bookmarks: Array.isArray(parsed?.bookmarks) ? parsed.bookmarks : [],
        dailyWatchLog: Array.isArray(parsed?.dailyWatchLog)
          ? parsed.dailyWatchLog
          : [],
      };
    },
  }
);
export const courseProgressStateAtom = unwrap(
  baseCourseProgressStateAtom,
  (prev) => prev ?? defaultProgress
);

const baseCourseDataStateAtom = atomWithStorage<CourseData>(
  DATA_STORAGE_KEY,
  staticCourseData as unknown as CourseData,
  createIDBStorage(staticCourseData as unknown as CourseData)
);
export const courseDataStateAtom = unwrap(
  baseCourseDataStateAtom,
  (prev) => prev ?? (staticCourseData as unknown as CourseData)
);

// Atom for theme mode
export const themeModeAtom = atomWithStorage<PaletteMode>(
  THEME_STORAGE_KEY,
  "dark"
);

// Non-serializable atoms
export const rootHandleAtom = atom<FileSystemDirectoryHandle | null>(null);
export const permissionStatusAtom = atom<PermissionState | null>(null);

// --- Derived Atoms (Getters/Setters) ---

// Settings
export const settingsAtom = atom(
  (get) => get(courseProgressStateAtom).settings,
  (get, set, newSettings: Partial<CourseProgressState["settings"]>) => {
    const prev = get(courseProgressStateAtom);
    set(courseProgressStateAtom, {
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    });
  }
);

export const videoRootPathAtom = atom(
  (get) => get(settingsAtom).videoRootPath,
  (_, set, videoRootPath: string) => {
    set(settingsAtom, { videoRootPath });
  }
);

export const autoplayAtom = atom(
  (get) => get(settingsAtom).autoplay,
  (_, set, autoplay: boolean) => {
    set(settingsAtom, { autoplay });
  }
);

export const outlinePositionAtom = atom(
  (get) => get(settingsAtom).outlinePosition,
  (_, set, outlinePosition: "left" | "right") => {
    set(settingsAtom, { outlinePosition });
  }
);

export const dailyGoalMinutesAtom = atom(
  (get) => get(settingsAtom).dailyGoalMinutes,
  (_, set, dailyGoalMinutes: number) => {
    set(settingsAtom, { dailyGoalMinutes });
  }
);

export const playbackSpeedAtom = atom(
  (get) => get(settingsAtom).playbackSpeed,
  (_, set, playbackSpeed: number) => {
    set(settingsAtom, { playbackSpeed });
  }
);

// Video Progress specific actions
export const videosProgressAtom = atom(
  (get) => get(courseProgressStateAtom).videos
);

export const updateVideoProgressAtom = atom(
  null,
  (get, set, { videoId, currentTime, duration }: { videoId: string; currentTime: number; duration: number }) => {
    const prev = get(courseProgressStateAtom);
    const prevVideo = prev.videos[videoId] || {
      currentTime: 0,
      duration: 0,
      completed: false,
    };
    const completed =
      prevVideo.completed ||
      (duration > 0 && currentTime / duration > 0.95);

    // Calculate watch time delta
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

    set(courseProgressStateAtom, {
      ...prev,
      lastWatchedVideoId: videoId,
      videos: {
        ...prev.videos,
        [videoId]: { currentTime, duration, completed },
      },
      dailyWatchLog: updatedLog,
    });
  }
);

export const markVideoCompletedAtom = atom(null, (get, set, videoId: string) => {
  const prev = get(courseProgressStateAtom);
  set(courseProgressStateAtom, {
    ...prev,
    videos: {
      ...prev.videos,
      [videoId]: {
        ...(prev.videos[videoId] || { currentTime: 0, duration: 0 }),
        completed: true,
      },
    },
  });
});

export const markVideoUncompletedAtom = atom(null, (get, set, videoId: string) => {
  const prev = get(courseProgressStateAtom);
  set(courseProgressStateAtom, {
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
  });
});

// Bookmarks
export const bookmarksAtom = atom(
  (get) => get(courseProgressStateAtom).bookmarks,
  (get, set, newBookmarks: Bookmark[]) => {
    const prev = get(courseProgressStateAtom);
    set(courseProgressStateAtom, { ...prev, bookmarks: newBookmarks });
  }
);

export const addBookmarkAtom = atom(
  null,
  (get, set, { videoId, timestamp, note }: { videoId: string; timestamp: number; note: string }) => {
    const prev = get(courseProgressStateAtom);
    const newBookmark: Bookmark = {
      id: crypto.randomUUID(),
      videoId,
      timestamp,
      note,
      createdAt: Date.now(),
    };
    set(courseProgressStateAtom, {
      ...prev,
      bookmarks: [...prev.bookmarks, newBookmark],
    });
  }
);

export const removeBookmarkAtom = atom(null, (get, set, bookmarkId: string) => {
  const prev = get(courseProgressStateAtom);
  set(courseProgressStateAtom, {
    ...prev,
    bookmarks: prev.bookmarks.filter((b) => b.id !== bookmarkId),
  });
});

export const updateBookmarkAtom = atom(
  null,
  (get, set, { bookmarkId, note }: { bookmarkId: string; note: string }) => {
    const prev = get(courseProgressStateAtom);
    set(courseProgressStateAtom, {
      ...prev,
      bookmarks: prev.bookmarks.map((b) =>
        b.id === bookmarkId ? { ...b, note } : b
      ),
    });
  }
);

// Helpers
export const lastWatchedVideoIdAtom = atom(
  (get) => get(courseProgressStateAtom).lastWatchedVideoId
);

export const dailyWatchLogAtom = atom(
  (get) => get(courseProgressStateAtom).dailyWatchLog
);

// Clear progress
export const clearProgressAtom = atom(null, (get, set) => {
  const prev = get(courseProgressStateAtom);
  set(courseProgressStateAtom, {
    ...prev,
    lastWatchedVideoId: null,
    videos: {},
  });
});

// Import progress
export const importProgressAtom = atom(null, (get, set, jsonString: string) => {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed === "object" && parsed.videos) {
      const prev = get(courseProgressStateAtom);
      set(courseProgressStateAtom, {
        lastWatchedVideoId: parsed.lastWatchedVideoId || null,
        videos: parsed.videos || {},
        settings: { ...prev.settings, ...(parsed.settings || {}) },
        bookmarks: parsed.bookmarks || prev.bookmarks || [],
        dailyWatchLog: parsed.dailyWatchLog || prev.dailyWatchLog || [],
      });
      if (parsed.courseData && Array.isArray(parsed.courseData)) {
        set(courseDataStateAtom, parsed.courseData);
      }
      return true;
    }
  } catch (e) {
    console.error("Failed to import progress", e);
  }
  return false;
});
