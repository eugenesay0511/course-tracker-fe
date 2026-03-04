import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import staticCourseData from "../data/course-data.json";
import { getStoredHandle, setStoredHandle } from "../utils/idb";

export interface VideoProgress {
  currentTime: number;
  duration: number;
  completed: boolean;
}

export interface CourseProgressState {
  lastWatchedVideoId: string | null;
  videos: Record<string, VideoProgress>;
  settings: {
    videoRootPath: string;
    autoplay: boolean;
  };
}

interface CourseProgressContextType {
  progress: CourseProgressState;
  courseData: any[];
  rootHandle: FileSystemDirectoryHandle | null;
  permissionStatus: PermissionState | null;
  updateVideoProgress: (
    videoId: string,
    currentTime: number,
    duration: number,
  ) => void;
  markVideoCompleted: (videoId: string) => void;
  markVideoUncompleted: (videoId: string) => void;
  setVideoRootPath: (path: string) => void;
  setAutoplay: (autoplay: boolean) => void;
  setCourseData: (data: any[]) => void;
  setRootHandle: (handle: FileSystemDirectoryHandle | null) => void;
  requestPermission: () => Promise<boolean>;
  exportProgress: () => void;
  importProgress: (jsonString: string) => boolean;
  clearProgress: () => void;
  getProgress: (videoId: string) => VideoProgress | undefined;
}

const CourseProgressContext = createContext<
  CourseProgressContextType | undefined
>(undefined);

const STORAGE_KEY = "typescript_course_progress";
const DATA_STORAGE_KEY = "typescript_course_data";
const DEFAULT_ROOT_PATH = "";

const loadProgress = (): CourseProgressState => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (!parsed.settings) {
        parsed.settings = {
          videoRootPath: DEFAULT_ROOT_PATH,
          autoplay: false,
        };
      }
      if (parsed.settings.autoplay === undefined) {
        parsed.settings.autoplay = false;
      }
      return {
        lastWatchedVideoId: parsed.lastWatchedVideoId || null,
        videos: parsed.videos || {},
        settings: parsed.settings,
      };
    }
  } catch (e) {
    console.error("Failed to load progress from localStorage", e);
  }
  return {
    lastWatchedVideoId: null,
    videos: {},
    settings: {
      videoRootPath: DEFAULT_ROOT_PATH,
      autoplay: false,
    },
  };
};

const loadCourseData = (): any[] => {
  try {
    const data = localStorage.getItem(DATA_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }

    // Check if it was saved in the old key (legacy support)
    const oldProgressData = localStorage.getItem(STORAGE_KEY);
    if (oldProgressData) {
      const parsedOld = JSON.parse(oldProgressData);
      if (
        parsedOld.courseData &&
        Array.isArray(parsedOld.courseData) &&
        parsedOld.courseData.length > 0
      ) {
        localStorage.setItem(
          DATA_STORAGE_KEY,
          JSON.stringify(parsedOld.courseData),
        );
        return parsedOld.courseData;
      }
    }
  } catch (e) {
    console.error("Failed to load course data from localStorage", e);
  }
  return staticCourseData;
};

export const CourseProgressProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [progress, setProgress] = useState<CourseProgressState>(loadProgress);
  const [courseData, setCourseDataState] = useState<any[]>(loadCourseData);
  const [rootHandle, setRootHandleState] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionState | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(courseData));
  }, [courseData]);

  // Load handle from IndexedDB on mount
  useEffect(() => {
    const initHandle = async () => {
      const handle = await getStoredHandle();
      if (handle) {
        setRootHandleState(handle);
        // Check permission status
        // @ts-ignore
        const status = await handle.queryPermission({ mode: "read" });
        setPermissionStatus(status);
      }
    };
    initHandle();
  }, []);

  const updateVideoProgress = useCallback(
    (videoId: string, currentTime: number, duration: number) => {
      setProgress((prev) => {
        const prevVideo = prev.videos[videoId] || {
          currentTime: 0,
          duration: 0,
          completed: false,
        };
        const completed =
          prevVideo.completed ||
          (duration > 0 && currentTime / duration > 0.95);

        return {
          ...prev,
          lastWatchedVideoId: videoId,
          videos: {
            ...prev.videos,
            [videoId]: { currentTime, duration, completed },
          },
        };
      });
    },
    [],
  );

  const markVideoCompleted = useCallback((videoId: string) => {
    setProgress((prev) => ({
      ...prev,
      videos: {
        ...prev.videos,
        [videoId]: {
          ...(prev.videos[videoId] || { currentTime: 0, duration: 0 }),
          completed: true,
        },
      },
    }));
  }, []);

  const markVideoUncompleted = useCallback((videoId: string) => {
    setProgress((prev) => ({
      ...prev,
      videos: {
        ...prev.videos,
        [videoId]: {
          ...(prev.videos[videoId] || {
            currentTime: 0,
            duration: 0,
            completed: false,
          }),
          completed: false,
        },
      },
    }));
  }, []);

  const setVideoRootPath = useCallback((path: string) => {
    setProgress((prev) => ({
      ...prev,
      settings: { ...prev.settings, videoRootPath: path },
    }));
  }, []);

  const setAutoplay = useCallback((autoplay: boolean) => {
    setProgress((prev) => ({
      ...prev,
      settings: { ...prev.settings, autoplay },
    }));
  }, []);

  const setCourseData = useCallback((data: any[]) => {
    setCourseDataState(data);
  }, []);

  const setRootHandle = useCallback(
    (handle: FileSystemDirectoryHandle | null) => {
      setRootHandleState(handle);
      if (handle) {
        setStoredHandle(handle).catch((err) =>
          console.error("Failed to store handle in IDB:", err),
        );
        setPermissionStatus("granted");
      } else {
        // Clear persistence if handle is cleared (e.g. error or reset)
        // Note: We don't have a clearStoredHandle but it could be added
      }
    },
    [],
  );

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!rootHandle) return false;
    try {
      // @ts-ignore
      const status = await rootHandle.requestPermission({ mode: "read" });
      setPermissionStatus(status);
      return status === "granted";
    } catch (err) {
      console.error("Failed to request permission:", err);
      return false;
    }
  }, [rootHandle]);

  const exportProgress = useCallback(() => {
    const dataToExport = { ...progress, courseData };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", "course_progress.json");
    linkElement.click();
  }, [progress, courseData]);

  const importProgress = useCallback(
    (jsonString: string) => {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed && typeof parsed === "object" && parsed.videos) {
          setProgress({
            lastWatchedVideoId: parsed.lastWatchedVideoId || null,
            videos: parsed.videos || {},
            settings: { ...progress.settings, ...(parsed.settings || {}) },
          });
          if (parsed.courseData && Array.isArray(parsed.courseData)) {
            setCourseDataState(parsed.courseData);
          }
          return true;
        }
      } catch (e) {
        console.error("Failed to import progress", e);
      }
      return false;
    },
    [progress.settings],
  );

  const clearProgress = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      lastWatchedVideoId: null,
      videos: {},
    }));
  }, []);

  const getProgress = useCallback(
    (videoId: string): VideoProgress | undefined => {
      return progress.videos[videoId];
    },
    [progress.videos],
  );

  const value = {
    progress,
    courseData,
    rootHandle,
    permissionStatus,
    updateVideoProgress,
    markVideoCompleted,
    markVideoUncompleted,
    setVideoRootPath,
    setAutoplay,
    setCourseData,
    setRootHandle,
    requestPermission,
    exportProgress,
    importProgress,
    clearProgress,
    getProgress,
  };

  return (
    <CourseProgressContext.Provider value={value}>
      {children}
    </CourseProgressContext.Provider>
  );
};

export const useCourseProgress = () => {
  const context = useContext(CourseProgressContext);
  if (context === undefined) {
    throw new Error(
      "useCourseProgress must be used within a CourseProgressProvider",
    );
  }
  return context;
};
