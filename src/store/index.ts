import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { PaletteMode } from "@mui/material";
import staticCourseData from "../data/course-data.json";
import { getTodayKey } from "../utils/formatters";
import type {
  CourseProgressState,
  CourseData,
  Bookmark,
} from "../types";

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
  },
  bookmarks: [],
  dailyWatchLog: [],
};

// --- Base Atoms with Storage ---

// Atom for the main progress object. We use atomWithStorage to automatically sync with localStorage.
// We need to provide a custom reviver/loader if we want to merge defaults, or we can ensure defaults are used via a derived atom.
export const courseProgressStateAtom = atomWithStorage<CourseProgressState>(
  STORAGE_KEY,
  defaultProgress,
  {
    getItem: (key) => {
      const storedValue = localStorage.getItem(key);
      if (!storedValue) return defaultProgress;
      try {
        const parsed = JSON.parse(storedValue);
        // Merge with defaults to ensure all fields exist
        return {
          lastWatchedVideoId: parsed.lastWatchedVideoId || null,
          videos: parsed.videos || {},
          settings: {
            ...defaultProgress.settings,
            ...(parsed.settings || {}),
          },
          bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
          dailyWatchLog: Array.isArray(parsed.dailyWatchLog) ? parsed.dailyWatchLog : [],
        };
      } catch (e) {
        console.error("Failed to parse stored progress", e);
        return defaultProgress;
      }
    },
    setItem: (key, value) => {
      localStorage.setItem(key, JSON.stringify(value));
    },
    removeItem: (key) => {
      localStorage.removeItem(key);
    },
  }
);

// Atom for course data
export const courseDataStateAtom = atomWithStorage<CourseData>(
  DATA_STORAGE_KEY,
  staticCourseData as CourseData,
  {
    getItem: (key) => {
      const storedValue = localStorage.getItem(key);
      if (!storedValue) {
        // Fallback to legacy key check
        const oldProgressData = localStorage.getItem(STORAGE_KEY);
        if (oldProgressData) {
          try {
            const parsedOld = JSON.parse(oldProgressData);
            if (
              parsedOld.courseData &&
              Array.isArray(parsedOld.courseData) &&
              parsedOld.courseData.length > 0
            ) {
              localStorage.setItem(key, JSON.stringify(parsedOld.courseData));
              return parsedOld.courseData as CourseData;
            }
          } catch (e) {}
        }
        return staticCourseData as CourseData;
      }
      try {
        return JSON.parse(storedValue) as CourseData;
      } catch (e) {
        console.error("Failed to parse stored course data", e);
        return staticCourseData as CourseData;
      }
    },
    setItem: (key, value) => {
      localStorage.setItem(key, JSON.stringify(value));
    },
    removeItem: (key) => {
      localStorage.removeItem(key);
    },
  }
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
