import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Modal,
  Backdrop,
  Fade,
  Paper,
  Divider,
  Stack,
} from "@mui/material";
import {
  Close as CloseIcon,
  Keyboard as KeyboardIcon,
} from "@mui/icons-material";

interface VideoShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const ShortcutRow = ({ keys, label }: { keys: string[]; label: string }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      py: 1,
    }}
  >
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Box sx={{ display: "flex", gap: 0.5 }}>
      {keys.map((k) => (
        <Paper
          key={k}
          sx={{
            px: 1,
            py: 0.3,
            fontSize: "0.75rem",
            fontWeight: "bold",
            bgcolor: "action.hover",
            border: 1,
            borderColor: "divider",
          }}
        >
          {k}
        </Paper>
      ))}
    </Box>
  </Box>
);

export const VideoShortcutsModal: React.FC<VideoShortcutsModalProps> = ({
  open,
  onClose,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
          sx: (theme) => ({
            backdropFilter: "blur(4px)",
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(0,0,0,0.8)"
                : "rgba(255,255,255,0.8)",
          }),
        },
      }}
    >
      <Fade in={open}>
        <Paper
          onKeyDown={(e) => {
            if (e.key === "/" || e.key === "?") {
              onClose();
            }
          }}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            boxShadow: 24,
            p: 4,
            borderRadius: 4,
            outline: "none",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <KeyboardIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Keyboard Shortcuts
              </Typography>
            </Box>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2, opacity: 0.1 }} />

          <Stack spacing={0.5}>
            <ShortcutRow label="Play / Pause" keys={["Space", "K"]} />
            <ShortcutRow label="Full Screen" keys={["F"]} />
            <ShortcutRow label="Mute / Unmute" keys={["M"]} />
            <ShortcutRow label="Add Bookmark" keys={["B"]} />
            <ShortcutRow label="Seek Forward 5s" keys={["→", "L"]} />
            <ShortcutRow label="Seek Backward 5s" keys={["←", "J"]} />
            <ShortcutRow label="Increase Volume" keys={["↑"]} />
            <ShortcutRow label="Decrease Volume" keys={["↓"]} />
            <ShortcutRow label="Next Video" keys={[".", ">"]} />
            <ShortcutRow label="Previous Video" keys={[",", "<"]} />
            <ShortcutRow label="Toggle Subtitles" keys={["C"]} />
            <ShortcutRow label="Speed Up" keys={["+"]} />
            <ShortcutRow label="Speed Down" keys={["-"]} />
            <ShortcutRow label="Show Shortcuts" keys={["?", "/"]} />
          </Stack>

          <Box
            sx={{
              mt: 3,
              pt: 2,
              borderTop: 1,
              borderColor: "divider",
              textAlign: "center",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Focus the video player to use these shortcuts
            </Typography>
          </Box>
        </Paper>
      </Fade>
    </Modal>
  );
};
