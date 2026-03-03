import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Alert,
  IconButton,
  Tooltip,
  Snackbar
} from '@mui/material';
import { 
  Download as ExportIcon, 
  Upload as ImportIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import { useCourseProgress } from '../hooks/useCourseProgress';
import { scanCourseDirectory } from '../utils/scanner';

export const Settings: React.FC = () => {
  const { progress, setVideoRootPath, setCourseData, exportProgress, importProgress } = useCourseProgress();
  const [rootPath, setRootPath] = useState(progress.settings.videoRootPath);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSavePath = (pathOverride?: string, newCourseData?: any[]) => {
    const pathToSave = pathOverride !== undefined ? pathOverride : rootPath.trim();
    if (!pathToSave) {
      setError("Path cannot be empty");
      return;
    }
    setVideoRootPath(pathToSave);
    if (newCourseData) {
        setCourseData(newCourseData);
    }
    setSnackbarOpen(true);
    setError(null);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (importProgress(content)) {
          setSnackbarOpen(true);
        } else {
          setError("Failed to import. Invalid file format.");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Configure your course paths and manage your learning data.
      </Typography>

      <Paper sx={{ p: 3, mb: 4, border: '1px solid #1f2937' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          <Typography variant="h6">Course Location</Typography>
          <Tooltip title="This is the absolute path to your video files on your computer.">
            <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Point this to the folder containing your chapters (e.g., "C:/Courses/My-Full-Course").
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder="C:/Path/To/Your/Course"
            value={rootPath}
            onChange={(e) => setRootPath(e.target.value)}
            error={!!error}
            helperText={error || "Note: Browser security might only show the folder name. Please ensure the full absolute path is correct."}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              onClick={async () => {
                try {
                  if ('showDirectoryPicker' in window) {
                    // @ts-ignore
                    const handle = await (window as any).showDirectoryPicker();
                    if (handle) {
                      const folderName = handle.name;
                      const currentVal = rootPath || "";
                      const lastSlash = Math.max(currentVal.lastIndexOf('/'), currentVal.lastIndexOf('\\'));
                      let newPath = folderName;
                      if (lastSlash !== -1) {
                          const baseDir = currentVal.substring(0, lastSlash + 1);
                          newPath = baseDir + folderName;
                      }
                      
                      const scannedData = await scanCourseDirectory(handle);
                      setRootPath(newPath);
                      handleSavePath(newPath, scannedData); // Auto-save with scanned data
                    }
                  } else {
                    alert("Your browser doesn't support directory scanning. Please update your path manually.");
                  }
                } catch (err) {
                  console.error("Directory picker error:", err);
                }
              }}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Browse & Scan
            </Button>
          </Box>
        </Box>
        <Alert severity="info" sx={{ mt: 3, bgcolor: 'rgba(59, 130, 246, 0.05)', color: 'primary.light', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          Note: If the path is outside the project root, set `strict: false` in `vite.config.ts`.
        </Alert>
      </Paper>

      <Paper sx={{ p: 3, border: '1px solid #1f2937' }}>
        <Typography variant="h6" gutterBottom>Data Management</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Export your progress to back it up or move it to another computer.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<ExportIcon />}
            onClick={exportProgress}
          >
            Export Progress (.json)
          </Button>
          
          <Button 
            variant="outlined" 
            component="label"
            startIcon={<ImportIcon />}
          >
            Import Progress
            <input
              type="file"
              hidden
              accept=".json"
              onChange={handleImport}
            />
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SuccessIcon color="secondary" />
            <span>Action completed successfully!</span>
          </Box>
        }
      />
    </Box>
  );
};
