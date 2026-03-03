import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, IconButton, Tooltip, Stack } from '@mui/material';
import { NavigateNext as NextIcon, NavigateBefore as PrevIcon } from '@mui/icons-material';
import type { VideoProgress } from '../hooks/useCourseProgress';

interface VideoPlayerProps {
  videoId: string;
  videoSrc: string;
  subtitleSrc?: string;
  title: string;
  updateVideoProgress: (videoId: string, currentTime: number, duration: number) => void;
  getProgress: (videoId: string) => VideoProgress | undefined;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoId, 
  videoSrc, 
  subtitleSrc, 
  title, 
  updateVideoProgress, 
  getProgress,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [vttUrl, setVttUrl] = useState<string | null>(null);
  
  // State ref to keep track of the most recent time sent to the hook, to throttle updates
  const lastUpdatedTimeRef = useRef<number>(0);

  useEffect(() => {
    // When the videoId changes, reset the video and attempt to jump to the saved time
    const video = videoRef.current;
    if (video) {
      const savedProgress = getProgress(videoId);
      if (savedProgress && savedProgress.currentTime > 0) {
        // Only jump if we have a saved time. Sometimes we might want to start from 0 if completed.
        // Let's start from 0 if it's > 99% done.
        const percent = savedProgress.currentTime / (savedProgress.duration || 1);
        if (percent < 0.99) {
           video.currentTime = savedProgress.currentTime;
        } else {
           video.currentTime = 0;
        }
      } else {
        video.currentTime = 0;
      }
      video.play().catch(e => console.log('Autoplay blocked:', e));
    }
    // We do NOT want getProgress in the dependency array to avoid infinite loop when progress updates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  useEffect(() => {
    if (!subtitleSrc) {
      setVttUrl(null);
      return;
    }

    // Fetch the SRT file and convert to VTT URL
    fetch(subtitleSrc)
      .then(res => res.text())
      .then(srtText => {
        // Convert SRT to VTT (replace commas with periods in timestamps)
        const vttText = "WEBVTT\n\n" + srtText.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
        const blob = new Blob([vttText], { type: 'text/vtt' });
        const url = URL.createObjectURL(blob);
        setVttUrl(url);
      })
      .catch(err => console.error("Failed to load subtitles:", err));

    return () => {
      // Cleanup previous blob URL
      setVttUrl((oldUrl: string | null) => {
         if (oldUrl) URL.revokeObjectURL(oldUrl);
         return null;
      });
    };
  }, [subtitleSrc]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
        // Throttle updates to every ~1 second to prevent excessive React re-renders and localStorage writes
        if (Math.abs(video.currentTime - lastUpdatedTimeRef.current) > 1) {
            lastUpdatedTimeRef.current = video.currentTime;
            updateVideoProgress(videoId, video.currentTime, video.duration);
        }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.default', p: 3, borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, flexGrow: 1, mr: 2 }}>{title}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Previous Video">
            <span>
              <IconButton 
                onClick={onPrevious} 
                disabled={!hasPrevious}
                sx={{ bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                <PrevIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Next Video">
            <span>
              <IconButton 
                onClick={onNext} 
                disabled={!hasNext}
                sx={{ bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                <NextIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Stack>
      <Box sx={{ flexGrow: 1, position: 'relative', bgcolor: 'black', borderRadius: 2, overflow: 'hidden', boxShadow: 3 }}>
        <video
          ref={videoRef}
          src={videoSrc}
          controls
          autoPlay
          onTimeUpdate={handleTimeUpdate}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        >
          {vttUrl && <track kind="subtitles" src={vttUrl} srcLang="en" label="English" default />}
        </video>
      </Box>
    </Box>
  );
};
