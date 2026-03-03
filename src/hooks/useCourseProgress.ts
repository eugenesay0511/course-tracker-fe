import { useState, useEffect, useCallback } from 'react';
import staticCourseData from '../data/course-data.json';

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
  };
}

const STORAGE_KEY = 'typescript_course_progress';
const DATA_STORAGE_KEY = 'typescript_course_data';
const DEFAULT_ROOT_PATH = 'c:/Users/YJ/Desktop/Typescript Course/Udemy - Understanding TypeScript (2026-1)';

const loadProgress = (): CourseProgressState => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (!parsed.settings) {
        parsed.settings = { videoRootPath: DEFAULT_ROOT_PATH };
      } else if (!parsed.settings.videoRootPath) {
        parsed.settings.videoRootPath = DEFAULT_ROOT_PATH;
      }
      return {
        lastWatchedVideoId: parsed.lastWatchedVideoId || null,
        videos: parsed.videos || {},
        settings: parsed.settings
      };
    }
  } catch (e) {
    console.error('Failed to load progress from localStorage', e);
  }
  return { 
    lastWatchedVideoId: null, 
    videos: {}, 
    settings: { videoRootPath: DEFAULT_ROOT_PATH }
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
       if (parsedOld.courseData && Array.isArray(parsedOld.courseData) && parsedOld.courseData.length > 0) {
           // Save it to new key right away
           localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(parsedOld.courseData));
           return parsedOld.courseData;
       }
    }
  } catch (e) {
    console.error('Failed to load course data from localStorage', e);
  }
  return staticCourseData;
};

export function useCourseProgress() {
  const [progress, setProgress] = useState<CourseProgressState>(loadProgress);
  const [courseData, setCourseDataState] = useState<any[]>(loadCourseData);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(courseData));
  }, [courseData]);

  const updateVideoProgress = useCallback((videoId: string, currentTime: number, duration: number) => {
    setProgress(prev => {
      const prevVideo = prev.videos[videoId] || { currentTime: 0, duration: 0, completed: false };
      
      const completed = prevVideo.completed || (duration > 0 && currentTime / duration > 0.95);

      return {
        ...prev,
        lastWatchedVideoId: videoId,
        videos: {
          ...prev.videos,
          [videoId]: {
            currentTime,
            duration,
            completed
          }
        }
      };
    });
  }, []);

  const markVideoCompleted = useCallback((videoId: string) => {
    setProgress(prev => ({
      ...prev,
      videos: {
        ...prev.videos,
        [videoId]: {
          ...(prev.videos[videoId] || { currentTime: 0, duration: 0 }),
          completed: true
        }
      }
    }));
  }, []);

  const markVideoUncompleted = useCallback((videoId: string) => {
    setProgress(prev => {
      const currentVideo = prev.videos[videoId] || { currentTime: 0, duration: 0, completed: false };
      return {
        ...prev,
        videos: {
          ...prev.videos,
          [videoId]: {
            ...currentVideo,
            completed: false
          }
        }
      }
    });
  }, []);

  const setVideoRootPath = useCallback((path: string) => {
    setProgress(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        videoRootPath: path
      }
    }));
  }, []);

  const setCourseData = useCallback((data: any[]) => {
    setCourseDataState(data);
  }, []);

  const exportProgress = useCallback(() => {
    // Merge progress and courseData for export to maintain backward compatibility
    const dataToExport = {
      ...progress,
      courseData: courseData
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'course_progress.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [progress, courseData]);

  const importProgress = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object' && parsed.videos) {
        // Merge settings from current progress if not in imported data
        const mergedSettings = {
          ...progress.settings,
          ...(parsed.settings || {})
        };
        
        setProgress({
          lastWatchedVideoId: parsed.lastWatchedVideoId || null,
          videos: parsed.videos || {},
          settings: mergedSettings
        });
        
        if (parsed.courseData && Array.isArray(parsed.courseData)) {
            setCourseDataState(parsed.courseData);
        }
        
        return true;
      }
    } catch (e) {
      console.error('Failed to import progress', e);
    }
    return false;
  }, [progress.settings]);

  const getProgress = useCallback((videoId: string): VideoProgress | undefined => {
    return progress.videos[videoId];
  }, [progress.videos]);

  return {
    progress,
    courseData,
    updateVideoProgress,
    markVideoCompleted,
    markVideoUncompleted,
    setVideoRootPath,
    setCourseData,
    exportProgress,
    importProgress,
    getProgress
  };
}
