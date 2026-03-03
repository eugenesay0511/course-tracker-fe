# TypeScript Course Tracker

A local React + MUI dashboard built to track your progress through the "Understanding TypeScript" Udemy course videos.

## Features

- Dynamic Folder Scanning: Index your course directory directly from the browser using the File System Access API.
- Modern MUI Dark Mode aesthetic with a responsive sidebar and video player.
- LocalStorage persistence to remember exactly how far you've watched in any video.
- Auto-resume the last watched video on load.
- Visual checkmarks to indicate when a video has been watched (> 95%).

## Prerequisites

- Node.js (v18+)
- Local copy of the course materials in the parent directory (`Udemy - Understanding TypeScript (2026-1)`).

## Setup

1. **Index Your Course:**
   Open the **Settings** page in the app and click **Browse & Scan**. Select your course folder to automatically index all chapters, videos, and subtitles.

2. **Install Dependencies:**
   If you haven't already:

```bash
npm install
```

3. **Run the Development Server:**

```bash
npm run dev
```

Open `http://localhost:5173` to view the dashboard!
The Vite dev server is configured to securely serve the `/Udemy - Understanding TypeScript (2026-1)` folder so your videos will stream perfectly in the browser.
