import { atom } from "jotai";
import { atomWithStorage, unwrap } from "jotai/utils";
import type { PaletteMode } from "@mui/material";
import { getTodayKey } from "../utils/formatters";
import type { CourseProgressState, CourseData, Bookmark } from "../types";
import { getIDBValue, setIDBValue, removeIDBValue } from "../utils/idb";

const STORAGE_KEY = "course_tracker_progress";
const DATA_STORAGE_KEY = "course_tracker_data";
const THEME_STORAGE_KEY = "watchflow-theme-mode";
const DEFAULT_ROOT_PATH = "";

const defaultProgress: CourseProgressState = {
  lastWatchedVideoId: null,
  settings: {
    videoRootPath: DEFAULT_ROOT_PATH,
    autoplay: true,
    outlinePosition: "left",
    dailyGoalMinutes: 30,
    playbackSpeed: 1,
  },
  _isLoaded: false,
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
        settings: {
          ...defaultProgress.settings,
          ...(parsed?.settings || {}),
        },
        _isLoaded: true,
      };
    },
  },
);
export const courseProgressStateAtom = unwrap(
  baseCourseProgressStateAtom,
  (prev) => prev ?? defaultProgress,
);

const EMPTY_COURSE_DATA: CourseData = [];

const baseCourseDataStateAtom = atomWithStorage<CourseData>(
  DATA_STORAGE_KEY,
  EMPTY_COURSE_DATA,
  createIDBStorage(EMPTY_COURSE_DATA),
);
export const courseDataStateAtom = unwrap(
  baseCourseDataStateAtom,
  (prev) => prev ?? EMPTY_COURSE_DATA,
);

// Atom for theme mode
export const themeModeAtom = atomWithStorage<PaletteMode>(
  THEME_STORAGE_KEY,
  "dark",
);

// Non-serializable atoms
export const rootHandleAtom = atom<FileSystemDirectoryHandle | null>(null);
export const permissionStatusAtom = atom<PermissionState | null>(null);

// --- Derived Atoms (Getters/Setters) ---

export const isStoreLoadedAtom = atom((get) => {
  const state = get(courseProgressStateAtom);
  return state._isLoaded === true;
});

// Settings
export const settingsAtom = atom(
  (get) => get(courseProgressStateAtom).settings,
  (get, set, newSettings: Partial<CourseProgressState["settings"]>) => {
    const prev = get(courseProgressStateAtom);
    // Don't update if still loading from storage to prevent overwriting with defaults
    if (prev?._isLoaded === false) return;
    set(courseProgressStateAtom, {
      ...prev,
      settings: { ...(prev?.settings || {}), ...newSettings },
    });
  },
);

export const videoRootPathAtom = atom(
  (get) => get(settingsAtom).videoRootPath,
  (_, set, videoRootPath: string) => {
    set(settingsAtom, { videoRootPath });
  },
);

export const autoplayAtom = atom(
  (get) => get(settingsAtom).autoplay,
  (_, set, autoplay: boolean) => {
    set(settingsAtom, { autoplay });
  },
);

export const outlinePositionAtom = atom(
  (get) => get(settingsAtom).outlinePosition,
  (_, set, outlinePosition: "left" | "right") => {
    set(settingsAtom, { outlinePosition });
  },
);

export const dailyGoalMinutesAtom = atom(
  (get) => get(settingsAtom).dailyGoalMinutes,
  (_, set, dailyGoalMinutes: number) => {
    set(settingsAtom, { dailyGoalMinutes });
  },
);

export const playbackSpeedAtom = atom(
  (get) => get(settingsAtom).playbackSpeed,
  (_, set, playbackSpeed: number) => {
    set(settingsAtom, { playbackSpeed });
  },
);

import { db } from "../utils/idb";

// --- Async Functions for Dexie Operations ---

export const updateVideoProgress = async ({
  videoId,
  currentTime,
  duration,
}: {
  videoId: string;
  currentTime: number;
  duration: number;
}) => {
  const prevVideo = await db.videoProgress.get(videoId);
  const completed =
    prevVideo?.completed || (duration > 0 && currentTime / duration > 0.95);

  const delta = currentTime - (prevVideo?.currentTime || 0);

  if (delta > 0 && delta < 5) {
    const today = getTodayKey();
    let todayLog = await db.dailyLogs.get(today);
    if (todayLog) {
      await db.dailyLogs.put({
        date: today,
        watchedSeconds: todayLog.watchedSeconds + delta,
      });
    } else {
      await db.dailyLogs.put({ date: today, watchedSeconds: delta });
    }

    // Optional: cleanup old logs > 90 days could be done periodically
  }

  await db.videoProgress.put({
    videoId,
    currentTime,
    duration,
    completed,
  });
};

export const markVideoCompleted = async (videoId: string) => {
  const prevVideo = await db.videoProgress.get(videoId);
  await db.videoProgress.put({
    videoId,
    currentTime: prevVideo?.currentTime || 0,
    duration: prevVideo?.duration || 0,
    completed: true,
  });
};

export const markVideoUncompleted = async (videoId: string) => {
  const prevVideo = await db.videoProgress.get(videoId);
  if (prevVideo) {
    await db.videoProgress.put({
      videoId,
      currentTime: 0,
      duration: prevVideo.duration,
      completed: false,
    });
  }
};

export const addBookmark = async ({
  videoId,
  timestamp,
  note,
}: {
  videoId: string;
  timestamp: number;
  note: string;
}) => {
  const newBookmark: Bookmark = {
    id: crypto.randomUUID(),
    videoId,
    timestamp,
    note,
    createdAt: Date.now(),
  };
  await db.bookmarks.put(newBookmark);
};

export const removeBookmark = async (bookmarkId: string) => {
  await db.bookmarks.delete(bookmarkId);
};

export const updateBookmark = async ({
  bookmarkId,
  note,
}: {
  bookmarkId: string;
  note: string;
}) => {
  const bookmark = await db.bookmarks.get(bookmarkId);
  if (bookmark) {
    bookmark.note = note;
    await db.bookmarks.put(bookmark);
  }
};

// Helpers
export const lastWatchedVideoIdAtom = atom(
  (get) => get(courseProgressStateAtom).lastWatchedVideoId,
  (get, set, videoId: string | null) => {
    const prev = get(courseProgressStateAtom);
    if (prev?._isLoaded === false) return;
    set(courseProgressStateAtom, {
      ...prev,
      lastWatchedVideoId: videoId,
    });
  },
);

// Clear progress goes to Dexie too
export const clearProgressAtom = atom(null, async (get, set) => {
  const prev = get(courseProgressStateAtom);
  set(courseProgressStateAtom, {
    ...prev,
    lastWatchedVideoId: null,
  });
  await db.videoProgress.clear();
  await db.bookmarks.clear();
  await db.dailyLogs.clear();
});

// Import progress logic updated
export const importProgressAtom = atom(
  null,
  async (_get, set, jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === "object") {
        if (parsed.videos) {
          const videoArray = Object.entries(parsed.videos).map(
            ([id, val]: any) => ({
              videoId: id,
              ...val,
            }),
          );
          await db.videoProgress.bulkPut(videoArray);
        }
        if (parsed.bookmarks) await db.bookmarks.bulkPut(parsed.bookmarks);
        if (parsed.dailyWatchLog)
          await db.dailyLogs.bulkPut(parsed.dailyWatchLog);

        if (parsed.courseData && Array.isArray(parsed.courseData)) {
          set(courseDataStateAtom, parsed.courseData);
        }

        const prev = _get(courseProgressStateAtom);
        set(courseProgressStateAtom, {
          ...prev,
          lastWatchedVideoId: parsed.lastWatchedVideoId || null,
          settings: {
            ...(prev?.settings || {}),
            ...(parsed.settings || {}),
          },
          _isLoaded: true,
        });

        return true;
      }
    } catch (e) {
      console.error("Failed to import progress", e);
    }
    return false;
  },
);
