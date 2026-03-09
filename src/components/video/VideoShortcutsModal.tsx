import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Modal,
  Backdrop,
  Fade,
  Paper,
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
      py: 1.25,
      px: 1,
      borderRadius: 2,
      transition: "background-color 0.2s ease",
      "&:hover": {
        bgcolor: "action.hover",
      },
    }}
  >
    <Typography
      variant="body2"
      sx={{ fontWeight: 600, color: "text.secondary" }}
    >
      {label}
    </Typography>
    <Box sx={{ display: "flex", gap: 0.75 }}>
      {keys.map((k) => (
        <Paper
          key={k}
          elevation={0}
          sx={{
            px: 1,
            py: 0.5,
            minWidth: 24,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "0.7rem",
            fontWeight: "800",
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.05)",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1.5,
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 2px 0 rgba(255,255,255,0.1)"
                : "0 2px 0 rgba(0,0,0,0.1)",
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
            backdropFilter: "blur(8px)",
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(0,0,0,0.8)"
                : "rgba(255,255,255,0.7)",
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
            width: { xs: "90%", sm: 450 },
            maxHeight: "90vh",
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(30, 41, 59, 0.95)"
                : "#ffffff",
            backdropFilter: "blur(20px)",
            border: "1px solid",
            borderColor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 25px 50px -12px rgba(0, 0, 0, 0.8)"
                : "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
            borderRadius: 5,
            outline: "none",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              p: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid",
              borderColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.05)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <KeyboardIcon color="primary" sx={{ fontSize: 24 }} />
              <Typography
                variant="h6"
                fontWeight="900"
                sx={{ letterSpacing: "-0.5px" }}
              >
                Keyboard Shortcuts
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                bgcolor: "action.hover",
                "&:hover": { bgcolor: "action.selected" },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ p: 2, overflowY: "auto", flexGrow: 1 }}>
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
          </Box>

          <Box
            sx={{
              p: 3,
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.02)"
                  : "rgba(0,0,0,0.01)",
              borderTop: "1px solid",
              borderColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.05)",
              textAlign: "center",
              borderBottomLeftRadius: "inherit",
              borderBottomRightRadius: "inherit",
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontWeight: 600 }}
            >
              💡 Focus the video player to use these shortcuts
            </Typography>
          </Box>
        </Paper>
      </Fade>
    </Modal>
  );
};
