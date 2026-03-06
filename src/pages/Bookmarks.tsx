import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Divider,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  BookmarkBorder as BookmarkIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { courseDataStateAtom, removeBookmark } from "../store";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../utils/idb";
import { formatTime } from "../utils/formatters";

export const Bookmarks: React.FC = () => {
  const courseData = useAtomValue(courseDataStateAtom);
  const bookmarksArray = useLiveQuery(() => db.bookmarks.toArray(), []);
  const bookmarks = useMemo(() => bookmarksArray || [], [bookmarksArray]);
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");

  // Build a lookup: videoId → { title, chapterTitle }
  const videoLookup = useMemo(() => {
    const map = new Map<string, { title: string; chapterTitle: string }>();
    for (const chapter of courseData) {
      for (const video of chapter.videos) {
        map.set(video.id, { title: video.title, chapterTitle: chapter.title });
      }
    }
    return map;
  }, [courseData]);

  // Filter and group bookmarks by video
  const groupedBookmarks = useMemo(() => {
    const allBookmarks = bookmarks || [];
    const filtered = filter
      ? allBookmarks.filter(
          (b: any) =>
            b.note.toLowerCase().includes(filter.toLowerCase()) ||
            (videoLookup.get(b.videoId)?.title || "")
              .toLowerCase()
              .includes(filter.toLowerCase()),
        )
      : allBookmarks;

    const groups = new Map<
      string,
      {
        videoTitle: string;
        chapterTitle: string;
        items: typeof filtered;
      }
    >();

    for (const bm of filtered) {
      const info = videoLookup.get(bm.videoId) || {
        title: bm.videoId,
        chapterTitle: "",
      };
      if (!groups.has(bm.videoId)) {
        groups.set(bm.videoId, {
          videoTitle: info.title,
          chapterTitle: info.chapterTitle,
          items: [],
        });
      }
      groups.get(bm.videoId)!.items.push(bm);
    }

    // Sort items within each group by timestamp
    for (const group of groups.values()) {
      group.items.sort((a: any, b: any) => a.timestamp - b.timestamp);
    }

    return Array.from(groups.entries());
  }, [bookmarks, filter, videoLookup]);

  const totalBookmarks = bookmarks?.length || 0;

  return (
    <Box
      sx={{
        p: 4,
        maxWidth: 900,
        mx: "auto",
        height: "100%",
        overflowY: "auto",
        "&::-webkit-scrollbar": { width: "8px" },
        "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "action.hover",
          borderRadius: "10px",
          border: "2px solid transparent",
          backgroundClip: "content-box",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
        <BookmarkIcon sx={{ fontSize: 32, color: "primary.main" }} />
        <Typography
          variant="h4"
          fontWeight={900}
          sx={{
            letterSpacing: "-1.5px",
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "linear-gradient(90deg, #FFFFFF 0%, #CBD5E1 100%)"
                : "linear-gradient(90deg, #0F172A 0%, #64748B 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Bookmarks
        </Typography>
        <Chip
          label={`${totalBookmarks} total`}
          size="small"
          variant="outlined"
        />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Your saved timestamps and notes across all videos.
      </Typography>

      <TextField
        fullWidth
        size="small"
        placeholder="Filter bookmarks by note or video title..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      {groupedBookmarks.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            border: 1,
            borderColor: "divider",
            borderRadius: 3,
          }}
        >
          <BookmarkIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography variant="h6" color="text.secondary">
            {totalBookmarks === 0
              ? "No bookmarks yet"
              : "No bookmarks match your filter"}
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            {totalBookmarks === 0
              ? "Add bookmarks while watching videos using the bookmark button."
              : "Try a different search term."}
          </Typography>
        </Paper>
      ) : (
        groupedBookmarks.map(([videoId, group]) => (
          <Paper
            key={videoId}
            sx={{
              mb: 2,
              border: 1,
              borderColor: "divider",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: 2.5,
                py: 1.5,
                bgcolor: "action.hover",
                cursor: "pointer",
                "&:hover": { bgcolor: "action.selected" },
                transition: "background-color 0.2s",
              }}
              onClick={() =>
                navigate(`/course?v=${encodeURIComponent(videoId)}`)
              }
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                {group.chapterTitle}
              </Typography>
              <Typography variant="subtitle1" fontWeight={700}>
                {group.videoTitle}
              </Typography>
            </Box>
            <List dense disablePadding>
              {group.items.map((bm, bIdx) => (
                <React.Fragment key={bm.id}>
                  <ListItem
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                    onClick={() =>
                      navigate(
                        `/course?v=${encodeURIComponent(videoId)}&t=${bm.timestamp}`,
                      )
                    }
                  >
                    <Chip
                      label={formatTime(bm.timestamp)}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{
                        mr: 2,
                        minWidth: 56,
                        fontWeight: 700,
                        fontSize: "0.75rem",
                      }}
                    />
                    <ListItemText
                      primary={bm.note}
                      secondary={new Date(bm.createdAt).toLocaleDateString()}
                      primaryTypographyProps={{ fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                    <IconButton
                      size="small"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await removeBookmark(bm.id);
                      }}
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                  {bIdx < group.items.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        ))
      )}
    </Box>
  );
};
