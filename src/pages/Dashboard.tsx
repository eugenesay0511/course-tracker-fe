import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Modal,
  Backdrop,
  Fade,
  Divider,
  IconButton,
  List,
  ListItem,
  LinearProgress,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import {
  PlayCircleOutline as PlayIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  FolderOpen as ChapterIcon,
  AccessTime as ClockIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import { useAtomValue } from "jotai";
import {
  courseDataStateAtom,
  rootHandleAtom,
  videosProgressAtom,
  lastWatchedVideoIdAtom,
  settingsAtom,
  videoRootPathAtom,
  permissionStatusAtom,
} from "../store";
import { formatDuration, formatTime } from "../utils/formatters";
import type { Chapter } from "../types";
import { StudyStreakCard } from "../components/StudyStreakCard";
import { scanCourseDirectory } from "../utils/scanner";
import { setStoredHandle } from "../utils/idb";
import { useSetAtom } from "jotai";

type ChapterStat = Chapter & {
  total: number;
  completed: number;
  inProgress: number;
  watchedTime: number;
  totalTime: number;
};

export const Dashboard: React.FC = () => {
  const courseData = useAtomValue(courseDataStateAtom);
  const rootHandle = useAtomValue(rootHandleAtom);
  const videosProgress = useAtomValue(videosProgressAtom);
  const lastWatchedVideoId = useAtomValue(lastWatchedVideoIdAtom);
  const settings = useAtomValue(settingsAtom);
  const navigate = useNavigate();
  const setVideoRootPath = useSetAtom(videoRootPathAtom);
  const setCourseData = useSetAtom(courseDataStateAtom);
  const setRootHandleState = useSetAtom(rootHandleAtom);
  const setPermissionStatus = useSetAtom(permissionStatusAtom);

  const [selectedChapter, setSelectedChapter] = useState<ChapterStat | null>(
    null,
  );

  const stats = useMemo(() => {
    let totalVideos = 0;
    let completedVideos = 0;
    let inProgressVideos = 0;
    let totalWatchedTime = 0;
    let totalTime = 0;

    const chapterStats: ChapterStat[] = courseData.map((chapter) => {
      const chapterTotal = chapter.videos.length;
      let chapterCompleted = 0;
      let chapterInProgress = 0;
      let chapterWatchedTime = 0;
      let chapterTotalTime = 0;

      chapter.videos.forEach((video) => {
        totalVideos++;
        const vidProg = videosProgress?.[video.id];
        if (vidProg) {
          if (vidProg.completed) {
            completedVideos++;
            chapterCompleted++;
          } else if (vidProg.currentTime > 0) {
            inProgressVideos++;
          }

          const dur = vidProg.duration || 0;
          const cur = vidProg.currentTime || 0;

          chapterTotalTime += dur;
          chapterWatchedTime += vidProg.completed ? dur : cur;
        }
      });

      totalWatchedTime += chapterWatchedTime;
      totalTime += chapterTotalTime;

      return {
        ...chapter,
        total: chapterTotal,
        completed: chapterCompleted,
        inProgress: chapterInProgress,
        watchedTime: chapterWatchedTime,
        totalTime: chapterTotalTime,
      };
    });

    const remainingVideos = Math.max(0, totalVideos - completedVideos);

    return {
      totalVideos,
      completedVideos,
      inProgressVideos,
      totalWatchedTime,
      totalTime,
      remainingVideos,
      chapterStats,
    };
  }, [courseData, videosProgress]);

  const resumeInfo = useMemo(() => {
    let lastVideoTitle = "Start your journey";
    let lastChapterTitle = "";
    let lastVideoProgressStr = "";
    let lastVideoPercent = 0;

    if (lastWatchedVideoId) {
      for (const ch of courseData) {
        const v = ch.videos.find((video) => video.id === lastWatchedVideoId);
        if (v) {
          lastVideoTitle = v.title;
          lastChapterTitle = ch.title;
          const vidProg = videosProgress[lastWatchedVideoId];
          if (vidProg) {
            lastVideoProgressStr = `${formatTime(vidProg.currentTime)} / ${formatTime(vidProg.duration)}`;
            if (vidProg.duration > 0) {
              lastVideoPercent = Math.min(
                100,
                (vidProg.currentTime / vidProg.duration) * 100,
              );
            }
          }
          break;
        }
      }
    }

    return {
      lastVideoTitle,
      lastChapterTitle,
      lastVideoProgressStr,
      lastVideoPercent,
    };
  }, [courseData, lastWatchedVideoId, videosProgress]);

  const {
    totalVideos,
    completedVideos,
    inProgressVideos,
    totalWatchedTime,
    remainingVideos,
    chapterStats,
  } = stats;

  const {
    lastVideoTitle,
    lastChapterTitle,
    lastVideoProgressStr,
    lastVideoPercent,
  } = resumeInfo;

  const folderName =
    rootHandle?.name ||
    (settings?.videoRootPath
      ? settings.videoRootPath.split(/[/\\]/).filter(Boolean).pop()
      : null);

  const handleBrowseAndScan = async () => {
    try {
      if ("showDirectoryPicker" in window) {
        // @ts-ignore
        const handle = await (window as any).showDirectoryPicker();
        if (handle) {
          const folderName = handle.name;
          let newPath = folderName;

          const currentVal = settings.videoRootPath.trim();
          if (currentVal) {
            const strippedVal = currentVal.replace(/^["']|["']$/g, "");
            const lastSlash = Math.max(
              strippedVal.lastIndexOf("/"),
              strippedVal.lastIndexOf("\\"),
            );
            if (lastSlash !== -1) {
              const baseDir = strippedVal.substring(0, lastSlash + 1);
              newPath = baseDir + folderName;
            }
          }

          setRootHandleState(handle);
          setStoredHandle(handle).catch((err) =>
            console.error("Failed to store handle in IDB:", err),
          );
          setPermissionStatus("granted");

          const scannedData = await scanCourseDirectory(handle);
          setVideoRootPath(newPath);
          setCourseData(scannedData);
        }
      } else {
        alert(
          "Your browser doesn't support directory scanning. Please update your path manually in Settings.",
        );
      }
    } catch (err) {
      console.error("Directory picker error:", err);
    }
  };

  return (
    <Box
      sx={{
        p: 4,
        height: "100%",
        overflowY: "auto",
        "&::-webkit-scrollbar": {
          width: "8px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "transparent",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "action.hover",
          borderRadius: "10px",
          border: "2px solid transparent",
          backgroundClip: "content-box",
        },
        "&::-webkit-scrollbar-thumb:hover": {
          backgroundColor: "action.selected",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2.5,
          mb: 2,
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="h4"
          fontWeight={900}
          sx={{
            letterSpacing: "-1.5px",
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "linear-gradient(90deg, #FFFFFF 0%, #CBD5E1 100%)"
                : "linear-gradient(90deg, #1E3A8A 0%, #3B82F6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1.2,
          }}
        >
          Learning Dashboard
        </Typography>

        {folderName && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              py: 1,
              borderRadius: "100px",
              bgcolor: "background.paper",
              boxShadow: (theme) =>
                theme.palette.mode === "dark"
                  ? "0 4px 20px rgba(0,0,0,0.4)"
                  : "0 4px 20px rgba(0,0,0,0.05)",
              border: 1,
              borderColor: "divider",
              transition: "all 0.2s ease",
              cursor: "pointer",
              "&:hover": {
                transform: "translateY(-1px)",
                borderColor: "primary.main",
                bgcolor: "action.hover",
              },
            }}
            onClick={handleBrowseAndScan}
          >
            <ChapterIcon sx={{ fontSize: 20, color: "primary.main" }} />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: "text.primary",
                whiteSpace: "nowrap",
              }}
            >
              {folderName}
            </Typography>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ height: 14, my: "auto", mx: 0.5, opacity: 0.5 }}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: "#10b981",
                  boxShadow: "0 0 8px rgba(16, 185, 129, 0.4)",
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: "#10b981",
                  fontSize: "0.65rem",
                  letterSpacing: "0.5px",
                }}
              >
                SYNCED
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      <Grid container spacing={3} sx={{ mt: 2, alignItems: "stretch" }}>
        {/* Quick Resume Banner */}
        <Grid size={{ xs: 12 }}>
          <Card
            elevation={0}
            sx={(theme) => ({
              position: "relative",
              overflow: "hidden",
              borderRadius: 3,
              border: 1,
              borderColor: "divider",
              bgcolor:
                theme.palette.mode === "dark" ? "background.paper" : "#ffffff",
              backgroundImage:
                theme.palette.mode === "dark"
                  ? "linear-gradient(rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.03))"
                  : "none",
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 4px 20px rgba(0,0,0,0.4)"
                  : "0 4px 20px rgba(0,0,0,0.04)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 8px 30px rgba(0,0,0,0.5)"
                    : "0 8px 30px rgba(0,0,0,0.08)",
              },
            })}
          >
            <CardContent
              sx={{
                p: "14px 24px !important",
                display: "flex",
                alignItems: "center",
                gap: 2.5,
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "primary.main",
                  color: "white",
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
                }}
              >
                <PlayIcon sx={{ fontSize: 24 }} />
              </Box>

              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 0.2,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: "primary.main",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      fontSize: "0.7rem",
                    }}
                  >
                    {lastWatchedVideoId ? "CONTINUE?" : "GET STARTED"}
                  </Typography>
                  {lastWatchedVideoId && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        fontSize: "0.7rem",
                        opacity: 0.7,
                      }}
                    >
                      • {lastChapterTitle}
                    </Typography>
                  )}
                </Box>
                <Typography
                  variant="body1"
                  noWrap
                  sx={{
                    fontWeight: 850,
                    color: "text.primary",
                    fontSize: "1rem",
                    letterSpacing: "-0.2px",
                  }}
                >
                  {lastVideoTitle}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: { xs: "none", sm: "flex" },
                  alignItems: "center",
                  gap: 3,
                  mr: 2,
                }}
              >
                <Box sx={{ textAlign: "right" }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 700,
                      display: "block",
                      mb: -0.5,
                    }}
                  >
                    PROGRESS
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.primary", fontWeight: 900 }}
                  >
                    {lastVideoProgressStr}
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                onClick={() => {
                  if (lastWatchedVideoId) {
                    navigate(
                      `/course?v=${encodeURIComponent(lastWatchedVideoId)}`,
                    );
                  } else {
                    navigate("/course");
                  }
                }}
                sx={{
                  borderRadius: "100px",
                  py: 1,
                  px: 4,
                  fontWeight: 800,
                  textTransform: "none",
                  boxShadow: "none",
                  fontSize: "0.85rem",
                  "&:hover": { boxShadow: "none" },
                }}
              >
                Resume
              </Button>
            </CardContent>

            {/* Subtle bottom progress line integrated into the card edge */}
            {lastWatchedVideoId && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  bgcolor: "action.hover",
                }}
              >
                <Box
                  sx={{
                    height: "100%",
                    bgcolor: "primary.main",
                    width: `${lastVideoPercent}%`,
                    transition: "width 0.4s ease",
                  }}
                />
              </Box>
            )}
          </Card>
        </Grid>

        {/* Analytics Section */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={3} sx={{ height: "100%" }}>
            {/* Overall Progress Card */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card
                sx={(theme) => ({
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
                      : "linear-gradient(135deg, #ffffff 0%, #f4f9ff 100%)",
                  border: 1,
                  borderColor: "divider",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
                      : "0 20px 40px -4px rgba(148, 163, 184, 0.25)",
                  borderRadius: 4,
                })}
              >
                <CardContent
                  sx={{
                    p: 3,
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    color="primary.main"
                    fontWeight="bold"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      mb: 2,
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 18 }} />
                    Overall Progress
                  </Typography>

                  <Box
                    sx={{
                      flexGrow: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 180,
                    }}
                  >
                    <PieChart
                      series={[
                        {
                          data: [
                            {
                              id: 0,
                              value: completedVideos,
                              label: "Completed",
                              color: "#10b981",
                            },
                            {
                              id: 1,
                              value: inProgressVideos,
                              label: "In Progress",
                              color: "#3b82f6",
                            },
                            {
                              id: 2,
                              value: remainingVideos,
                              label: "Remaining",
                              color: "#94a3b8",
                            },
                          ].filter((d) => d.value > 0),
                          innerRadius: 55,
                          outerRadius: 80,
                          paddingAngle: 2,
                          cornerRadius: 6,
                          cx: 150,
                        },
                      ]}
                      width={300}
                      height={180}
                      margin={{ right: 5 }}
                      // hideLegend
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    align="center"
                    sx={{
                      color: "rgba(255,255,255,0.7)",
                      mt: 2,
                      fontWeight: 500,
                    }}
                  >
                    {completedVideos} of {totalVideos} videos done
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Time Watched Card */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card
                sx={(theme) => ({
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
                      : "linear-gradient(135deg, #ffffff 0%, #f4f9ff 100%)",
                  border: 1,
                  borderColor: "divider",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
                      : "0 20px 40px -4px rgba(148, 163, 184, 0.25)",
                  borderRadius: 4,
                })}
              >
                <CardContent
                  sx={{
                    p: 3,
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    sx={{
                      color: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      mb: 3,
                      alignSelf: "flex-start",
                    }}
                  >
                    <ClockIcon sx={{ fontSize: 18 }} />
                    Time Watched
                  </Typography>

                  <Box
                    sx={{
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "primary.main",
                        color: "white",
                        mb: 2,
                        boxShadow: "0 8px 16px -4px rgba(59, 130, 246, 0.5)",
                      }}
                    >
                      <ClockIcon sx={{ fontSize: 40 }} />
                    </Box>

                    <Typography
                      variant="h3"
                      fontWeight="900"
                      sx={{ color: "#ffffff", letterSpacing: "-1px" }}
                    >
                      {formatDuration(totalWatchedTime)}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    align="center"
                    sx={{
                      color: "rgba(255,255,255,0.8)",
                      mt: 2,
                      fontWeight: 500,
                    }}
                  >
                    Total learning time
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Study Streak */}
        <Grid size={{ xs: 12, md: 4 }}>
          <StudyStreakCard />
        </Grid>

        {/* Chapter Breakdown */}
        <Grid size={{ xs: 12 }}>
          <Card
            sx={(theme) => ({
              borderRadius: 4,
              border: 1,
              borderColor: "divider",
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
                  : "linear-gradient(135deg, #ffffff 0%, #f4f9ff 100%)",
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
                  : "0 20px 40px -4px rgba(148, 163, 184, 0.25)",
            })}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="subtitle2"
                color="primary.main"
                fontWeight="bold"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  mb: 2,
                }}
              >
                <ChapterIcon sx={{ fontSize: 18 }} />
                Chapter Progress
              </Typography>
              <Grid container spacing={2}>
                {chapterStats.map((stat, idx) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                    <Box
                      onClick={() => setSelectedChapter(stat)}
                      sx={{
                        mb: 2,
                        p: 1.5,
                        borderRadius: 2,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          bgcolor: "action.hover",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ maxWidth: "75%", fontWeight: 600 }}
                        >
                          {stat.title}
                        </Typography>
                        <Chip
                          label={`${stat.completed}/${stat.total}`}
                          size="small"
                          variant="outlined"
                          sx={{
                            height: 24,
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                            borderColor: "divider",
                            bgcolor:
                              stat.completed === stat.total
                                ? "success.main"
                                : "transparent",
                            color:
                              stat.completed === stat.total
                                ? "white"
                                : "text.secondary",
                          }}
                        />
                      </Box>
                      <Box
                        sx={(theme) => ({
                          width: "100%",
                          height: 6,
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? "#1e293b"
                              : "#e2e8f0",
                          borderRadius: 3,
                          overflow: "hidden",
                        })}
                      >
                        <Box
                          sx={{
                            height: "100%",
                            bgcolor:
                              stat.completed === stat.total
                                ? "#10b981"
                                : "primary.main",
                            width: `${stat.total > 0 ? (stat.completed / stat.total) * 100 : 0}%`,
                          }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Chapter Detail Modal */}
      {!!selectedChapter && (
        <Modal
          open={!!selectedChapter}
          onClose={() => setSelectedChapter(null)}
          closeAfterTransition
          slots={{ backdrop: Backdrop }}
          slotProps={{
            backdrop: {
              timeout: 500,
              sx: { backdropFilter: "blur(4px)", bgcolor: "rgba(0,0,0,0.6)" },
            },
          }}
        >
          <Fade in={!!selectedChapter}>
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: { xs: "90%", sm: 500 },
                maxHeight: "80vh",
                bgcolor: "background.paper",
                borderRadius: 4,
                boxShadow: 24,
                p: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {selectedChapter && (
                <>
                  <Box
                    sx={{
                      p: 3,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                    }}
                  >
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {selectedChapter.title}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {selectedChapter.completed} / {selectedChapter.total}{" "}
                        videos completed
                      </Typography>
                    </Box>
                    <IconButton
                      onClick={() => setSelectedChapter(null)}
                      sx={{ color: "inherit" }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      overflowY: "auto",
                      "&::-webkit-scrollbar": {
                        width: "8px",
                      },
                      "&::-webkit-scrollbar-track": {
                        backgroundColor: "transparent",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "action.hover",
                        borderRadius: "10px",
                        border: "2px solid transparent",
                        backgroundClip: "content-box",
                      },
                      "&::-webkit-scrollbar-thumb:hover": {
                        backgroundColor: "action.selected",
                      },
                    }}
                  >
                    <List dense>
                      {selectedChapter.videos.map((video, vIdx: number) => {
                        const videoProg = videosProgress?.[video.id];
                        const isCompleted = videoProg?.completed;
                        const percent = videoProg
                          ? videoProg.duration > 0
                            ? (videoProg.currentTime / videoProg.duration) * 100
                            : 0
                          : 0;

                        return (
                          <React.Fragment key={video.id}>
                            <ListItem
                              sx={{
                                py: 2,
                                display: "block",
                                cursor: "pointer",
                                transition: "background-color 0.2s",
                                "&:hover": {
                                  bgcolor: "action.hover",
                                },
                              }}
                              onClick={() =>
                                navigate(
                                  `/course?v=${encodeURIComponent(video.id)}`,
                                )
                              }
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight={isCompleted ? 600 : 400}
                                  color={
                                    isCompleted
                                      ? "success.main"
                                      : "text.primary"
                                  }
                                >
                                  {vIdx + 1}. {video.title}
                                </Typography>
                                {isCompleted && (
                                  <CheckCircleIcon
                                    color="success"
                                    sx={{ fontSize: 18 }}
                                  />
                                )}
                              </Box>
                              {!isCompleted && percent > 0 && (
                                <Box sx={{ width: "100%", mt: 1 }}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      mb: 0.5,
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Progress
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {Math.round(percent)}%
                                    </Typography>
                                  </Box>
                                  <LinearProgress
                                    variant="determinate"
                                    value={percent}
                                    sx={{
                                      height: 4,
                                      borderRadius: 2,
                                      bgcolor: "action.hover",
                                      "& .MuiLinearProgress-bar": {
                                        borderRadius: 2,
                                      },
                                    }}
                                  />
                                </Box>
                              )}
                            </ListItem>
                            {vIdx < selectedChapter.videos.length - 1 && (
                              <Divider component="li" />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </List>
                  </Box>
                </>
              )}
            </Box>
          </Fade>
        </Modal>
      )}
    </Box>
  );
};
