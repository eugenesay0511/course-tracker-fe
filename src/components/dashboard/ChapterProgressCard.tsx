import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Grid,
  Avatar,
  useTheme,
  ButtonBase,
} from "@mui/material";
import {
  FolderOpen as ChapterIcon,
  CheckCircleOutline as CheckIcon,
} from "@mui/icons-material";

import { type ChapterStat } from "../../pages/Dashboard";

interface ChapterProgressCardProps {
  chapterStats: ChapterStat[];
  selectedChapter: ChapterStat | null;
  onSelectChapter: (chapter: ChapterStat | null) => void;
}

export const ChapterProgressCard: React.FC<ChapterProgressCardProps> = ({
  chapterStats,
  selectedChapter,
  onSelectChapter,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  return (
    <Card
      sx={{
        borderRadius: 5,
        border: "1px solid",
        borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "divider",
        background: isDarkMode
          ? "linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)"
          : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        backdropFilter: isDarkMode ? "blur(20px)" : "none",
        boxShadow: isDarkMode
          ? "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
          : "0 20px 40px -4px rgba(148, 163, 184, 0.15)",
        overflow: "visible",
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box
          sx={{
            p: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: isDarkMode
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0,0,0,0.04)",
          }}
        >
          <Typography
            variant="subtitle2"
            color="primary.main"
            fontWeight="800"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            <ChapterIcon sx={{ fontSize: 20 }} />
            Chapter Progress
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontWeight: 600 }}
          >
            {chapterStats.length} Chapters Total
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ p: 3 }}>
          {chapterStats.map((chapter, index) => {
            const percent =
              chapter.total > 0
                ? Math.round((chapter.completed / chapter.total) * 100)
                : 0;
            const isSelected = selectedChapter?.id === chapter.id;
            const isCompleted = percent === 100;

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={chapter.id}>
                <ButtonBase
                  onClick={() => onSelectChapter(isSelected ? null : chapter)}
                  sx={{
                    width: "100%",
                    textAlign: "left",
                    display: "block",
                    borderRadius: 4,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      transform: "translateY(-6px)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 4,
                      position: "relative",
                      height: "100%",
                      bgcolor: isSelected
                        ? isDarkMode
                          ? "rgba(56, 189, 248, 0.08)"
                          : "rgba(2, 132, 199, 0.04)"
                        : isDarkMode
                          ? "rgba(255, 255, 255, 0.02)"
                          : "background.paper",
                      border: "1.5px solid",
                      borderColor: isSelected
                        ? "primary.main"
                        : isDarkMode
                          ? "rgba(255, 255, 255, 0.05)"
                          : "divider",
                      boxShadow: isSelected
                        ? isDarkMode
                          ? "0 0 20px rgba(56, 189, 248, 0.2)"
                          : "0 10px 15px -3px rgba(2, 132, 199, 0.1)"
                        : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {/* Status Badge */}
                    <Typography
                      variant="overline"
                      sx={{
                        position: "absolute",
                        top: 12,
                        right: 16,
                        fontWeight: 900,
                        fontSize: "0.65rem",
                        color: isCompleted
                          ? "success.main"
                          : isSelected
                            ? "primary.main"
                            : "text.disabled",
                        letterSpacing: 1,
                      }}
                    >
                      {isCompleted
                        ? "DONE"
                        : percent > 0
                          ? "IN PROGRESS"
                          : "NOT STARTED"}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 3,
                        pr: 8, // Make room for badge
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: isCompleted
                            ? "success.main"
                            : isSelected
                              ? "primary.main"
                              : isDarkMode
                                ? "grey.800"
                                : "grey.100",
                          color:
                            isCompleted || isSelected
                              ? "common.white"
                              : "text.secondary",
                          width: 38,
                          height: 38,
                          fontSize: "0.9rem",
                          fontWeight: "800",
                          border: "2px solid",
                          borderColor: isDarkMode
                            ? "rgba(255,255,255,0.05)"
                            : "transparent",
                        }}
                      >
                        {isCompleted ? (
                          <CheckIcon sx={{ fontSize: 20 }} />
                        ) : (
                          index + 1
                        )}
                      </Avatar>
                      <Typography
                        variant="subtitle2"
                        fontWeight={isSelected ? 800 : 700}
                        color={isSelected ? "primary.main" : "text.primary"}
                        lineHeight={1.3}
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {chapter.title}
                      </Typography>
                    </Box>

                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-end",
                          mb: 1.5,
                        }}
                      >
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600, display: "block" }}
                          >
                            PROGRESS
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                          >
                            {chapter.completed} / {chapter.total} Lessons
                          </Typography>
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 900,
                            lineHeight: 1,
                            fontSize: "1.1rem",
                            color: isCompleted
                              ? "success.main"
                              : "text.primary",
                          }}
                        >
                          {percent}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={percent}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: isDarkMode
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.05)",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 4,
                            background: isCompleted
                              ? "linear-gradient(90deg, #22c55e 0%, #4ade80 100%)"
                              : `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </ButtonBase>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
};
