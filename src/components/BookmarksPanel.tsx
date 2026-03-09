import {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Popover,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
} from "@mui/material";
import {
  BookmarkAdd as BookmarkAddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { ShortcutTooltip, shortcutTooltipProps } from "./video/ShortcutTooltip";
import type { Bookmark } from "../types";
import { formatTime } from "../utils/formatters";

interface BookmarksPanelProps {
  videoId: string;
  bookmarks: Bookmark[];
  getCurrentTime: () => number;
  onAddBookmark: (videoId: string, timestamp: number, note: string) => void;
  onRemoveBookmark: (bookmarkId: string) => void;
  onSeek: (timestamp: number) => void;
}

export interface BookmarksPanelHandle {
  triggerOpen: () => void;
}

export const BookmarksPanel = forwardRef<
  BookmarksPanelHandle,
  BookmarksPanelProps
>(
  (
    {
      videoId,
      bookmarks,
      getCurrentTime,
      onAddBookmark,
      onRemoveBookmark,
      onSeek,
    },
    ref,
  ) => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [note, setNote] = useState("");
    const [snapshotTime, setSnapshotTime] = useState(0);

    const open = Boolean(anchorEl);

    useEffect(() => {
      if (open) {
        // Use a small timeout to ensure the Popover has finished opening/mounting
        const timer = setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
        return () => clearTimeout(timer);
      }
    }, [open]);

    const videoBookmarks = bookmarks
      .filter((b) => b.videoId === videoId)
      .sort((a, b) => a.timestamp - b.timestamp);

    useImperativeHandle(ref, () => ({
      triggerOpen: () => {
        setSnapshotTime(getCurrentTime());
        setAnchorEl(buttonRef.current);
      },
    }));

    const handleAdd = () => {
      onAddBookmark(videoId, snapshotTime, note.trim() || "Bookmark");
      setNote("");
      setAnchorEl(null);
    };

    return (
      <>
        <Tooltip
          title={<ShortcutTooltip label="Add Bookmark" shortcut="B" />}
          {...shortcutTooltipProps}
        >
          <IconButton
            ref={buttonRef}
            onClick={(e) => {
              setSnapshotTime(getCurrentTime());
              setAnchorEl(e.currentTarget);
            }}
            color="primary"
            size="small"
          >
            <BookmarkAddIcon />
          </IconButton>
        </Tooltip>

        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          transformOrigin={{ vertical: "top", horizontal: "center" }}
          slotProps={{
            paper: {
              sx: {
                p: 2,
                width: 320,
                borderRadius: 3,
                boxShadow: (theme) =>
                  theme.palette.mode === "dark"
                    ? "0 12px 40px rgba(0,0,0,0.5)"
                    : "0 12px 40px rgba(148, 163, 184, 0.25)",
              },
            },
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            Bookmark at {formatTime(snapshotTime)}
          </Typography>
          <TextField
            inputRef={inputRef}
            fullWidth
            size="small"
            placeholder="Add a note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            sx={{ mb: 1.5 }}
          />
          <Button
            fullWidth
            variant="contained"
            size="small"
            onClick={handleAdd}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Save Bookmark
          </Button>

          {videoBookmarks.length > 0 && (
            <Box sx={{ mt: 2, maxHeight: 200, overflowY: "auto" }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  mb: 0.5,
                  display: "block",
                }}
              >
                Bookmarks in this video
              </Typography>
              <List dense disablePadding>
                {videoBookmarks.map((bm) => (
                  <ListItem
                    key={bm.id}
                    sx={{
                      borderRadius: 1,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" },
                      px: 1,
                    }}
                    onClick={() => onSeek(bm.timestamp)}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveBookmark(bm.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <Chip
                      label={formatTime(bm.timestamp)}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{
                        mr: 1,
                        minWidth: 52,
                        fontWeight: 600,
                        fontSize: "0.7rem",
                      }}
                    />
                    <ListItemText
                      primary={bm.note}
                      slotProps={{
                        primary: {
                          variant: "body2",
                          noWrap: true,
                          sx: { maxWidth: 150 },
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Popover>
      </>
    );
  },
);
