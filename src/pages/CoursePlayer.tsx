import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

import { CourseOutline } from '../components/CourseOutline';
import { VideoPlayer } from '../components/VideoPlayer';
import { useCourseProgress } from '../hooks/useCourseProgress';

export const CoursePlayer: React.FC = () => {
  const { 
    progress, 
    courseData, 
    rootHandle,
    updateVideoProgress, 
    getProgress, 
    markVideoUncompleted 
  } = useCourseProgress() as any;
  
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [resolvedVideoSrc, setResolvedVideoSrc] = useState<string>('');
  const [resolvedSubtitleSrc, setResolvedSubtitleSrc] = useState<string>('');

  const videoRootPath = progress.settings?.videoRootPath || '';

  // Initialize active video from last watched, or the first video of the course
  useEffect(() => {
    if (progress.lastWatchedVideoId) {
      setActiveVideoId(progress.lastWatchedVideoId);
    } else if (courseData.length > 0 && courseData[0].videos.length > 0) {
      setActiveVideoId(courseData[0].videos[0].id);
    }
  }, []);

  // Find active video object
  const activeVideo = React.useMemo(() => {
    for (const chapter of courseData) {
      const video = chapter.videos.find((v: any) => v.id === activeVideoId);
      if (video) return video;
    }
    return null;
  }, [activeVideoId, courseData]);

  // Resolve file paths to URLs (Blob URLs for Vercel, @fs for local)
  useEffect(() => {
    const resolveUrls = async () => {
      if (!activeVideo) {
        setResolvedVideoSrc('');
        setResolvedSubtitleSrc('');
        return;
      }

      // If we have a rootHandle (File System Access API), use it to create Blob URLs
      // This is required for Vercel/Production hosting
      if (rootHandle) {
        try {
          const resolveFile = async (path: string) => {
            const parts = path.split(/[/\\]/);
            let current = rootHandle;
            for (let i = 0; i < parts.length - 1; i++) {
              current = await current.getDirectoryHandle(parts[i]);
            }
            const fileHandle = await current.getFileHandle(parts[parts.length - 1]);
            const file = await fileHandle.getFile();
            return URL.createObjectURL(file);
          };

          const vUrl = await resolveFile(activeVideo.path);
          setResolvedVideoSrc(vUrl);

          if (activeVideo.srtPath) {
            const sUrl = await resolveFile(activeVideo.srtPath);
            setResolvedSubtitleSrc(sUrl);
          } else {
            setResolvedSubtitleSrc('');
          }
          
          return () => {
             URL.revokeObjectURL(vUrl);
          };
        } catch (err) {
          console.error("Failed to resolve file handles:", err);
          // Fallback to @fs if handle resolution fails
          setResolvedVideoSrc(`/@fs/${videoRootPath}/${activeVideo.path}`);
          setResolvedSubtitleSrc(activeVideo.srtPath ? `/@fs/${videoRootPath}/${activeVideo.srtPath}` : '');
        }
      } else {
        // Localhost dev mode fallback
        setResolvedVideoSrc(`/@fs/${videoRootPath}/${activeVideo.path}`);
        setResolvedSubtitleSrc(activeVideo.srtPath ? `/@fs/${videoRootPath}/${activeVideo.srtPath}` : '');
      }
    };

    resolveUrls();
  }, [activeVideo, rootHandle, videoRootPath]);

  const handleVideoSelect = React.useCallback((v: any) => {
    setActiveVideoId(v.id);
  }, []);

  // Flattened video list for sequential navigation
  const allVideos = React.useMemo(() => {
    return courseData.flatMap((chapter: any) => chapter.videos);
  }, [courseData]);

  const currentIndex = allVideos.findIndex((v: any) => v.id === activeVideoId);
  const nextVideo = currentIndex !== -1 && currentIndex < allVideos.length - 1 ? allVideos[currentIndex + 1] : null;
  const prevVideo = currentIndex > 0 ? allVideos[currentIndex - 1] : null;

  const handleNext = () => nextVideo && setActiveVideoId(nextVideo.id);
  const handlePrevious = () => prevVideo && setActiveVideoId(prevVideo.id);

  return (
    <Box sx={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
        <Box sx={{ width: '350px', flexShrink: 0, borderRight: '1px solid #1f2937' }}>
            <CourseOutline 
                data={courseData} 
                activeVideoId={activeVideoId} 
                onVideoSelect={handleVideoSelect} 
                getProgress={getProgress}
                markVideoUncompleted={markVideoUncompleted}
            />
        </Box>
        
        <Box sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {activeVideoId && activeVideo ? (
                <VideoPlayer 
                    videoId={activeVideoId} 
                    videoSrc={resolvedVideoSrc} 
                    subtitleSrc={resolvedSubtitleSrc}
                    title={activeVideo.title} 
                    updateVideoProgress={updateVideoProgress}
                    getProgress={getProgress}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    hasNext={!!nextVideo}
                    hasPrevious={!!prevVideo}
                />
            ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="h6" color="text.secondary">Select a video to start learning</Typography>
                </Box>
            )}
        </Box>
    </Box>
  );
};
