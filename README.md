# WatchFlow

A comprehensive, local-first web application built with React 19, Vite, and Material UI to track your progress through video course materials right from your browser. It scans local folders for video files (`.mp4`) and subtitle files (`.srt`), builds an interactive course outline, and automatically tracks your learning journey.

## 🚀 Features

- **Local File Scanning**: Point the app to a local folder via the File System Access API. It automatically builds a course curriculum from subfolders (Chapters) and video files. No uploads required!
- **Rich Dashboard**: Visualize your progress with interactive charts, track total learning time, and quickly resume your last watched video.
- **Study Streaks**: Set a daily watching goal and build your learning streak. The app tracking consecutive days you've reached your target.
- **Bookmarks & Notes**: Save specific timestamps with notes while watching. Easily search and jump back to key moments from the Bookmarks page.
- **Smart Completion**: Videos are automatically marked as completed when you reach 95% of the total duration.
- **Customizable Experience**: Toggle between Light and Dark modes, and choose your preferred Course Outline position (Left or Right).
- **Settings Dialog**: Manage your course path, study goals, and data export/import through a polished, compact preferences window.
- **Data Export & Import**: Backup your learning progress as a JSON file (with automatic date/time stamps), and restore it on another machine.
- **Performance Optimized**: Built with atomic state management to ensure smooth video playback and zero UI jank.

## 🧠 How It Works (Project Logic)

### 1. Directory Scanning (`src/utils/scanner.ts`)

The application uses the modern [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) (`window.showDirectoryPicker()`) to securely ask the user for permission to read a folder.
When a folder is selected, the scanner recursively crawls through the subdirectories. It groups `.mp4` files into "Chapters" based on their parent folder name, and attaches `.srt` subtitle files if they share the same base name.

### 2. Atomic State Management (`src/store/index.ts`)

The app uses **Jotai** for global state management. Unlike traditional context providers, Jotai uses an "atomic" approach where state is broken down into small, independent pieces (atoms):

- **`courseDataAtom`**: The generated nested array of Chapters and Videos.
- **`progressAtom`**: A dictionary tracking the `currentTime`, `duration`, `completed` status, `bookmarks`, and `dailyWatchLog`.
- **`rootHandleAtom`**: The browser's active security permission object (`FileSystemDirectoryHandle`).
- **`themeModeAtom`**: Manages Light/Dark mode transitions purely through atomic state.

This ensures that high-frequency updates (like the video progress updating every second) do not trigger unnecessary re-renders in unrelated components like the Sidebar or Navigation bar.

### 3. Data Persistence (`localStorage` & `IndexedDB`)

To ensure you never lose your progress when you close the tab:

- **Watch Progress, Settings & Theme**: Utilizing Jotai's `atomWithStorage`, these objects are automatically serialized and saved in `localStorage`.
- **Security Permissions**: The browser's `rootHandle` is saved in **IndexedDB** (`src/utils/idb.ts`) via a dedicated initializer on app mount. This allows the app to remember and restore the folder across sessions.

### 4. Local File Playback (`src/pages/CoursePlayer.tsx`)

Playing local files from a web context is usually blocked by security rules. WatchFlow solves this:

- **Blob URLs**: When you select a folder, the App gets a `FileSystemDirectoryHandle`. The `CoursePlayer` uses this to create **Temporary Web URLs** (`blob:http://...`) using `URL.createObjectURL(file)`.
- **Permission Restoration**: Browsers wipe file permissions on refresh. WatchFlow detects this and shows a "Restore Access" overlay, allowing you to re-grant permission with a single click.
- **Prefetching**: The player automatically prefetches the next and previous video blobs for instant, gapless navigation.

## 🛠️ Setup & Installation

### Prerequisites

- Node.js (v18+)
- A local folder containing your video course materials.

### Getting Started

1. **Clone and Install**

```bash
npm install
```

2. **Run Development Server**

```bash
npm run dev
```

3. **Configure Your Course**
   - Open the app in your browser.
   - Click the **Settings icon** (cogwheel) in the top-right header.
   - Click **Browse** and select the root directory of your video course.
   - Set your **Daily Study Goal** to start tracking your streak.

## 📦 Tech Stack

- **React 19**: Modern UI development.
- **Vite**: Ultra-fast build tool and dev server.
- **Material UI (MUI) v6**: Premium, responsive component library.
- **Jotai**: Fine-grained atomic state management.
- **MUI X Charts**: Interactive progress visualization.
- **Vidstack**: High-performance video player framework.
- **File System Access API**: Secure local file interaction.
- **IndexedDB**: Persistent storage for file handles.
