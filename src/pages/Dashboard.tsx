import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Divider,
  Modal,
  Backdrop,
  Fade,
  IconButton,
  List,
  ListItem,
  LinearProgress,
} from "@mui/material";
import {
  FolderOpen as ChapterIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import { useAtomValue } from "jotai";
import {
  courseDataStateAtom,
  rootHandleAtom,
  lastWatchedVideoIdAtom,
  settingsAtom,
  videoRootPathAtom,
  permissionStatusAtom,
} from "../store";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../utils/idb";
import { formatTime } from "../utils/formatters";
import type { Chapter } from "../types";
import { StudyStreakCard } from "../components/StudyStreakCard";
import { WelcomeBanner } from "../components/dashboard/WelcomeBanner";
import { OverallProgressCard } from "../components/dashboard/OverallProgressCard";
import { TimeWatchedCard } from "../components/dashboard/TimeWatchedCard";
import { ChapterProgressCard } from "../components/dashboard/ChapterProgressCard";
import { scanCourseDirectory } from "../utils/scanner";
import { setStoredHandle } from "../utils/idb";
import { useSetAtom } from "jotai";

export type ChapterStat = Chapter & {
  total: number;
  completed: number;
  watchedTime: number;
  totalTime: number;
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const courseData = useAtomValue(courseDataStateAtom);
  const rootHandle = useAtomValue(rootHandleAtom);
  const videosProgressArray = useLiveQuery(
    () => db.videoProgress.toArray(),
    [],
  );
  const videosProgress = useMemo(() => {
    const dict: Record<string, any> = {};
    if (videosProgressArray) {
      videosProgressArray.forEach((p) => {
        dict[p.videoId] = p;
      });
    }
    return dict;
  }, [videosProgressArray]);
  const lastWatchedVideoId = useAtomValue(lastWatchedVideoIdAtom);
  const settings = useAtomValue(settingsAtom);

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
    let totalWatchedTime = 0;
    let totalTime = 0;

    const chapterStats: ChapterStat[] = courseData.map((chapter) => {
      const chapterTotal = chapter.videos.length;
      let chapterCompleted = 0;
      let chapterWatchedTime = 0;
      let chapterTotalTime = 0;

      chapter.videos.forEach((video) => {
        totalVideos++;
        const vidProg = videosProgress?.[video.id];
        if (vidProg) {
          if (vidProg.completed) {
            completedVideos++;
            chapterCompleted++;
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
        watchedTime: chapterWatchedTime,
        totalTime: chapterTotalTime,
      };
    });

    const remainingVideos = Math.max(0, totalVideos - completedVideos);

    return {
      totalVideos,
      completedVideos,
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
    let targetVideoId = lastWatchedVideoId || "";

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
    } else if (courseData.length > 0 && courseData[0].videos.length > 0) {
      // First start - target the first video
      const firstVideo = courseData[0].videos[0];
      lastVideoTitle = firstVideo.title;
      lastChapterTitle = courseData[0].title;
      targetVideoId = firstVideo.id;
    }

    return {
      lastVideoTitle,
      lastChapterTitle,
      lastVideoProgressStr,
      lastVideoPercent,
      targetVideoId,
    };
  }, [courseData, lastWatchedVideoId, videosProgress]);

  const {
    totalVideos,
    completedVideos,
    totalWatchedTime,
    remainingVideos,
    chapterStats,
  } = stats;

  const {
    lastVideoTitle,
    lastChapterTitle,
    lastVideoProgressStr,
    lastVideoPercent,
    targetVideoId,
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
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Directory picker error:", err);
      }
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
          <WelcomeBanner
            lastWatchedVideoId={lastWatchedVideoId}
            lastVideoTitle={lastVideoTitle}
            lastChapterTitle={lastChapterTitle}
            lastVideoProgressStr={lastVideoProgressStr}
            lastVideoPercent={lastVideoPercent}
            targetVideoId={targetVideoId}
          />
        </Grid>

        {/* Analytics Section */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={3} sx={{ height: "100%" }}>
            {/* Overall Progress Card */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <OverallProgressCard
                completedVideos={completedVideos}
                remainingVideos={remainingVideos}
                totalVideos={totalVideos}
              />
            </Grid>

            {/* Time Watched Card */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TimeWatchedCard totalWatchedTime={totalWatchedTime} />
            </Grid>
          </Grid>
        </Grid>

        {/* Study Streak */}
        <Grid size={{ xs: 12, md: 4 }}>
          <StudyStreakCard />
        </Grid>

        {/* Chapter Breakdown */}
        <Grid size={{ xs: 12 }}>
          <ChapterProgressCard
            chapterStats={chapterStats}
            selectedChapter={selectedChapter}
            onSelectChapter={setSelectedChapter}
          />
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
          <Fade in={!!selectedChapter}>
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: { xs: "95%", sm: 550 },
                maxHeight: "85vh",
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(30, 41, 59, 0.95)"
                    : "#ffffff",
                backdropFilter: "blur(20px)",
                borderRadius: 5,
                boxShadow: (theme) =>
                  theme.palette.mode === "dark"
                    ? "0 25px 50px -12px rgba(0, 0, 0, 0.8)"
                    : "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                border: "1px solid",
                borderColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
                outline: "none",
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
                      borderBottom: "1px solid",
                      borderColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.05)",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h6"
                        fontWeight="900"
                        sx={{ letterSpacing: "-0.5px" }}
                      >
                        {selectedChapter.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "primary.main",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        {selectedChapter.completed} / {selectedChapter.total}{" "}
                        Lessons Completed
                      </Typography>
                    </Box>
                    <IconButton
                      onClick={() => setSelectedChapter(null)}
                      sx={{
                        bgcolor: "action.hover",
                        "&:hover": { bgcolor: "action.selected" },
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      overflowY: "auto",
                      "&::-webkit-scrollbar": {
                        width: "6px",
                      },
                      "&::-webkit-scrollbar-track": {
                        backgroundColor: "transparent",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.1)",
                        borderRadius: "10px",
                      },
                    }}
                  >
                    <List disablePadding>
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
                                px: 2,
                                display: "block",
                                cursor: "pointer",
                                borderRadius: 3,
                                mb: 1,
                                transition: "all 0.2s ease",
                                border: "1px solid transparent",
                                "&:hover": {
                                  bgcolor: (theme) =>
                                    theme.palette.mode === "dark"
                                      ? "rgba(255,255,255,0.03)"
                                      : "rgba(0,0,0,0.02)",
                                  borderColor: "divider",
                                  transform: "translateX(4px)",
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
                                  gap: 2,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight={isCompleted ? 800 : 600}
                                  sx={{
                                    color: isCompleted
                                      ? "success.main"
                                      : "text.primary",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                  }}
                                >
                                  <Box
                                    component="span"
                                    sx={{
                                      minWidth: 24,
                                      height: 24,
                                      borderRadius: "50%",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "0.7rem",
                                      bgcolor: isCompleted
                                        ? "rgba(34, 197, 94, 0.1)"
                                        : "action.hover",
                                      color: isCompleted
                                        ? "success.main"
                                        : "text.secondary",
                                      border: "1px solid",
                                      borderColor: isCompleted
                                        ? "success.main"
                                        : "transparent",
                                      fontWeight: isCompleted ? 800 : 500,
                                    }}
                                  >
                                    {vIdx + 1}
                                  </Box>
                                  {video.title}
                                </Typography>
                                {isCompleted && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "success.main",
                                      fontWeight: 800,
                                      bgcolor: "rgba(34, 197, 94, 0.1)",
                                      px: 1,
                                      py: 0.5,
                                      borderRadius: 1,
                                    }}
                                  >
                                    DONE
                                  </Typography>
                                )}
                              </Box>

                              {!isCompleted && percent > 0 && (
                                <Box sx={{ width: "100%", mt: 2, pl: 5 }}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      mb: 0.8,
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontWeight: 700,
                                        color: "text.secondary",
                                      }}
                                    >
                                      IN PROGRESS
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontWeight: 800,
                                        color: "primary.main",
                                      }}
                                    >
                                      {Math.round(percent)}%
                                    </Typography>
                                  </Box>
                                  <LinearProgress
                                    variant="determinate"
                                    value={percent}
                                    sx={{
                                      height: 6,
                                      borderRadius: 3,
                                      bgcolor: "action.hover",
                                      "& .MuiLinearProgress-bar": {
                                        borderRadius: 3,
                                        background: (theme) =>
                                          `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                                      },
                                    }}
                                  />
                                </Box>
                              )}
                            </ListItem>
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
