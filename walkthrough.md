# Course Tracker Walkthrough

The development of the Typescript Course Video Tracking frontend has been successfully completed. Here is a review of what was accomplished and how you can run it.

## Changes Made

- **Initialized Vite React Project**: A new project named `course-tracker` was created inside your `TypeScript Course` folder.
- **Data Generator Script**: Wrote `scripts/generate-data.js` to automatically scan your Udemy folder for MP4 videos and chapter directories. It maps 25 chapters and 302 videos.
- **Premium Dark Theme**: Applied a custom Material UI (`@mui`) theme highlighting deep purples and high legibility layouts suitable for modern dashboards.
- **Local Video Streaming Support**: Configured `vite.config.ts` so that your private local video files can be securely played natively in the browser without raising security errors.
- **LocalStorage State Hook**: Added automatic syncing logic `useCourseProgress` that:
  - Tracks the exact playback second of any playing video.
  - Remembers the last video you watched.
  - Visually marks videos as "completed" with a green check mark in the sidebar if you watch past 95%.
  - Added a toggle button in the sidebar (circle icon / checkmark) so you can manually mark a video as watched or un-watched.
- **Subtitle Support**: The application now dynamically reads `.srt` subtitle files, parses them into WebVTT format on the fly, and automatically displays them in the video player without requiring pre-conversion tools.
- **Learning Dashboard**: A new landing page powered by `react-router-dom` and `@mui/x-charts`. It features:
  - An overall pie chart visually summarizing your completed vs. remaining videos.
  - A comprehensive chapter breakdown panel with custom progress bars dynamically visualizing your watch status per chapter.
  - A "Jump Back In" card that extracts your exact last watched video's details and acts as a quick-start shortcut.
  - An updated header navigation system in the top `AppBar` to seamlessly switch between the Dashboard and the Course Player, providing more room for course content.

## Validation

- **TypeScript Strict Compilation**: Verified that the final source code builds successfully (`tsc -b`) with 0 errors.
- **Dependency Checks**: Ensured all MUI components install without issue.
- **File System Tests**: Checked that the local generator script accurately scraped the "Udemy - Understanding TypeScript (2026-1)" folder structure into `course-data.json`.

## How to use

I have started the development server for you in the background!
You can view your application by opening your browser to: **[http://localhost:5173/](http://localhost:5173/)**

If you ever need to restart the application, you can navigate to `desktop/Typescript Course/course-tracker` and run `npm run dev`.
