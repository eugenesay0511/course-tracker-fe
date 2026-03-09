import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
} from "@mui/material";
import {
  Download as ExportIcon,
  Upload as ImportIcon,
  DeleteForever as DeleteIcon,
  Storage as StorageIcon,
} from "@mui/icons-material";

interface DataStorageSettingsProps {
  exportProgress: () => void;
  importProgress: (jsonString: string) => Promise<boolean>;
  clearProgress: () => void;
  setSnackbarOpen: (open: boolean) => void;
  setError: (error: string | null) => void;
}

export const DataStorageSettings: React.FC<DataStorageSettingsProps> = ({
  exportProgress,
  importProgress,
  clearProgress,
  setSnackbarOpen,
  setError,
}) => {
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        const res = await importProgress(content);
        if (res) {
          setSnackbarOpen(true);
        } else {
          setError("Failed to import. Invalid file format.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearProgress = () => {
    clearProgress();
    setConfirmClearOpen(false);
    setSnackbarOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <StorageIcon color="primary" />
        <Typography variant="h6" fontWeight="bold">
          Data & Storage
        </Typography>
      </Box>
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 3,
          bgcolor: "background.default",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              Backup Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Export or import your learning data.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={exportProgress}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Export
            </Button>
            <Button
              size="small"
              variant="outlined"
              component="label"
              startIcon={<ImportIcon />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Import
              <input
                type="file"
                hidden
                accept=".json"
                onChange={handleImport}
              />
            </Button>
          </Box>
        </Box>

        <Divider />

        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(239, 68, 68, 0.04)"
                : "rgba(239, 68, 68, 0.02)",
          }}
        >
          <Box>
            <Typography variant="subtitle2" color="error" fontWeight="bold">
              Delete Data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Permanently clear all watch history.
            </Typography>
          </Box>
          <Button
            size="small"
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setConfirmClearOpen(true)}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none",
            }}
          >
            Clear
          </Button>
        </Box>
      </Paper>

      <Dialog
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ color: "error.main", fontWeight: "bold" }}>
          Clear All Progress?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently reset all your video progress, watched time,
            and completed status. Your course location and settings will remain.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setConfirmClearOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleClearProgress}
            color="error"
            variant="contained"
            sx={{ borderRadius: 2, boxShadow: "none" }}
          >
            Clear Everything
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
