import React from "react";
import { Box, Typography, Card, CardContent, Button } from "@mui/material";
import { PlayCircleOutline as PlayIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface WelcomeBannerProps {
  lastWatchedVideoId: string | null;
  lastVideoTitle: string;
  lastChapterTitle: string;
  lastVideoProgressStr: string;
  lastVideoPercent: number;
  targetVideoId: string;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  lastWatchedVideoId,
  lastVideoTitle,
  lastChapterTitle,
  lastVideoProgressStr,
  lastVideoPercent,
  targetVideoId,
}) => {
  const navigate = useNavigate();

  return (
    <Card
      elevation={0}
      sx={(theme) => ({
        position: "relative",
        overflow: "hidden",
        borderRadius: 3,
        border: 1,
        borderColor: "divider",
        bgcolor: theme.palette.mode === "dark" ? "background.paper" : "#ffffff",
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
            {lastChapterTitle && (
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

        {lastWatchedVideoId && (
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
        )}

        <Button
          variant="contained"
          onClick={() => {
            if (targetVideoId) {
              navigate(`/course?v=${encodeURIComponent(targetVideoId)}`);
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
          {lastWatchedVideoId ? "Resume" : "Start"}
        </Button>
      </CardContent>

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
  );
};
