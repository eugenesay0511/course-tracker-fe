import React, { useState } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  PlayCircleOutline as PlayIcon,
  CheckCircle as CheckCircleIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import type { VideoProgress } from "../hooks/useCourseProgress";

interface Video {
  id: string;
  title: string;
  filename: string;
  path: string;
  srtPath?: string | null;
}

interface Chapter {
  id: string;
  title: string;
  videos: Video[];
}

interface CourseOutlineProps {
  data: Chapter[];
  activeVideoId: string | null;
  onVideoSelect: (video: Video) => void;
  getProgress: (videoId: string) => VideoProgress | undefined;
  markVideoUncompleted: (videoId: string) => void;
}

interface VideoListItemProps {
  video: Video;
  isActive: boolean;
  isCompleted: boolean;
  onVideoSelect: (video: Video) => void;
  markVideoUncompleted: (videoId: string) => void;
}

const VideoListItem = React.memo(
  ({
    video,
    isActive,
    isCompleted,
    onVideoSelect,
    markVideoUncompleted,
  }: VideoListItemProps) => (
    <ListItem
      disablePadding
      secondaryAction={
        isCompleted ? (
          <Tooltip title="Mark as unread">
            <IconButton
              edge="end"
              aria-label="mark unread"
              onClick={(e) => {
                e.stopPropagation();
                markVideoUncompleted(video.id);
              }}
            >
              <ClearIcon fontSize="small" sx={{ color: "text.secondary" }} />
            </IconButton>
          </Tooltip>
        ) : null
      }
    >
      <ListItemButton
        selected={isActive}
        onClick={() => onVideoSelect(video)}
        sx={(theme) => ({
          pl: 4,
          py: 1.5,
          "&.Mui-selected": {
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(59, 130, 246, 0.15)"
                : "rgba(37, 99, 235, 0.1)",
            borderLeft: 4,
            borderColor: "primary.main",
            "&:hover": {
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(59, 130, 246, 0.25)"
                  : "rgba(37, 99, 235, 0.2)",
            },
          },
          borderLeft: "4px solid transparent",
        })}
      >
        <ListItemIcon sx={{ minWidth: 36 }}>
          {isCompleted ? (
            <CheckCircleIcon color="secondary" fontSize="small" />
          ) : (
            <PlayIcon
              color={isActive ? "primary" : "action"}
              fontSize="small"
            />
          )}
        </ListItemIcon>
        <ListItemText
          primary={video.title}
          primaryTypographyProps={{
            variant: "body2",
            fontWeight: isActive ? 600 : 400,
            color: isActive ? "primary.main" : "text.primary",
            sx: {
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
          }}
        />
      </ListItemButton>
    </ListItem>
  ),
);

export const CourseOutline: React.FC<CourseOutlineProps> = ({
  data,
  activeVideoId,
  onVideoSelect,
  getProgress,
  markVideoUncompleted,
}) => {
  const [expanded, setExpanded] = useState<string | false>(false);

  // Auto-expand the chapter containing the active video whenever it changes
  React.useEffect(() => {
    if (activeVideoId) {
      const chapter = data.find((c) =>
        c.videos.some((v) => String(v.id) === String(activeVideoId)),
      );
      if (chapter) {
        setExpanded(chapter.id);
      }
    }
  }, [activeVideoId, data]);

  const handleChange =
    (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <Box
      sx={(theme) => ({
        width: "100%",
        height: "100%",
        overflowY: "auto",
        bgcolor: "background.paper",
        "&::-webkit-scrollbar": {
          width: "6px",
        },
        "&::-webkit-scrollbar-track": {
          bgcolor: "transparent",
        },
        "&::-webkit-scrollbar-thumb": {
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          borderRadius: "10px",
          "&:hover": {
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.2)"
                : "rgba(0, 0, 0, 0.2)",
          },
        },
        scrollbarWidth: "thin",
        scrollbarColor:
          theme.palette.mode === "dark"
            ? "rgba(255, 255, 255, 0.1) transparent"
            : "rgba(0, 0, 0, 0.1) transparent",
      })}
    >
      <Typography
        variant="h6"
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
          fontWeight: "bold",
        }}
      >
        Course Outline
      </Typography>
      {data.map((chapter) => {
        const isChapterActive =
          activeVideoId &&
          chapter.videos.some((v) => String(v.id) === String(activeVideoId));

        return (
          <Accordion
            key={chapter.id}
            expanded={expanded === chapter.id}
            onChange={handleChange(chapter.id)}
            disableGutters
            square
            sx={{
              "&:before": { display: "none" },
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary" }} />}
              sx={(theme) => ({
                bgcolor:
                  isChapterActive && expanded !== chapter.id
                    ? theme.palette.mode === "dark"
                      ? "rgba(59, 130, 246, 0.1)"
                      : "rgba(37, 99, 235, 0.05)"
                    : "transparent",
                borderLeft: 4,
                borderColor:
                  isChapterActive && expanded !== chapter.id
                    ? "primary.main"
                    : "transparent",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.03)",
                },
              })}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight:
                    isChapterActive && expanded !== chapter.id ? 700 : 700, // Always bold but conditional color
                  color:
                    isChapterActive && expanded !== chapter.id
                      ? "primary.main"
                      : "text.primary",
                  transition: "color 0.2s ease",
                }}
              >
                {chapter.title}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List disablePadding>
                {chapter.videos.map((video) => {
                  const progress = getProgress(video.id);
                  const isCompleted = progress?.completed || false;
                  const isActive = String(activeVideoId) === String(video.id);

                  return (
                    <VideoListItem
                      key={video.id}
                      video={video}
                      isActive={isActive}
                      isCompleted={isCompleted}
                      onVideoSelect={onVideoSelect}
                      markVideoUncompleted={markVideoUncompleted}
                    />
                  );
                })}
              </List>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};
