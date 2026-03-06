# Big Brain Implementation Plan

This document outlines the plan to build a React and MUI frontend wrapper to track and play local videos from the "Udemy - Understanding TypeScript (2026-1)" folder.

## Goal Description

The goal is to create a dynamic, aesthetically pleasing React + MUI web application that acts as a local course dashboard. It will display all chapters and videos, allow the user to play them, automatically track their watch progress (time and completion status), and remember the last viewed video so they can pick up right where they left off.

Because web browsers cannot read arbitrary local folders directly, the solution involves:

1. **A Data Generator**: A short Node.js script to index all chapters and MP4 files into a structured `course-data.json`.
2. **A Vite React App**: The frontend application.
3. **Local File Serving**: Configuring Vite's dev server to serve the external video directory under a specific route (e.g., `/@videos/`) to bypass browser security blocks on `file://` URLs.

## User Review Required

> [!IMPORTANT]
> The app will be created in a new folder `c:\Users\YJ\Desktop\Typescript Course\course-tracker`. Are you okay with this location?

> [!NOTE]
> To track progress locally without a backend database, all progress (timestamps, completed videos, last watched) will be saved in your browser's `localStorage`. This means the progress is tied to the browser you use to open the app.

## Proposed Changes

### Setup and Configuration

- **Initialize Vite App**: `npx create-vite@latest course-tracker --template react-ts`
- **Dependencies**: Install MUI (`@mui/material @emotion/react @emotion/styled @mui/x-charts`), Icons (`@mui/icons-material`), and `react-router-dom`.

#### [NEW] `c:\Users\YJ\Desktop\Typescript Course\course-tracker\scripts\generate-data.js`

A Node.js script using `fs` to recursively read the "Udemy - Understanding TypeScript (2026-1)" folder, filter for `.mp4` and `.srt` files, group them by chapter folders, and output a `src/data/course-data.json`.

#### [NEW] `c:\Users\YJ\Desktop\Typescript Course\course-tracker\vite.config.ts`

Modify the Vite configuration to include a custom middleware or static serving rule that maps requests like `http://localhost:5173/videos/...` to the physical local path `c:\Users\YJ\Desktop\Typescript Course\Udemy - Understanding TypeScript (2026-1)`.

### Frontend Components

#### [MODIFY] `src/App.tsx`

Refactored to host a `BrowserRouter`. Creates a permanent layout shell (Top AppBar and persistent Left Navigation Drawer) that routes between:

- `/` - The Dashboard view.
- `/course` - The actual Video Player and Course Outline.

#### [NEW] `src/pages/Dashboard.tsx`

A new analytics page utilizing `@mui/x-charts`. It will read the `progress` state from LocalStorage and calculate:

- **Overall Progress**: A pie chart showing Completed Videos vs Remaining Videos.
- **Top Chapters**: A bar chart or list showing progress per chapter.
- **Resume Action**: A prominent button directly linking to `/course` to resume the `lastWatchedVideoId`.

#### [NEW] `src/theme.ts`

A custom MUI theme defining a premium, dark-mode aesthetic with vibrant accent colors (e.g., deep purples or blues).

#### [NEW] `src/hooks/useCourseProgress.ts`

A custom React hook that wraps `localStorage` to manage:

- Last played video ID.
- Playback time for each video (triggers every few seconds of playtime).
- Completion status (marked as done if `currentTime / duration > 0.95`).
- Manual unmark functionality for completed videos.

#### [NEW] `src/components/VideoPlayer.tsx`

A wrapper around the HTML5 `<video>` element that automatically seeks to the saved `currentTime` on load, updates the custom hook on `timeupdate`, and injects dynamically generated WebVTT `<track>` elements for subtitles.

#### [NEW] `src/components/CourseOutline.tsx`

A collapsible accordion list (MUI `Accordion`) showing chapters and videos, with dynamic checkmarks indicating completion.

## Verification Plan

### Automated Tests

- N/A for this localized tracking dashboard. Verification will rely on manual testing of the tracking logic.

### Manual Verification

1. Run `node scripts/generate-data.js` and verify `course-data.json` accurately reflects the folders and videos.
2. Run `npm run dev` and open the app in the browser.
3. Validate that the Vite server correctly streams the video files from the external directory without CORS/Security errors.
4. Play a video, pause it, refresh the page -> It should resume from the exact paused time.
5. Scrub near the end of a video -> The video should mark itself as "completed" in the sidebar.
