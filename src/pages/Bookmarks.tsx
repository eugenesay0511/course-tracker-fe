import React, { useMemo, useState, useEffect, useRef } from "react";
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
  alpha,
  useTheme,
  Stack,
  Fade,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import {
  DeleteOutline as DeleteIcon,
  SearchRounded as SearchIcon,
  BookmarkRounded as BookmarkIcon,
  PlayArrowRounded as PlayIcon,
  OndemandVideoRounded as VideoIcon,
  ExpandMoreRounded as ExpandMoreIcon,
  UnfoldMoreRounded as ExpandAllIcon,
  UnfoldLessRounded as CollapseAllIcon,
  ViewListRounded as ListViewIcon,
  VideoLibraryRounded as GroupViewIcon,
  EditOutlined as EditIcon,
  CheckRounded as CheckIcon,
  CloseRounded as CloseIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import {
  courseDataStateAtom,
  removeBookmark,
  updateBookmark,
  activeCourseIdAtom,
} from "../store";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../utils/idb";
import { formatTime } from "../utils/formatters";

type SortMode = "grouped" | "recent";

export const Bookmarks: React.FC = () => {
  const theme = useTheme();
  const courseData = useAtomValue(courseDataStateAtom);
  const activeCourseId = useAtomValue(activeCourseIdAtom);

  const bookmarksArray = useLiveQuery(async () => {
    if (!activeCourseId) return [];
    // Only return bookmarks that belong to the active course
    // or are legacy bookmarks (no '::' in videoId) if we are in the default course
    const all = await db.bookmarks.toArray();
    return all.filter(
      (b) =>
        b.videoId.startsWith(`${activeCourseId}::`) ||
        (activeCourseId === "default" && !b.videoId.includes("::")),
    );
  }, [activeCourseId]);

  const bookmarks = useMemo(() => bookmarksArray || [], [bookmarksArray]);
  const navigate = useNavigate();

  const [filter, setFilter] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("grouped");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Note Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

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

  // Base filtered array of bookmarks
  const filteredBookmarks = useMemo(() => {
    const allBookmarks = bookmarks || [];
    if (!filter) return allBookmarks;

    return allBookmarks.filter(
      (b: any) =>
        b.note.toLowerCase().includes(filter.toLowerCase()) ||
        (videoLookup.get(b.videoId)?.title || "")
          .toLowerCase()
          .includes(filter.toLowerCase()),
    );
  }, [bookmarks, filter, videoLookup]);

  // Grouped Sort Mode Data
  const groupedBookmarks = useMemo(() => {
    const groups = new Map<
      string,
      {
        videoTitle: string;
        chapterTitle: string;
        items: typeof filteredBookmarks;
      }
    >();

    for (const bm of filteredBookmarks) {
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
  }, [filteredBookmarks, videoLookup]);

  // Recent Sort Mode Data
  const recentBookmarks = useMemo(() => {
    return [...filteredBookmarks].sort(
      (a: any, b: any) => b.createdAt - a.createdAt,
    );
  }, [filteredBookmarks]);

  // Handle accordion toggle (for Grouped view)
  const handleAccordionChange =
    (videoId: string) =>
    (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded((prev) => ({ ...prev, [videoId]: isExpanded }));
    };

  // Calculate if all sections are currently expanded
  const isAllExpanded = useMemo(() => {
    if (groupedBookmarks.length === 0) return false;
    return groupedBookmarks.every(([videoId]) => !!expanded[videoId]);
  }, [groupedBookmarks, expanded]);

  // Toggle all sections
  const handleToggleAll = () => {
    if (isAllExpanded) {
      setExpanded({});
    } else {
      const allExpanded = groupedBookmarks.reduce(
        (acc, [videoId]) => ({ ...acc, [videoId]: true }),
        {},
      );
      setExpanded(allExpanded);
    }
  };

  // Automatically expand all sections when the user filters/searches
  useEffect(() => {
    if (filter && sortMode === "grouped") {
      const allExpanded = groupedBookmarks.reduce(
        (acc, [videoId]) => ({ ...acc, [videoId]: true }),
        {},
      );
      setExpanded(allExpanded);
    }
  }, [filter, groupedBookmarks.length, sortMode]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const handleStartEdit = (bm: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(bm.id);
    setEditNote(bm.note);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditNote("");
  };

  const handleSaveEdit = async (
    bmId: string,
    e?: React.MouseEvent | React.KeyboardEvent,
  ) => {
    if (e) e.stopPropagation();
    if (editNote.trim()) {
      await updateBookmark({ bookmarkId: bmId, note: editNote.trim() });
    }
    setEditingId(null);
    setEditNote("");
  };

  const totalBookmarks = bookmarks?.length || 0;

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        maxWidth: 1000,
        mx: "auto",
        height: "100%",
        overflowY: "auto",
        "&::-webkit-scrollbar": { width: "8px" },
        "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: alpha(theme.palette.text.primary, 0.1),
          borderRadius: "10px",
          border: "2px solid transparent",
          backgroundClip: "content-box",
          "&:hover": {
            backgroundColor: alpha(theme.palette.text.primary, 0.2),
          },
        },
      }}
    >
      {/* Header Banner */}
      <Box
        sx={{
          mb: 4,
          p: 4,
          borderRadius: 4,
          background:
            theme.palette.mode === "dark"
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(
                  theme.palette.background.paper,
                  0.4,
                )} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.2)} 0%, ${alpha(
                  theme.palette.background.paper,
                  0.8,
                )} 100%)`,
          backdropFilter: "blur(12px)",
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 3,
          position: "relative",
          overflow: "hidden",
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.05)}`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -60,
            right: -40,
            width: 250,
            height: 250,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${alpha(
              theme.palette.primary.main,
              0.2,
            )} 0%, transparent 70%)`,
            pointerEvents: "none",
            filter: "blur(20px)",
          }}
        />
        <Stack spacing={1.5} zIndex={1}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                display: "flex",
                p: 1.5,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                color: "primary.main",
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <BookmarkIcon fontSize="medium" />
            </Box>
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{
                letterSpacing: "-0.5px",
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(90deg, #FFFFFF 0%, #A0AAB4 100%)"
                    : "linear-gradient(90deg, #111827 0%, #374151 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              My Bookmarks
            </Typography>
          </Box>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 500, lineHeight: 1.6 }}
          >
            Your saved timestamps, insights, and quick links across all learning
            materials.
          </Typography>
        </Stack>
        <Chip
          label={`${totalBookmarks} Saved Note${totalBookmarks === 1 ? "" : "s"}`}
          color="primary"
          variant={theme.palette.mode === "dark" ? "outlined" : "filled"}
          sx={{
            fontWeight: 700,
            px: 1,
            py: 0.5,
            borderRadius: 2,
            borderWidth: theme.palette.mode === "dark" ? 1 : 0,
            zIndex: 1,
            boxShadow:
              theme.palette.mode === "light"
                ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`
                : "none",
          }}
        />
      </Box>

      {/* Controls Bar */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 4,
          alignItems: "center",
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <TextField
          placeholder="Search your notes or filter by video title..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              bgcolor: "background.paper",
              transition: "all 0.2s ease",
              boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
              "&:hover": {
                boxShadow: `0 6px 16px ${alpha(theme.palette.common.black, 0.08)}`,
                borderColor: alpha(theme.palette.primary.main, 0.5),
              },
              "&.Mui-focused": {
                boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.15)}`,
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        <Stack
          direction="row"
          spacing={2}
          sx={{
            width: { xs: "100%", sm: "auto" },
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          {sortMode === "grouped" && groupedBookmarks.length > 0 && (
            <Button
              variant="outlined"
              startIcon={
                isAllExpanded ? <CollapseAllIcon /> : <ExpandAllIcon />
              }
              onClick={handleToggleAll}
              sx={{
                borderRadius: 3,
                whiteSpace: "nowrap",
                height: 48,
                minWidth: 140,
                px: 3,
                borderColor: alpha(theme.palette.divider, 0.8),
                color: "text.primary",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              {isAllExpanded ? "Collapse All" : "Expand All"}
            </Button>
          )}

          <ToggleButtonGroup
            value={sortMode}
            exclusive
            onChange={(_, newMode) => newMode && setSortMode(newMode)}
            size="medium"
            sx={{
              bgcolor: "background.paper",
              boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
              "& .MuiToggleButton-root": {
                border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                color: "text.secondary",
                px: 2,
                "&.Mui-selected": {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: "primary.main",
                  fontWeight: 700,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                  },
                },
              },
            }}
          >
            <Tooltip title="Group by Video">
              <ToggleButton value="grouped" aria-label="grouped view">
                <GroupViewIcon fontSize="small" sx={{ mr: { xs: 0, sm: 1 } }} />
                <Typography
                  variant="body2"
                  sx={{ display: { xs: "none", sm: "block" } }}
                >
                  Grouped
                </Typography>
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Recently Added">
              <ToggleButton value="recent" aria-label="recent view">
                <ListViewIcon fontSize="small" sx={{ mr: { xs: 0, sm: 1 } }} />
                <Typography
                  variant="body2"
                  sx={{ display: { xs: "none", sm: "block" } }}
                >
                  Recent
                </Typography>
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>
        </Stack>
      </Box>

      {/* Bookmark Content */}
      <Fade in timeout={600} key={sortMode}>
        <Box>
          {filteredBookmarks.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, md: 8 },
                textAlign: "center",
                border: `2px dashed ${alpha(theme.palette.divider, 0.6)}`,
                borderRadius: 4,
                bgcolor: alpha(theme.palette.background.default, 0.4),
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  p: 3,
                  borderRadius: "50%",
                  bgcolor: alpha(theme.palette.text.disabled, 0.05),
                  color: "text.disabled",
                }}
              >
                <BookmarkIcon sx={{ fontSize: 64 }} />
              </Box>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                {totalBookmarks === 0 ? "No bookmarks yet" : "No matches found"}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 400, lineHeight: 1.6 }}
              >
                {totalBookmarks === 0
                  ? "Mark key moments while watching videos using the bookmark button."
                  : `We couldn't find any bookmarks matching "${filter}".`}
              </Typography>
            </Paper>
          ) : sortMode === "grouped" ? (
            // GROUPED VIEW
            <Stack spacing={2}>
              {groupedBookmarks.map(([videoId, group]) => (
                <Accordion
                  key={videoId}
                  expanded={!!expanded[videoId]}
                  onChange={handleAccordionChange(videoId)}
                  disableGutters
                  elevation={0}
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                    borderRadius: "16px !important",
                    overflow: "hidden",
                    bgcolor: "background.paper",
                    "&:before": { display: "none" },
                    "&:hover": {
                      borderColor: alpha(theme.palette.primary.main, 0.5),
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.08)}`,
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon color="primary" />}
                    sx={{
                      px: { xs: 2.5, sm: 4 },
                      py: 1.5,
                      bgcolor: alpha(theme.palette.background.default, 0.4),
                      "& .play-icon": {
                        opacity: !!expanded[videoId] ? 1 : 0,
                        transform: !!expanded[videoId]
                          ? "scale(1)"
                          : "scale(0.8)",
                      },
                      "&:hover .play-icon": {
                        opacity: 1,
                        transform: "scale(1)",
                        bgcolor: alpha(theme.palette.primary.main, 0.15),
                      },
                    }}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      width="100%"
                      sx={{ mr: 2 }}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box
                          sx={{
                            display: { xs: "none", sm: "flex" },
                            p: 1.2,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            color: "primary.main",
                          }}
                        >
                          <VideoIcon fontSize="small" />
                        </Box>
                        <Stack spacing={0.1}>
                          <Typography
                            variant="overline"
                            color="primary.main"
                            fontWeight={700}
                            sx={{
                              lineHeight: 1,
                              letterSpacing: 0.5,
                              fontSize: "0.6rem",
                            }}
                          >
                            {group.chapterTitle}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            fontWeight={800}
                            sx={{ lineHeight: 1.2 }}
                          >
                            {group.videoTitle}
                          </Typography>
                        </Stack>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Chip
                          label={`${group.items.length} item${group.items.length > 1 ? "s" : ""}`}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: "primary.main",
                            border: "none",
                          }}
                        />
                        <Tooltip title="Play complete video">
                          <IconButton
                            className="play-icon"
                            color="primary"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/course?v=${encodeURIComponent(videoId)}`,
                              );
                            }}
                            sx={{
                              transition:
                                "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                              bgcolor: alpha(theme.palette.primary.main, 0.05),
                            }}
                          >
                            <PlayIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <List disablePadding>
                      {group.items.map((bm, bIdx) => (
                        <React.Fragment key={bm.id}>
                          <BookmarkListItem
                            bm={bm}
                            videoId={videoId}
                            isEditing={editingId === bm.id}
                            editNote={editNote}
                            setEditNote={setEditNote}
                            editInputRef={editInputRef}
                            onStartEdit={handleStartEdit}
                            onCancelEdit={handleCancelEdit}
                            onSaveEdit={handleSaveEdit}
                          />
                          {bIdx < group.items.length - 1 && (
                            <Divider
                              sx={{ mx: { xs: 2.5, sm: 4 }, opacity: 0.4 }}
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          ) : (
            // RECENT VIEW
            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                borderRadius: "16px !important",
                overflow: "hidden",
                bgcolor: "background.paper",
              }}
            >
              <List disablePadding>
                {recentBookmarks.map((bm, bIdx) => {
                  const videoInfo = videoLookup.get(bm.videoId) || {
                    title: bm.videoId,
                    chapterTitle: "",
                  };
                  return (
                    <React.Fragment key={bm.id}>
                      <BookmarkListItem
                        bm={bm}
                        videoId={bm.videoId}
                        showContext={{
                          title: videoInfo.title,
                          chapter: videoInfo.chapterTitle,
                        }}
                        isEditing={editingId === bm.id}
                        editNote={editNote}
                        setEditNote={setEditNote}
                        editInputRef={editInputRef}
                        onStartEdit={handleStartEdit}
                        onCancelEdit={handleCancelEdit}
                        onSaveEdit={handleSaveEdit}
                      />
                      {bIdx < recentBookmarks.length - 1 && (
                        <Divider
                          sx={{ mx: { xs: 2.5, sm: 4 }, opacity: 0.4 }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </List>
            </Paper>
          )}
        </Box>
      </Fade>
    </Box>
  );
};

// Extracted ListItem Component for reuse in both views
const BookmarkListItem = ({
  bm,
  videoId,
  showContext,
  isEditing,
  editNote,
  setEditNote,
  editInputRef,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
}: {
  bm: any;
  videoId: string;
  showContext?: { title: string; chapter: string };
  isEditing: boolean;
  editNote: string;
  setEditNote: (val: string) => void;
  editInputRef: React.RefObject<HTMLInputElement | null>;
  onStartEdit: (bm: any, e: React.MouseEvent) => void;
  onCancelEdit: (e: React.MouseEvent) => void;
  onSaveEdit: (id: string, e?: React.MouseEvent | React.KeyboardEvent) => void;
}) => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <ListItem
      sx={{
        px: { xs: 2.5, sm: 4 },
        py: 2,
        cursor: isEditing ? "default" : "pointer",
        transition: "background-color 0.2s ease",
        "&:hover": {
          bgcolor: isEditing
            ? "transparent"
            : alpha(theme.palette.primary.main, 0.06),
          borderLeft: `4px solid ${alpha(theme.palette.primary.main, 1)}`,
          pl: { xs: 2.1, sm: 3.6 }, // Offset padding to account for the 4px border
          "& .action-btn": { opacity: 1, transform: "scale(1)" },
          "& .time-chip": {
            bgcolor: "primary.main",
            color: "primary.contrastText",
            border: "none",
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
          },
        },
      }}
      onClick={() => {
        if (!isEditing) {
          navigate(
            `/course?v=${encodeURIComponent(videoId)}&t=${bm.timestamp}`,
          );
        }
      }}
    >
      <Tooltip
        title="Jump to this time"
        placement="top"
        disableInteractive={isEditing}
      >
        <Chip
          icon={<PlayIcon fontSize="small" />}
          className="time-chip"
          label={formatTime(bm.timestamp)}
          size="small"
          variant="outlined"
          sx={{
            mr: { xs: 2, sm: 3 },
            fontWeight: 700,
            fontSize: "0.8rem",
            px: 0.5,
            py: 1.8,
            transition: "all 0.2s ease",
            "& .MuiChip-icon": { color: "inherit" },
          }}
        />
      </Tooltip>

      {isEditing ? (
        <Box sx={{ flex: 1, mr: 2 }} onClick={(e) => e.stopPropagation()}>
          <TextField
            fullWidth
            size="small"
            autoFocus
            inputRef={editInputRef}
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit(bm.id, e);
              if (e.key === "Escape") onCancelEdit(e as any);
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "background.paper",
                borderRadius: 2,
              },
            }}
          />
        </Box>
      ) : (
        <ListItemText
          primary={bm.note}
          secondary={
            <Box
              component="span"
              sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
            >
              {showContext && (
                <Typography
                  variant="caption"
                  color="primary.main"
                  fontWeight={600}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mt: 0.5,
                  }}
                >
                  <VideoIcon fontSize="inherit" />
                  {showContext.title}
                </Typography>
              )}
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={500}
              >
                {new Date(bm.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </Typography>
            </Box>
          }
          primaryTypographyProps={{
            fontWeight: 500,
            fontSize: "0.95rem",
            color: "text.primary",
            mb: 0.3,
          }}
          sx={{ m: 0 }}
        />
      )}

      {isEditing ? (
        <Stack direction="row" spacing={1} onClick={(e) => e.stopPropagation()}>
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => onSaveEdit(bm.id, e)}
            sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
          >
            <CheckIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="default" onClick={onCancelEdit}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      ) : (
        <Stack
          direction="row"
          spacing={1}
          className="action-btn"
          sx={{
            ml: 2,
            opacity: { xs: 1, sm: 0 },
            transform: { xs: "scale(1)", sm: "scale(0.8)" },
            transition: "all 0.2s ease",
          }}
        >
          <Tooltip title="Edit note">
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => onStartEdit(bm, e)}
              sx={{
                "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1) },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete bookmark">
            <IconButton
              size="small"
              color="error"
              onClick={async (e) => {
                e.stopPropagation();
                await removeBookmark(bm.id);
              }}
              sx={{
                "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.1) },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
    </ListItem>
  );
};
