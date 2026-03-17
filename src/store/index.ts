import { atom } from "jotai";
import { atomWithStorage, unwrap } from "jotai/utils";
import type { PaletteMode } from "@mui/material";
import { getTodayKey } from "../utils/formatters";
import type {
  CourseProgressState,
  CourseData,
  Bookmark,
  CourseMeta,
} from "../types";
import {
  getIDBValue,
  setIDBValue,
  removeIDBValue,
  db,
  getLegacyStoredHandle,
  setStoredHandle,
} from "../utils/idb";

const STORAGE_KEY = "course_tracker_progress";
export const DATA_STORAGE_KEY_PREFIX = "course_data_";
const THEME_STORAGE_KEY = "watchflow-theme-mode";
const DEFAULT_ROOT_PATH = "";

const defaultProgress: CourseProgressState = {
  activeCourseId: null,
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
    const idbValue = await getIDBValue<T>(key);
    if (idbValue !== null) return idbValue;

    // Migration from localStorage
    const localValue = localStorage.getItem(key);
    if (localValue !== null) {
      try {
        const parsed = JSON.parse(localValue);
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

// --- Base Atoms ---

const baseCourseProgressStateAtom = atomWithStorage<CourseProgressState>(
  STORAGE_KEY,
  defaultProgress,
  {
    ...createIDBStorage(defaultProgress),
    getItem: async (key: string) => {
      const storage = createIDBStorage(defaultProgress);
      const parsed: any = await storage.getItem(key);

      return {
        activeCourseId: parsed?.activeCourseId || null,
        settings: {
          ...defaultProgress.settings,
          ...(parsed?.settings || {}),
        },
        _isLoaded: true,
      };
    },
  }
);

export const courseProgressStateAtom = unwrap(
  baseCourseProgressStateAtom,
  (prev) => prev ?? defaultProgress
);

export const themeModeAtom = atomWithStorage<PaletteMode>(
  THEME_STORAGE_KEY,
  "dark"
);

// Non-serializable atoms
export const rootHandleAtom = atom<FileSystemDirectoryHandle | null>(null);
export const permissionStatusAtom = atom<PermissionState | null>(null);
export const folderErrorAtom = atom<string | null>(null);

// Course Management Atoms
export const activeCourseIdAtom = atom(
  (get) => get(courseProgressStateAtom).activeCourseId,
  (get, set, newId: string | null) => {
    const prev = get(courseProgressStateAtom);
    if (prev?._isLoaded === false) return;
    set(courseProgressStateAtom, {
      ...prev,
      activeCourseId: newId,
    });
    // Clear data immediately to prevent mismatched rendering during switch
    set(internalCourseDataAtom, EMPTY_COURSE_DATA);
  }
);

// Course Data (Structure) Atom - Dynamic based on activeCourseId
const EMPTY_COURSE_DATA: CourseData = [];
const internalCourseDataAtom = atom<CourseData>(EMPTY_COURSE_DATA);

export const courseDataStateAtom = atom(
  (get) => get(internalCourseDataAtom),
  async (get, set, newData: CourseData) => {
    const courseId = get(activeCourseIdAtom);
    if (!courseId) return;

    set(internalCourseDataAtom, newData);
    await setIDBValue(`${DATA_STORAGE_KEY_PREFIX}${courseId}`, newData);
  }
);

// --- Store Initialization & Migration ---

export const isStoreLoadedAtom = atom((get) => {
  const state = get(courseProgressStateAtom);
  return state._isLoaded === true;
});

// Loader to trigger whenever activeCourseId changes
export const loadCourseDataAtom = atom(null, async (get, set) => {
  const courseId = get(activeCourseIdAtom);
  if (!courseId) {
    set(internalCourseDataAtom, EMPTY_COURSE_DATA);
    set(folderErrorAtom, null);
    set(rootHandleAtom, null);
    return;
  }

  // Check Handle & Folder existence
  try {
    const handle = await db.handles.get(`rootFolderHandle_${courseId}`);
    if (!handle) {
      set(folderErrorAtom, "Folder connection lost. Please re-add the course from the Library.");
      set(rootHandleAtom, null);
    } else {
      // Try to access
      try {
        const it = (handle as any).entries();
        await it.next();
        set(folderErrorAtom, null);
        set(rootHandleAtom, handle);
      } catch (e) {
        set(folderErrorAtom, "Folder is missing or inaccessible. Video playback will not work.");
        set(rootHandleAtom, null);
      }
    }
  } catch (e) {
    set(folderErrorAtom, "Failed to verify folder access.");
    set(rootHandleAtom, null);
  }

  const storedData = await getIDBValue<CourseData>(
    `${DATA_STORAGE_KEY_PREFIX}${courseId}`
  );
  set(internalCourseDataAtom, storedData || EMPTY_COURSE_DATA);
});

// Migration logic to wrap single-course into multi-course & fix legacy IDs
export const performMigrationAtom = atom(null, async (_get, set) => {
  const courses = await db.courses.toArray();
  const legacyHandle = await getLegacyStoredHandle();

  let courseId = "default";

  // 1. Account Migration: Wrap legacy single-course into a proper course object
  if (courses.length === 0 && legacyHandle) {
    const legacyData = await getIDBValue<CourseData>("course_tracker_data");
    const legacyProgress = await getIDBValue<any>(STORAGE_KEY);
    if (legacyData) {
      let lastWatchedId = legacyProgress?.lastWatchedVideoId || null;
      if (lastWatchedId && !lastWatchedId.includes("::")) {
        lastWatchedId = `${courseId}::${lastWatchedId}`;
      }

      const courseMeta: CourseMeta = {
        id: courseId,
        name: legacyHandle.name || "Default Course",
        rootPath: legacyHandle.name || "",
        lastAccessed: Date.now(),
        lastWatchedVideoId: lastWatchedId,
      };

      await db.courses.put(courseMeta);
      await setStoredHandle(courseId, legacyHandle);
      await setIDBValue(`${DATA_STORAGE_KEY_PREFIX}${courseId}`, legacyData);

      set(activeCourseIdAtom, courseId);
      set(internalCourseDataAtom, legacyData);
    }
  }

  // 2. ID Migration: Fix legacy (unprefixed) video IDs in progress and bookmarks
  // We do this even if courses exist, in case the previous migration was incomplete.
  const legacyVideoCount = await db.videoProgress
    .filter((p) => !p.videoId.includes("::"))
    .count();
  const legacyBookmarkCount = await db.bookmarks
    .filter((b) => !b.videoId.includes("::"))
    .count();

  if (legacyVideoCount > 0 || legacyBookmarkCount > 0) {
    console.log(`Migrating ${legacyVideoCount} videos and ${legacyBookmarkCount} bookmarks...`);

    // 1. Video Progress
    const allProgress = await db.videoProgress.toArray();
    for (const prog of allProgress) {
      if (!prog.videoId.includes("::")) {
        await db.videoProgress.delete(prog.videoId);
        await db.videoProgress.put({
          ...prog,
          videoId: `${courseId}::${prog.videoId}`,
        });
      }
    }

    // 2. Bookmarks
    const allBookmarks = await db.bookmarks.toArray();
    for (const bm of allBookmarks) {
      if (!bm.videoId.includes("::")) {
        await db.bookmarks.put({
          ...bm,
          videoId: `${courseId}::${bm.videoId}`,
        });
      }
    }

    // 3. Last Watched in Course Meta
    const defaultCourse = await db.courses.get(courseId);
    if (defaultCourse && defaultCourse.lastWatchedVideoId && !defaultCourse.lastWatchedVideoId.includes("::")) {
      defaultCourse.lastWatchedVideoId = `${courseId}::${defaultCourse.lastWatchedVideoId}`;
      await db.courses.put(defaultCourse);
    }
  }
});

// --- Derived Settings Atoms ---

export const settingsAtom = atom(
  (get) => get(courseProgressStateAtom).settings,
  (get, set, newSettings: Partial<CourseProgressState["settings"]>) => {
    const prev = get(courseProgressStateAtom);
    if (prev?._isLoaded === false) return;
    set(courseProgressStateAtom, {
      ...prev,
      settings: { ...(prev?.settings || {}), ...newSettings },
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
  }

  await db.videoProgress.put({
    videoId,
    currentTime,
    duration,
    completed,
  });

  // Update last watched in course meta
  let courseId = "default";
  if (videoId.includes("::")) {
    [courseId] = videoId.split("::");
  }

  if (courseId) {
    const course = await db.courses.get(courseId);
    if (course) {
      course.lastWatchedVideoId = videoId;
      course.lastAccessed = Date.now();
      await db.courses.put(course);
    }
  }
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

// --- Last Watched Atom (Course Specific) ---
export const lastWatchedVideoIdAtom = atom(
  async (get) => {
    const courseId = get(activeCourseIdAtom);
    if (!courseId) return null;
    const course = await db.courses.get(courseId);
    return course?.lastWatchedVideoId || null;
  },
  async (get, _set, videoId: string | null) => {
    const courseId = get(activeCourseIdAtom);
    if (!courseId) return;

    const course = await db.courses.get(courseId);
    if (course) {
      course.lastWatchedVideoId = videoId;
      course.lastAccessed = Date.now();
      await db.courses.put(course);
    }
  }
);

// Clear progress goes to Dexie too
export const clearProgressAtom = atom(null, async (get, _set) => {
  const courseId = get(activeCourseIdAtom);
  if (!courseId) return;

  // Clear specific course progress?
  // For now, we'll follow the existing pattern of clearing everything if called.
  // But strictly, we should only clear videos starting with courseId::
  const allProgress = await db.videoProgress.toArray();
  const toDelete = allProgress
    .filter((p) => p.videoId.startsWith(`${courseId}::`) || !p.videoId.includes("::"))
    .map((p) => p.videoId);
  await db.videoProgress.bulkDelete(toDelete);

  const allBookmarks = await db.bookmarks.toArray();
  const bookmarksToDelete = allBookmarks
    .filter((b) => b.videoId.startsWith(`${courseId}::`) || !b.videoId.includes("::"))
    .map((b) => b.id);
  await db.bookmarks.bulkDelete(bookmarksToDelete);

  // Clear last watched
  const course = await db.courses.get(courseId);
  if (course) {
    course.lastWatchedVideoId = null;
    await db.courses.put(course);
  }
});

// Import progress logic updated
export const importProgressAtom = atom(
  null,
  async (get, set, jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === "object") {
        if (parsed.videos) {
          const videoArray = Object.entries(parsed.videos).map(
            ([id, val]: any) => ({
              videoId: id,
              ...val,
            })
          );
          await db.videoProgress.bulkPut(videoArray);
        }
        if (parsed.bookmarks) await db.bookmarks.bulkPut(parsed.bookmarks);
        if (parsed.dailyWatchLog)
          await db.dailyLogs.bulkPut(parsed.dailyWatchLog);

        if (parsed.courseData && Array.isArray(parsed.courseData)) {
          set(courseDataStateAtom, parsed.courseData);
        }

        const prev = get(courseProgressStateAtom);
        set(courseProgressStateAtom, {
          ...prev,
          activeCourseId: parsed.activeCourseId || prev.activeCourseId,
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
  }
);

