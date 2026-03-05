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
  Divider,
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
import { courseDataStateAtom, bookmarksAtom } from "../store";
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
  const bookmarks = useAtomValue(bookmarksAtom);

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
            sx: { backdropFilter: "blur(4px)", bgcolor: "rgba(0,0,0,0.5)" },
          },
        }}
      >
        <Fade in={open}>
          <Paper
            sx={{
              position: "absolute",
              top: "15%",
              left: "50%",
              transform: "translateX(-50%)",
              width: { xs: "90%", sm: 560 },
              maxHeight: "60vh",
              borderRadius: 3,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
          >
            {/* Search input */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                px: 2,
                py: 1,
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
              <InputBase
                inputRef={inputRef}
                fullWidth
                placeholder="Search videos, chapters, bookmarks..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                sx={{
                  fontSize: "1rem",
                  "& input": { py: 1 },
                }}
              />
              <Chip
                label="ESC"
                size="small"
                variant="outlined"
                sx={{
                  ml: 1,
                  height: 24,
                  fontSize: "0.65rem",
                  cursor: "pointer",
                }}
                onClick={() => setOpen(false)}
              />
            </Box>

            {/* Results */}
            <Box
              sx={{
                overflowY: "auto",
                maxHeight: "calc(60vh - 56px)",
                "&::-webkit-scrollbar": { width: "6px" },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "action.hover",
                  borderRadius: "6px",
                },
              }}
            >
              {query.trim() && results.length === 0 && (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    No results for "{query}"
                  </Typography>
                </Box>
              )}

              {!query.trim() && (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    Start typing to search...
                  </Typography>
                </Box>
              )}

              {results.length > 0 && (
                <List dense disablePadding>
                  {results.map((r, idx) => (
                    <React.Fragment key={r.id}>
                      <ListItem
                        sx={{
                          px: 2,
                          py: 1.5,
                          cursor: "pointer",
                          "&:hover": { bgcolor: "action.hover" },
                          transition: "background-color 0.15s",
                        }}
                        onClick={() => handleSelect(r)}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {getIcon(r.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={r.title}
                          secondary={r.subtitle}
                          primaryTypographyProps={{
                            fontWeight: 600,
                            noWrap: true,
                            variant: "body2",
                          }}
                          secondaryTypographyProps={{
                            variant: "caption",
                            noWrap: true,
                          }}
                        />
                        <Chip
                          label={getChipLabel(r.type)}
                          size="small"
                          variant="outlined"
                          sx={{
                            ml: 1,
                            height: 22,
                            fontSize: "0.65rem",
                            fontWeight: 600,
                          }}
                        />
                      </ListItem>
                      {idx < results.length - 1 && <Divider />}
                    </React.Fragment>
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
