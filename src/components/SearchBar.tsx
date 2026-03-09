import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Box,
  InputBase,
  IconButton,
  Tooltip,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Modal,
  Fade,
  Backdrop,
} from "@mui/material";
import {
  Search as SearchIcon,
  PlayCircleOutline as VideoIcon,
  FolderOpen as ChapterIcon,
  Bookmark as BookmarkIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { courseDataStateAtom } from "../store";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../utils/idb";
import { formatTime } from "../utils/formatters";

interface SearchResult {
  type: "video" | "chapter" | "bookmark";
  id: string;
  title: string;
  subtitle: string;
  navigateTo: string;
}

export const SearchBar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const courseData = useAtomValue(courseDataStateAtom);
  const bookmarksArray = useLiveQuery(() => db.bookmarks.toArray(), []);
  const bookmarks = useMemo(() => bookmarksArray || [], [bookmarksArray]);

  // Debounce search query by 200ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [open]);

  const results = useMemo((): SearchResult[] => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase();
    const out: SearchResult[] = [];

    // Search chapters
    for (const chapter of courseData) {
      if (chapter.title.toLowerCase().includes(q)) {
        out.push({
          type: "chapter",
          id: `ch-${chapter.id}`,
          title: chapter.title,
          subtitle: `${chapter.videos.length} videos`,
          navigateTo:
            chapter.videos.length > 0
              ? `/course?v=${encodeURIComponent(chapter.videos[0].id)}`
              : "/course",
        });
      }

      // Search videos
      for (const video of chapter.videos) {
        if (video.title.toLowerCase().includes(q)) {
          out.push({
            type: "video",
            id: `v-${video.id}`,
            title: video.title,
            subtitle: chapter.title,
            navigateTo: `/course?v=${encodeURIComponent(video.id)}`,
          });
        }
      }
    }

    // Search bookmarks
    for (const bm of bookmarks) {
      if (bm.note.toLowerCase().includes(q)) {
        // Find video title
        let videoTitle = bm.videoId;
        for (const ch of courseData) {
          const v = ch.videos.find((v) => v.id === bm.videoId);
          if (v) {
            videoTitle = v.title;
            break;
          }
        }
        out.push({
          type: "bookmark",
          id: `bm-${bm.id}`,
          title: bm.note,
          subtitle: `${videoTitle} at ${formatTime(bm.timestamp)}`,
          navigateTo: `/course?v=${encodeURIComponent(bm.videoId)}&t=${bm.timestamp}`,
        });
      }
    }

    return out.slice(0, 20);
  }, [debouncedQuery, courseData, bookmarks]);

  const getIcon = (type: string) => {
    switch (type) {
      case "chapter":
        return <ChapterIcon sx={{ color: "warning.main" }} />;
      case "bookmark":
        return <BookmarkIcon sx={{ color: "secondary.main" }} />;
      default:
        return <VideoIcon sx={{ color: "primary.main" }} />;
    }
  };

  const getChipLabel = (type: string) => {
    switch (type) {
      case "chapter":
        return "Chapter";
      case "bookmark":
        return "Bookmark";
      default:
        return "Video";
    }
  };

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    navigate(result.navigateTo);
  };

  return (
    <>
      <Tooltip title="Search (Ctrl+K)">
        <IconButton
          color="inherit"
          onClick={() => setOpen(true)}
          sx={{ ml: 1 }}
        >
          <SearchIcon />
        </IconButton>
      </Tooltip>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 200,
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
            elevation={0}
            sx={{
              position: "absolute",
              top: "15%",
              left: "50%",
              transform: "translateX(-50%)",
              width: { xs: "95%", sm: 600 },
              maxHeight: "70vh",
              borderRadius: 5,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
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
                  : "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              outline: "none",
            }}
          >
            {/* Search input */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                px: 3,
                py: 2.5,
                borderBottom: "1px solid",
                borderColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.05)",
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.02)"
                    : "rgba(0,0,0,0.01)",
              }}
            >
              <SearchIcon sx={{ mr: 2, color: "primary.main", fontSize: 24 }} />
              <InputBase
                inputRef={inputRef}
                fullWidth
                placeholder="Search videos, chapters, bookmarks..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                sx={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  "& input": { py: 0 },
                }}
              />
              <Chip
                label="ESC"
                size="small"
                variant="outlined"
                sx={{
                  ml: 2,
                  height: 24,
                  fontSize: "0.65rem",
                  fontWeight: 900,
                  borderRadius: 1.5,
                  cursor: "pointer",
                  bgcolor: "action.hover",
                  border: "1px solid",
                  borderColor: "divider",
                }}
                onClick={() => setOpen(false)}
              />
            </Box>

            {/* Results */}
            <Box
              sx={{
                overflowY: "auto",
                px: 1,
                py: 1,
                "&::-webkit-scrollbar": { width: "6px" },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                  borderRadius: "10px",
                },
              }}
            >
              {query.trim() && results.length === 0 && (
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <Typography
                    variant="body1"
                    sx={{ color: "text.secondary", fontWeight: 600 }}
                  >
                    No results for "{query}"
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.disabled", display: "block", mt: 1 }}
                  >
                    Try searching for different keywords
                  </Typography>
                </Box>
              )}

              {!query.trim() && (
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <SearchIcon
                    sx={{
                      fontSize: 48,
                      color: "action.disabled",
                      mb: 2,
                      opacity: 0.2,
                    }}
                  />
                  <Typography
                    variant="body1"
                    sx={{ color: "text.secondary", fontWeight: 600 }}
                  >
                    Find anything instantly
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.disabled", display: "block", mt: 0.5 }}
                  >
                    Search across videos, chapters, and your own bookmarks.
                  </Typography>
                </Box>
              )}

              {results.length > 0 && (
                <List dense disablePadding>
                  {results.map((r) => (
                    <ListItem
                      key={r.id}
                      sx={{
                        px: 2,
                        py: 2,
                        mb: 0.5,
                        cursor: "pointer",
                        borderRadius: 3,
                        transition: "all 0.2s ease",
                        border: "1px solid transparent",
                        "&:hover": {
                          bgcolor: "action.hover",
                          borderColor: "divider",
                          transform: "translateX(4px)",
                        },
                      }}
                      onClick={() => handleSelect(r)}
                    >
                      <ListItemIcon sx={{ minWidth: 48 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: (theme) =>
                              theme.palette.mode === "dark"
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(0,0,0,0.03)",
                          }}
                        >
                          {getIcon(r.type)}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={r.title}
                        secondary={r.subtitle}
                        primaryTypographyProps={{
                          fontWeight: 700,
                          noWrap: true,
                          variant: "body1",
                          sx: { color: "text.primary" },
                        }}
                        secondaryTypographyProps={{
                          variant: "caption",
                          noWrap: true,
                          sx: { fontWeight: 600, color: "text.secondary" },
                        }}
                      />
                      <Chip
                        label={getChipLabel(r.type).toUpperCase()}
                        size="small"
                        sx={{
                          ml: 2,
                          height: 20,
                          fontSize: "0.6rem",
                          fontWeight: 900,
                          letterSpacing: 0.5,
                          borderRadius: 1,
                          bgcolor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.05)"
                              : "rgba(0,0,0,0.05)",
                          color: "text.secondary",
                          border: "none",
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Paper>
        </Fade>
      </Modal>
    </>
  );
};
