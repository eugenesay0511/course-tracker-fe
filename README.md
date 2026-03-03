# Course Tracker

A comprehensive, local-first web application built with React, Vite, and Material UI to track your progress through video course materials right from your browser. It scans local folders for video files (`.mp4`) and subtitle files (`.srt`), builds an interactive course outline, and automatically tracks where you left off.

## 🚀 Features

- **Local File Scanning**: Point the app to a local folder and it automatically builds a course curriculum from subfolders (Chapters) and video files. No uploads required!
- **State Persistence**: The app remembers exactly where you paused each video.
- **Smart Completion**: Videos are automatically marked as completed when you reach 95% of the total duration.
- **Seamless Navigation**: Navigate between sequential videos, even across different chapters.
- **Data Export & Import**: Backup your learning progress as a JSON file, and restore it on another machine.
- **Vercel / Cloud Ready**: Fully functional when hosted on platforms like Vercel, bypassing browser security blocks by dynamically requesting permission to read your local files.

## 🧠 How It Works (Project Logic)

### 1. Directory Scanning (`src/utils/scanner.ts`)

The application uses the modern [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) (`window.showDirectoryPicker()`) to securely ask the user for permission to read a folder.
When a folder is selected, the scanner recursively crawls through the subdirectories. It groups `.mp4` files into "Chapters" based on their parent folder name, and attaches `.srt` subtitle files if they share the same base name.

### 2. Global State Management (`src/context/CourseProgressContext.tsx`)

The app uses React Context to hold its global state, allowing all components to access the user's data without "prop drilling". The state includes:

- **`courseData`**: The generated nested array of Chapters and Videos.
- **`progress`**: A dictionary tracking the `currentTime`, `duration`, and `completed` status of every video ID.
- **`rootHandle`**: The browser's active security permission object (`FileSystemDirectoryHandle`) that allows reading the course folder.

### 3. Data Persistence (`localStorage` & `IndexedDB`)

To ensure you never lose your progress when you close the tab:

- **Watch Progress**: The `progress` and `courseData` objects are serialized into standard strings and saved in `localStorage`.
- **Security Permissions**: The browser's `rootHandle` is a complex object that cannot be saved as text. Instead, it is saved in **IndexedDB** (`src/utils/idb.ts`), a powerful browser-native database.

### 4. Local File Playback (`src/pages/CoursePlayer.tsx`)

Running a website on the internet (like Vercel) while trying to play a video file on your `C:/` drive is usually blocked by strict browser security rules (CORS / Mixed Content).
To solve this:

- When you select a folder, the App gets a `FileSystemDirectoryHandle`.
- The `CoursePlayer` uses this handle to locate the specific `.mp4` file and creates a **Temporary Web URL** (`blob:http://...`) using `URL.createObjectURL(file)`. This creates a secure sandbox link the `<video>` tag can legally play.
- **The "Restore Access" Catch**: For security, browsers wipe file permissions when you refresh the page. However, because we saved the handle in IndexedDB, the app remembers the folder. It will show a "Restore Access" overlay. When the user clicks the button, the app asks the browser to renew the permission with a single click, instantly unlocking the videos again.

_(Fallback)_: If running on a local Vite server (`npm run dev`), the app can fallback to requesting files directly through Vite's `/@fs/C:/...` proxy structure.

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
   - Open `http://localhost:5173`.
   - Navigate to the **Settings** page.
   - Click **Save & Scan** and select the root directory of your video course on your computer.
   - Go to the **Course Player** and start learning!

## 📦 Tech Stack

- React 19
- React Router DOM v7
- Vite
- Material UI (MUI) v7
- File System Access API
- IndexedDB
