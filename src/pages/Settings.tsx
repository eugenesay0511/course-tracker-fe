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
  const { progress, setVideoRootPath, setCourseData, setRootHandle, exportProgress, importProgress } = useCourseProgress();
  const [rootPath, setRootPath] = useState(progress.settings.videoRootPath);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSavePath = (pathOverride?: string, newCourseData?: any[]) => {
    let pathToSave = pathOverride !== undefined ? pathOverride : rootPath.trim();
    
    // Remote surrounding quotes if pasted (e.g. "C:\Path" -> C:\Path)
    pathToSave = pathToSave.replace(/^["']|["']$/g, '');

    // Allow empty path ONLY if we are providing a new handle/data from scanning
    if (!pathToSave && !newCourseData) {
      setError("Please provide a path or use 'Select Folder'");
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

  const handleBrowseAndScan = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        // @ts-ignore
        const handle = await (window as any).showDirectoryPicker();
        if (handle) {
          const folderName = handle.name;
          
          // Try to reconstruct the path if the user has already typed something in
          const currentVal = rootPath.trim();
          let newPath = currentVal ? currentVal : folderName;
          
          if (currentVal) {
            // Remove existing quotes if any
            const strippedVal = currentVal.replace(/^["']|["']$/g, '');
            const lastSlash = Math.max(strippedVal.lastIndexOf('/'), strippedVal.lastIndexOf('\\'));
            if (lastSlash !== -1) {
              const baseDir = strippedVal.substring(0, lastSlash + 1);
              newPath = baseDir + folderName;
            }
          }
          
          // Store the handle for Vercel/Production mode
          setRootHandle(handle);
          
          const scannedData = await scanCourseDirectory(handle);
          setRootPath(newPath);
          handleSavePath(newPath, scannedData);
        }
      } else {
        alert("Your browser doesn't support directory scanning. Please update your path manually.");
      }
    } catch (err) {
      console.error("Directory picker error:", err);
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
          <Tooltip title="This is the folder where your course videos are stored.">
            <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Step 1 (Optional): Paste full path. Step 2: Click "Select Folder" and select the folder.
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
            helperText={error || "Tip: Providing the absolute path is optional, but helpful for local dev."}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained"
              onClick={handleBrowseAndScan}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Select Folder
            </Button>
          </Box>
        </Box>
        <Alert severity="info" sx={{ mt: 3, bgcolor: 'rgba(59, 130, 246, 0.05)', color: 'primary.light', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          For security reasons, you must manually <b>select the folder</b> to grant permission. Providing the <b>full absolute path</b> is optional but recommended.
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
