export interface Video {
  id: string;
  title: string;
  filename: string;
  path: string;
  srtPath?: string | null;
}

export interface Chapter {
  id: string;
  title: string;
  videos: Video[];
}

export type CourseData = Chapter[];

export interface VideoProgress {
  currentTime: number;
  duration: number;
  completed: boolean;
}

export interface Bookmark {
  id: string;
  videoId: string;
  timestamp: number;
  note: string;
  createdAt: number;
}

export interface DailyWatchLog {
  date: string; // "YYYY-MM-DD"
  watchedSeconds: number;
}

export interface Settings {
  videoRootPath: string;
  autoplay: boolean;
  outlinePosition: "left" | "right";
  dailyGoalMinutes: number;
  playbackSpeed: number;
}

export interface CourseProgressState {
  lastWatchedVideoId: string | null;
  videos: Record<string, VideoProgress>;
  settings: Settings;
  bookmarks: Bookmark[];
  dailyWatchLog: DailyWatchLog[];
}
