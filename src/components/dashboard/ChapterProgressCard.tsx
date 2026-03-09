import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
} from "@mui/material";
import { FolderOpen as ChapterIcon } from "@mui/icons-material";

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
  return (
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
          {chapterStats.map((chapter) => {
            const percent =
              chapter.total > 0
                ? Math.round((chapter.completed / chapter.total) * 100)
                : 0;
            const isSelected = selectedChapter?.id === chapter.id;

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={chapter.id}>
                <Card
                  variant="outlined"
                  onClick={() => onSelectChapter(isSelected ? null : chapter)}
                  sx={{
                    p: 2,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    bgcolor: isSelected
                      ? "action.selected"
                      : "background.paper",
                    borderColor: isSelected ? "primary.main" : "divider",
                    "&:hover": {
                      borderColor: "primary.main",
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    },
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    noWrap
                    sx={{ mb: 1, color: "text.primary" }}
                  >
                    {chapter.title}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {chapter.completed} / {chapter.total}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color={percent === 100 ? "success.main" : "primary.main"}
                    >
                      {percent}%
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={percent}
                    color={percent === 100 ? "success" : "primary"}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: "action.hover",
                    }}
                  />
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
};
