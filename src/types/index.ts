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

export interface Settings {
  videoRootPath: string;
  autoplay: boolean;
  outlinePosition: "left" | "right";
}

export interface CourseProgressState {
  lastWatchedVideoId: string | null;
  videos: Record<string, VideoProgress>;
  settings: Settings;
}
