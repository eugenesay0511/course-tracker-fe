export interface CourseMeta {
  id: string;
  name: string;
  rootPath: string;
  lastAccessed: number;
  lastWatchedVideoId?: string | null;
  color?: string;
}

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
  videoId: string;
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
  activeCourseId: string | null;
  settings: Settings;
  _isLoaded?: boolean;
}

