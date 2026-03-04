import React from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
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
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import { useCourseProgress } from "../hooks/useCourseProgress";

export const Dashboard: React.FC = () => {
  const { progress = { videos: {} }, courseData = [] } =
    useCourseProgress() as any;
  const navigate = useNavigate();
  const [selectedChapter, setSelectedChapter] = React.useState<any>(null);

  // Calculate statistics
  let totalVideos = 0;
  let completedVideos = 0;
  const chapterStats: {
    id: number;
    title: string;
    total: number;
    completed: number;
    videos: any[];
  }[] = [];

  courseData.forEach((chapter: any, idx: number) => {
    const chapterTotal = chapter.videos.length;
    let chapterCompleted = 0;

    chapter.videos.forEach((video: any) => {
      totalVideos++;
      if (progress?.videos?.[video.id]?.completed) {
        completedVideos++;
        chapterCompleted++;
      }
    });

    chapterStats.push({
      id: idx,
      title: chapter.title,
      total: chapterTotal,
      completed: chapterCompleted,
      videos: chapter.videos,
    });
  });

  const remainingVideos = totalVideos - completedVideos;

  // Find last watched video details for quick resume
  let lastVideoTitle = "Start your journey";
  let lastChapterTitle = "";
  let lastVideoProgressStr = "";
  let lastVideoPercent = 0;

  if (progress.lastWatchedVideoId) {
    for (const chapter of courseData) {
      const video = chapter.videos.find(
        (v: any) => v.id === progress.lastWatchedVideoId,
      );
      if (video) {
        lastVideoTitle = video.title;
        lastChapterTitle = chapter.title;
        const vidProg = progress?.videos?.[progress.lastWatchedVideoId];
        if (vidProg) {
          const formatTime = (secs: number) => {
            const m = Math.floor(secs / 60);
            const s = Math.floor(secs % 60);
            return `${m}:${s < 10 ? "0" : ""}${s}`;
          };
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
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Learning Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Quick Resume Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={(theme) => ({
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
                  : "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)",
              border: 1,
              borderColor: "divider",
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
                  : "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              borderRadius: 4,
            })}
          >
            <CardContent
              sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                p: 3,
              }}
            >
              <Typography
                variant="subtitle1"
                color="primary.main"
                fontWeight="bold"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <PlayIcon fontSize="small" />
                {progress.lastWatchedVideoId
                  ? "JUMP BACK IN"
                  : "READY TO START?"}
              </Typography>

              {progress.lastWatchedVideoId && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 2, textTransform: "uppercase", letterSpacing: 0.5 }}
                >
                  {lastChapterTitle}
                </Typography>
              )}

              <Typography
                variant="h6"
                color="text.primary"
                sx={{ mt: 0.5, fontWeight: 600, lineHeight: 1.3 }}
              >
                {lastVideoTitle}
              </Typography>

              {progress.lastWatchedVideoId && (
                <Box sx={{ mt: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Progress
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      {lastVideoProgressStr}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: "100%",
                      height: 6,
                      bgcolor: "action.hover",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                        bgcolor: "secondary.main",
                        width: `${lastVideoPercent}%`,
                        borderRadius: 3,
                      }}
                    />
                  </Box>
                </Box>
              )}

              <Box sx={{ flexGrow: 1 }} />
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  if (progress.lastWatchedVideoId) {
                    navigate(
                      `/course?v=${encodeURIComponent(progress.lastWatchedVideoId)}`,
                    );
                  } else {
                    navigate("/course");
                  }
                }}
                sx={{
                  mt: 3,
                  borderRadius: 2,
                  py: 1.5,
                  fontWeight: "bold",
                  textTransform: "none",
                  fontSize: "1rem",
                }}
              >
                {progress.lastWatchedVideoId ? "Resume Video" : "Start Course"}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Overall Progress Chart */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            sx={{
              p: 3,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Overall Progress
            </Typography>
            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 200,
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
                        value: remainingVideos,
                        label: "Remaining",
                        color: "#94a3b8",
                      },
                    ],
                    innerRadius: 50,
                    outerRadius: 80,
                    paddingAngle: 2,
                    cornerRadius: 4,
                    cx: 150,
                  },
                ]}
                width={400}
                height={200}
                margin={{ right: 5 }}
              />
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ mt: 2 }}
            >
              {completedVideos} out of {totalVideos} videos completed
            </Typography>
          </Paper>
        </Grid>

        {/* Chapter Breakdown */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
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
                          theme.palette.mode === "dark" ? "#1e293b" : "#e2e8f0",
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
          </Paper>
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
                      {selectedChapter.videos.map(
                        (video: any, vIdx: number) => {
                          const videoProg = progress?.videos?.[video.id];
                          const isCompleted = videoProg?.completed;
                          const percent = videoProg
                            ? videoProg.duration > 0
                              ? (videoProg.currentTime / videoProg.duration) *
                                100
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
                                    fontWeight={isCompleted ? 500 : 400}
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
                        },
                      )}
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
