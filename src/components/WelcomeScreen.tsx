import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Fade,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Alert,
  Stack,
} from "@mui/material";
import {
  FolderOpen as FolderIcon,
  PlayCircleFilled as PlayIcon,
  BookmarkBorder as BookmarkIcon,
  TrendingUp as TrendingIcon,
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
  School as CourseIcon,
  WarningAmber as WarningIcon,
  Palette as CustomIcon,
  FormatColorReset as ResetIcon,
  Tune as SettingsIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSetAtom } from "jotai";
import {
  activeCourseIdAtom,
  DATA_STORAGE_KEY_PREFIX,
} from "../store";
import { setStoredHandle, db, setIDBValue } from "../utils/idb";
import { scanCourseDirectory } from "../utils/scanner";
import { useLiveQuery } from "dexie-react-hooks";
import type { CourseMeta } from "../types";

const COURSE_COLORS = [
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#64748b", // Slate
];

export const WelcomeScreen: React.FC = () => {
  const setActiveCourseId = useSetAtom(activeCourseIdAtom);
  const navigate = useNavigate();
  const [showGuide, setShowGuide] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string; deleteProgress: boolean }>({
    open: false,
    id: "",
    name: "",
    deleteProgress: false
  });
  const [browserError, setBrowserError] = useState(false);
  const [invalidCourseIds, setInvalidCourseIds] = useState<Set<string>>(new Set());
  const [activeColorCourseId, setActiveColorCourseId] = useState<string | null>(null);

  const courses = useLiveQuery(() => db.courses.orderBy("lastAccessed").reverse().toArray());

  // Check handles availability
  React.useEffect(() => {
    const checkHandles = async () => {
      if (!courses) return;
      const invalid = new Set<string>();
      
      for (const course of courses) {
        try {
          const handle = await db.handles.get(`rootFolderHandle_${course.id}`);
          if (!handle) {
            invalid.add(course.id);
            continue;
          }
          // Try to access the folder to see if it still exists
          // This will throw if the folder was moved or deleted
          const it = (handle as any).entries();
          await it.next();
        } catch (err) {
          console.warn(`Course ${course.name} handle is invalid:`, err);
          invalid.add(course.id);
        }
      }
      setInvalidCourseIds(invalid);
    };

    checkHandles();
  }, [courses]);

  const handleSelectFolder = async () => {
    try {
      if (!("showDirectoryPicker" in window)) {
        setBrowserError(true);
        return;
      }
      // @ts-ignore
      const handle = await (window as any).showDirectoryPicker();
      if (handle) {
        const courseName = handle.name;
        // Generate a stable ID based on the name to allow restoring progress if re-added
        const courseId = `course-${courseName.replace(/[^a-zA-Z0-9]/g, "_")}`;

        // 1. Create/Update Course Meta
        const courseMeta: CourseMeta = {
          id: courseId,
          name: courseName,
          rootPath: courseName,
          lastAccessed: Date.now(),
        };
        await db.courses.put(courseMeta);

        // 2. Store Handle
        await setStoredHandle(courseId, handle);

        // 3. Scan and Store Data
        const scannedData = await scanCourseDirectory(handle, courseId);
        await setIDBValue(`${DATA_STORAGE_KEY_PREFIX}${courseId}`, scannedData);

        // Optionally show some feedback or just let the Library UI refresh via useLiveQuery
      }
    } catch (err) {
      console.error("Directory picker error:", err);
    }
  };

  const handleCourseClick = async (course: CourseMeta) => {
    setActiveCourseId(course.id);
    navigate("/");
  };

  const handleDeleteCourse = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setDeleteDialog({ open: true, id, name, deleteProgress: false });
  };

  const handleColorChange = async (e: any, id: string, color: string) => {
    if (e && e.stopPropagation) e.stopPropagation();
    await db.courses.update(id, { color });
  };

  const confirmDelete = async () => {
    const { id, deleteProgress } = deleteDialog;
    
    if (deleteProgress) {
      // Clear progress from DB
      const allProgress = await db.videoProgress.toArray();
      const toDelete = allProgress
        .filter((p) => p.videoId.startsWith(`${id}::`))
        .map((p) => p.videoId);
      await db.videoProgress.bulkDelete(toDelete);

      const allBookmarks = await db.bookmarks.toArray();
      const bookmarksToDelete = allBookmarks
        .filter((b) => b.videoId.startsWith(`${id}::`))
        .map((b) => b.id);
      await db.bookmarks.bulkDelete(bookmarksToDelete);
    }
    
    await db.courses.delete(id);
    setDeleteDialog({ ...deleteDialog, open: false });
  };

  const hasCourses = courses && courses.length > 0;

  if (hasCourses) {
    return (
      <Box sx={{ p: 6, maxWidth: 1200, mx: "auto" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              component="img"
              src="/brain.svg"
              sx={{ width: 48, height: 48 }}
              alt="WatchFlow"
            />
            <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: "-1px" }}>
              Library
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleSelectFolder}
            sx={{ borderRadius: 3, px: 3, fontWeight: 700 }}
          >
            Add New Course
          </Button>
        </Box>

        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={course.id}>
              <Paper
                onClick={() => handleCourseClick(course)}
                className="transition-controls"
                sx={{
                  p: 3,
                  height: "100%",
                  cursor: "pointer",
                  borderRadius: 4,
                  border: 1,
                  borderColor: "divider",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 12px 24px rgba(0,0,0,0.1)",
                    borderColor: invalidCourseIds.has(course.id) ? "error.main" : "primary.main",
                  },
                  ...(invalidCourseIds.has(course.id) && {
                    borderColor: "error.light",
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(239, 68, 68, 0.08)"
                        : "rgba(239, 68, 68, 0.04)",
                  }),
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 3,
                      bgcolor: course.color || "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      boxShadow: course.color ? `0 4px 12px ${course.color}4d` : "none",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <CourseIcon />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    {invalidCourseIds.has(course.id) && (
                      <Tooltip title="Folder not found or inaccessible">
                        <IconButton size="small" color="error" onClick={(e) => e.stopPropagation()}>
                          <WarningIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Change Color">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveColorCourseId(course.id);
                        }}
                        sx={{ 
                          color: 'inherit',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove from Library">
                      <IconButton
                        size="small"
                        onClick={(e) => handleDeleteCourse(e, course.id, course.name)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Box>
                  <Typography 
                    variant="h6" 
                    fontWeight={800} 
                    sx={{ 
                      color: invalidCourseIds.has(course.id) 
                        ? 'error.main' 
                        : 'text.primary',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      transition: 'color 0.3s ease'
                    }}
                  >
                    {course.name}
                  </Typography>
                  {invalidCourseIds.has(course.id) && (
                    <Typography variant="caption" color="error" sx={{ fontWeight: 700, display: 'block', mt: 0.5 }}>
                      Folder missing or moved
                    </Typography>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Last accessed:{" "}
                  {new Date(course.lastAccessed).toLocaleDateString()}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Color Selection Dialog */}
        <Dialog
          open={Boolean(activeColorCourseId)}
          onClose={() => setActiveColorCourseId(null)}
          PaperProps={{
            sx: {
              p: 3,
              borderRadius: 5,
              width: "100%",
              maxWidth: 320,
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.98)' : '#fff',
              backdropFilter: 'blur(10px)',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }
          }}
        >
          {(() => {
            const course = courses?.find(c => c.id === activeColorCourseId);
            if (!course) return null;
            return (
              <Stack direction="column" gap={3} alignItems="center">
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 3,
                    bgcolor: course.color || "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    boxShadow: course.color ? `0 10px 20px -5px ${course.color}80` : "none",
                    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    transform: 'scale(1.1)',
                  }}
                >
                  <CourseIcon sx={{ fontSize: 32 }} />
                </Box>

                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" fontWeight={800} sx={{ color: 'text.secondary', mb: 1.5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Quick Presets
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1.5 }}>
                    {COURSE_COLORS.map((c) => (
                      <Box
                        key={c}
                        onClick={() => handleColorChange(null, course.id, c)}
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: c,
                          cursor: 'pointer',
                          border: course.color === c ? '3px solid white' : '1px solid rgba(0,0,0,0.1)',
                          boxShadow: course.color === c ? `0 0 0 2px ${c}` : 'none',
                          '&:hover': { 
                            transform: 'scale(1.2)',
                            boxShadow: `0 8px 16px ${c}4d`,
                          },
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ width: '100%' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="caption" fontWeight={800} sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Professional Tune
                    </Typography>
                    <Box sx={{ 
                      px: 1, 
                      py: 0.25, 
                      borderRadius: 1, 
                      bgcolor: 'action.hover',
                      fontFamily: 'monospace',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: course.color || 'primary.main'
                    }}>
                      {course.color?.toUpperCase() || 'DEFAULT'}
                    </Box>
                  </Stack>
                  
                  <Stack direction="row" gap={1} alignItems="center">
                    <Tooltip title="Custom Color Picker">
                      <IconButton 
                        onClick={() => document.getElementById(`color-custom-dialog`)?.click()}
                        sx={{ 
                          bgcolor: course.color || 'primary.main',
                          color: 'white',
                          boxShadow: course.color ? `0 4px 12px ${course.color}4d` : 'none',
                          '&:hover': { bgcolor: course.color || 'primary.main', filter: 'brightness(1.1)' }
                        }}
                      >
                        <CustomIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Box sx={{ flexGrow: 1, position: 'relative' }}>
                      <input 
                        type="color" 
                        id="color-custom-dialog"
                        style={{ 
                          position: 'absolute',
                          opacity: 0,
                          width: 0,
                          height: 0,
                          pointerEvents: 'none'
                        }}
                        value={course.color || "#3b82f6"}
                        onChange={(e) => handleColorChange(e, course.id, e.target.value)}
                      />
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<ResetIcon />}
                        onClick={() => handleColorChange(null, course.id, "")}
                        sx={{ 
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 700,
                          borderColor: 'divider',
                          color: 'text.secondary'
                        }}
                      >
                        Reset Theme
                      </Button>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            );
          })()}
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={deleteDialog.open} 
          onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}
          PaperProps={{
            sx: {
              borderRadius: 4,
              p: 1,
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.95)' : '#fff',
              backdropFilter: 'blur(20px)',
              backgroundImage: 'none'
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>Remove Course?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Are you sure you want to remove <strong>{deleteDialog.name}</strong> from your library?
            </Typography>
            <FormControlLabel
              control={
                <Checkbox 
                  size="small" 
                  checked={deleteDialog.deleteProgress} 
                  onChange={(e) => setDeleteDialog({ ...deleteDialog, deleteProgress: e.target.checked })}
                  sx={{ color: 'error.main', '&.Mui-checked': { color: 'error.main' } }}
                />
              }
              label={
                <Typography variant="body2" color="error.main" fontWeight={600}>
                  Also permanently delete all progress and bookmarks
                </Typography>
              }
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button 
              onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}
              sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete}
              variant="contained" 
              color={deleteDialog.deleteProgress ? "error" : "primary"}
              sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', px: 3 }}
            >
              {deleteDialog.deleteProgress ? "Delete Everything" : "Remove from Library"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Browser Error Dialog */}
        <Dialog open={browserError} onClose={() => setBrowserError(false)}>
          <DialogTitle sx={{ fontWeight: 800 }}>Browser Not Supported</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              Your browser doesn't support local directory scanning. Please use a modern browser like <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBrowserError(false)} sx={{ fontWeight: 700 }}>Close</Button>
          </DialogActions>
        </Dialog>

      </Box>
    );
  }

  // Fallback to original Welcome Screen if no courses
  const features = [
    {
      icon: <PlayIcon sx={{ fontSize: 28, color: "#60a5fa" }} />,
      title: "Video Player",
      desc: "Subtitles, shortcuts & auto-progress tracking",
    },
    {
      icon: <BookmarkIcon sx={{ fontSize: 28, color: "#a78bfa" }} />,
      title: "Bookmarks & Notes",
      desc: "Save timestamps and revisit key moments",
    },
    {
      icon: <TrendingIcon sx={{ fontSize: 28, color: "#34d399" }} />,
      title: "Study Streaks",
      desc: "Track daily goals and build study habits",
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        p: 4,
      }}
    >
      <Box sx={{ textAlign: "center", maxWidth: 600 }}>
        <Box
          component="img"
          src="/brain.svg"
          sx={{
            width: 80,
            height: 80,
            mb: 2,
            filter: "drop-shadow(0 4px 12px rgba(59, 130, 246, 0.4))",
          }}
          alt="WatchFlow"
        />
        <Typography
          variant="h3"
          fontWeight={900}
          sx={{
            mb: 1,
            letterSpacing: "-1.5px",
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)"
                : "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Welcome to WatchFlow
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 420, mx: "auto" }}
        >
          Select your video folder to get started. We'll scan the directory and
          set up your viewing dashboard automatically.
        </Typography>

        <Button
          variant="contained"
          size="large"
          startIcon={<FolderIcon />}
          onClick={handleSelectFolder}
          sx={{
            px: 5,
            py: 1.8,
            borderRadius: 3,
            fontWeight: 700,
            fontSize: "1.05rem",
            textTransform: "none",
            boxShadow: "0 8px 32px rgba(59, 130, 246, 0.35)",
            "&:hover": {
              boxShadow: "0 12px 40px rgba(59, 130, 246, 0.5)",
              transform: "translateY(-1px)",
            },
            transition: "all 0.2s ease",
            mb: 4,
          }}
        >
          Select Video Folder
        </Button>

        {/* Guide Toggle */}
        <Box sx={{ mb: 6, mx: "auto", maxWidth: 460 }}>
          <Button
            size="small"
            onClick={() => setShowGuide(!showGuide)}
            sx={{
              textTransform: "none",
              color: "text.secondary",
              fontWeight: 700,
              mb: 1,
              mx: "auto",
              display: "flex",
              "&:hover": { bgcolor: "transparent", color: "primary.main" },
            }}
          >
            {showGuide
              ? "Hide Folder Guide"
              : "How should I organize my folders?"}
          </Button>

          {showGuide && (
            <Fade in={showGuide}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(15, 23, 42, 0.6)"
                      : "rgba(248, 250, 252, 0.8)",
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: "0.85rem",
                  lineHeight: 1.6,
                  borderStyle: "dashed",
                  textAlign: "left",
                }}
              >
                <Box sx={{ color: "primary.main", fontWeight: 700 }}>
                  Course Root Folder/
                </Box>
                <Box sx={{ pl: 2 }}>
                  <Box>├── 01 Introduction/</Box>
                  <Box sx={{ pl: 2, color: "text.secondary" }}>
                    <Box>├── Welcome.mp4</Box>
                  </Box>
                  <Box>├── 02 Basics/</Box>
                </Box>
              </Paper>
            </Fade>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {features.map((f) => (
            <Paper
              key={f.title}
              sx={{
                p: 2.5,
                width: 180,
                borderRadius: 3,
                border: 1,
                borderColor: "divider",
                textAlign: "center",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                },
              }}
            >
              {f.icon}
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{ mt: 1, mb: 0.5 }}
              >
                {f.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {f.desc}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

