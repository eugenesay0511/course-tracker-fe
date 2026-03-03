import React, { useEffect, useRef, useState } from 'react';
import { 
  Box, Typography, IconButton, Tooltip, Stack, 
  Modal, Backdrop, Fade, Paper, Divider 
} from '@mui/material';
import { 
  NavigateNext as NextIcon, 
  NavigateBefore as PrevIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Keyboard as KeyboardIcon
} from '@mui/icons-material';
import type { VideoProgress } from '../hooks/useCourseProgress';

interface VideoPlayerProps {
  videoId: string;
  videoSrc: string | null;
  subtitleSrc?: string | null;
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
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  // State ref to keep track of the most recent time sent to the hook, to throttle updates
  const lastUpdatedTimeRef = useRef<number>(0);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
        const savedProgress = getProgress(videoId);
        if (savedProgress && savedProgress.currentTime > 0) {
            const percent = savedProgress.currentTime / (savedProgress.duration || 1);
            if (percent < 0.99) {
                video.currentTime = savedProgress.currentTime;
            } else {
                video.currentTime = 0;
            }
        }
    }
  };

  useEffect(() => {
    // Auto-focus the video so keyboard shortcuts work immediately
    const video = videoRef.current;
    if (video) {
      video.focus();
    }
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const video = videoRef.current;
    if (!video) return;

    // Prevent scrolling with keys when interacting with video
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }

    const key = e.key.toLowerCase();
    
    switch (key) {
      case 'k':
        if (video.paused) video.play();
        else video.pause();
        break;
      case 'f':
        if (!document.fullscreenElement) {
          video.requestFullscreen().catch(err => {
            console.error(`Fullscreen error: ${err.message}`);
          });
        } else {
          document.exitFullscreen();
        }
        break;
      case 'm':
        video.muted = !video.muted;
        break;
      case 'l':
        video.currentTime = Math.min(video.duration, video.currentTime + 5);
        break;
      case 'j':
        video.currentTime = Math.max(0, video.currentTime - 5);
        break;
      case 'arrowup':
        video.volume = Math.min(1, video.volume + 0.1);
        break;
      case 'arrowdown':
        video.volume = Math.max(0, video.volume - 0.1);
        break;
      case ',':
      case '<':
        if (onPrevious && hasPrevious) onPrevious();
        break;
      case '.':
      case '>':
        if (onNext && hasNext) onNext();
        break;
      case '?':
      case '/':
        setShowShortcuts(true);
        break;
    }
  };

  const ShortcutRow = ({ keys, label }: { keys: string[], label: string }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {keys.map(k => (
          <Paper key={k} sx={{ 
            px: 1, py: 0.3, fontSize: '0.75rem', fontWeight: 'bold', 
            bgcolor: 'action.hover', border: 1, borderColor: 'divider' 
          }}>
            {k}
          </Paper>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.default', p: 3, borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, flexGrow: 1, mr: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {title}
          <Tooltip title="View Keyboard Shortcuts">
            <IconButton size="small" onClick={() => setShowShortcuts(true)} sx={{ color: 'text.secondary' }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Previous Video">
            <span>
              <IconButton 
                onClick={onPrevious} 
                disabled={!hasPrevious}
                sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}
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
                sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}
              >
                <NextIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Stack>
      <Box sx={{ flexGrow: 1, position: 'relative', bgcolor: 'black', borderRadius: 2, overflow: 'hidden', boxShadow: 3 }}>
        <video
          key={videoId}
          ref={videoRef}
          src={videoSrc || undefined}
          controls
          autoPlay
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          style={{ width: '100%', height: '100%', objectFit: 'contain', outline: 'none' }}
        >
          {vttUrl && <track kind="subtitles" src={vttUrl} srcLang="en" label="English" default />}
        </video>
      </Box>

      {/* Shortcuts Info Modal */}
      <Modal
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
            sx: (theme) => ({ backdropFilter: 'blur(4px)', bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)' })
          }
        }}
      >
        <Fade in={showShortcuts}>
          <Paper sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            boxShadow: 24,
            p: 4,
            borderRadius: 4,
            outline: 'none'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <KeyboardIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">Keyboard Shortcuts</Typography>
              </Box>
              <IconButton size="small" onClick={() => setShowShortcuts(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Divider sx={{ mb: 2, opacity: 0.1 }} />
            
            <Stack spacing={0.5}>
              <ShortcutRow label="Play / Pause" keys={['Space', 'K']} />
              <ShortcutRow label="Full Screen" keys={['F']} />
              <ShortcutRow label="Mute / Unmute" keys={['M']} />
              <ShortcutRow label="Seek Forward 5s" keys={['→', 'L']} />
              <ShortcutRow label="Seek Backward 5s" keys={['←', 'J']} />
              <ShortcutRow label="Increase Volume" keys={['↑']} />
              <ShortcutRow label="Decrease Volume" keys={['↓']} />
              <ShortcutRow label="Next Video" keys={['.', '>']} />
              <ShortcutRow label="Previous Video" keys={[',', '<']} />
              <ShortcutRow label="Show Shortcuts" keys={['?', '/']} />
            </Stack>
            
            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Focus the video player to use these shortcuts
              </Typography>
            </Box>
          </Paper>
        </Fade>
      </Modal>
    </Box>
  );
};
