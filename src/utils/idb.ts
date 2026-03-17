import Dexie, { type Table } from "dexie";
import type { VideoProgress, Bookmark, DailyWatchLog, CourseMeta } from "../types";

const DB_NAME = "CourseTrackerDB";
const HANDLE_KEY_PREFIX = "rootFolderHandle_";

class CourseTrackerDatabase extends Dexie {
  handles!: Table<FileSystemDirectoryHandle, string>;
  state!: Table<any, string>;
  videoProgress!: Table<VideoProgress, string>;
  bookmarks!: Table<Bookmark, string>;
  dailyLogs!: Table<DailyWatchLog, string>;
  courses!: Table<CourseMeta, string>;

  constructor() {
    super(DB_NAME);
    // Use empty strings to signify out-of-line keys, matching the existing schema
    this.version(2).stores({
      handles: "",
      state: "",
    });

    this.version(3)
      .stores({
        videoProgress: "videoId",
        bookmarks: "id, videoId, timestamp",
        dailyLogs: "date",
      })
      .upgrade(async (tx) => {
        const oldState = await tx.table("state").get("course_tracker_progress");
        if (oldState) {
          if (oldState.videos) {
            const videoEntries = Object.entries(oldState.videos).map(
              ([videoId, prog]: any) => ({
                videoId,
                currentTime: prog.currentTime,
                duration: prog.duration,
                completed: prog.completed,
              }),
            );
            await tx.table("videoProgress").bulkPut(videoEntries);
          }
          if (oldState.bookmarks?.length) {
            await tx.table("bookmarks").bulkPut(oldState.bookmarks);
          }
          if (oldState.dailyWatchLog?.length) {
            await tx.table("dailyLogs").bulkPut(oldState.dailyWatchLog);
          }
          delete oldState.videos;
          delete oldState.bookmarks;
          delete oldState.dailyWatchLog;
          await tx.table("state").put(oldState, "course_tracker_progress");
        }
      });

    this.version(4).stores({
      courses: "id, lastAccessed",
    });
  }
}

export const db = new CourseTrackerDatabase();

export const setStoredHandle = async (
  courseId: string,
  handle: FileSystemDirectoryHandle,
): Promise<void> => {
  await db.handles.put(handle, `${HANDLE_KEY_PREFIX}${courseId}`);
};

export const getStoredHandle = async (
  courseId: string,
): Promise<FileSystemDirectoryHandle | null> => {
  const handle = await db.handles.get(`${HANDLE_KEY_PREFIX}${courseId}`);
  return handle || null;
};

// Legacy support for migration
export const getLegacyStoredHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
  const handle = await db.handles.get("rootFolderHandle");
  return handle || null;
};

export const setIDBValue = async (key: string, value: any): Promise<void> => {
  await db.state.put(value, key);
};

export const getIDBValue = async <T>(key: string): Promise<T | null> => {
  const value = await db.state.get(key);
  return value !== undefined ? (value as T) : null;
};

export const removeIDBValue = async (key: string): Promise<void> => {
  await db.state.delete(key);
};

