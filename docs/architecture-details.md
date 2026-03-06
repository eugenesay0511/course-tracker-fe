# State Management Architecture: Jotai & Dexie Integration

This document outlines the dual-layer state management system used in the project, explaining the roles of **Jotai** (Atomic State) and **Dexie** (IndexedDB Persistence).

---

## 🏗️ The Hybrid Architecture

To ensure high performance and data persistence, the application splits state into two categories: **Reactive UI Configuration** and **High-Frequency/Large Scale Data**.

### 1. Jotai (Atomic UI State)

Jotai is used for data that needs to trigger immediate React re-renders across the application.

- **Atoms used:**
  - `courseProgressStateAtom`: Stores global settings like `autoplay`, `playbackSpeed`, and `dailyGoalMinutes`.
  - `courseDataStateAtom`: Holds the current course structure (chapters, videos).
  - `lastWatchedVideoIdAtom`: A persistent atom that tracks the ID of the most recently viewed video, used by the Dashboard for its "Resume" feature.
  - `themeModeAtom`: Manages "dark" vs "light" mode.
  - `rootHandleAtom`: Stores the File System Access API directory handle (non-serializable).
- **Storage Bridge:** We use `atomWithStorage` with a custom IndexedDB adapter (`createIDBStorage`). This ensures that even "simple" atoms are persisted across sessions without using the limited `localStorage`.

### 2. Dexie (High-Performance Persistence)

Dexie provides a structured IndexedDB wrapper for "heavy" data that changes frequently or grows large.

- **Database Schema:**
  - `videoProgress`: Tracks `currentTime` and `completed` status for every video. Updates every few seconds during playback.
  - `bookmarks`: Stores user-created notes tied to specific timestamps.
  - `dailyLogs`: Tracks watch time per day to calculate "Study Streaks".
  - `handles`: A dedicated table for persisting File System handles.
  - `state`: A general-purpose key-value table used as a backend for Jotai atoms.

---

## ⚡ Why This Approach?

### Performance (The "Write-Heavy" Problem)

If we stored every video's `currentTime` inside a large Jotai object, every time the video timer ticked (e.g., every 5 seconds), the **entire object** would have to be serialized and rewritten to storage. In a 50-chapter course, this would be a massive performance bottleneck.

With **Dexie**, we perform a "targeted write":

```typescript
// Only updates one specific row in one specific table.
// Very fast, doesn't block the UI.
await db.videoProgress.put({ videoId, currentTime, duration, completed });
```

### Reactivity

While Dexie is great for storage, it isn't "reactive" by default in React. **Jotai** provides the reactive layer so components like the `Sidebar` or `ProgressBar` can automatically update when settings change without manual polling.

### Asset Handling & Prefetching

To ensure a "zero-lag" experience when switching videos:

- **LRU Blob Cache**: `CoursePlayer` maintains a Least Recently Used (LRU) cache of `URL.createObjectURL` references, limiting memory usage to the last 20 videos and preventing memory leaks via `URL.revokeObjectURL`.
- **Background Prefetching**: When a video is playing, the application proactively resolves and caches the File System handles for the "Next" and "Previous" videos in the background.

---

## 🛠️ Implementation Details

### File Locations

- **`src/store/index.ts`**: Contains all Jotai atoms and derived state logic.
- **`src/utils/idb.ts`**: Contains the Dexie database class definition, schema versions, and migration logic.
- **`src/pages/CoursePlayer.tsx`**: Orchestrates video resolution, prefetching, and state synchronization.

### Data Flow Example

1.  **User plays video**: `VideoPlayer` calls `updateVideoProgress()`.
2.  **Dexie Write**: The timestamp is saved directly to the `videoProgress` table (throttled to 1s).
3.  **State Sync**: `CoursePlayer` updates the `lastWatchedVideoIdAtom`. This persists the change to IndexedDB immediately, ensuring the Dashboard's "Resume" button is always accurate.
4.  **UI Analytics**: The Dashboard uses a Dexie `useLiveQuery` to calculate overall course progress and time watched without blocking the main thread.
