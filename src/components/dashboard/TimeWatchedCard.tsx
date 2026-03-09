import React from "react";
import { Box, Typography, Card, CardContent } from "@mui/material";
import { AccessTime as ClockIcon } from "@mui/icons-material";
import { formatDuration } from "../../utils/formatters";

interface TimeWatchedCardProps {
  totalWatchedTime: number;
}

export const TimeWatchedCard: React.FC<TimeWatchedCardProps> = ({
  totalWatchedTime,
}) => {
  return (
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
            sx={{
              color: "text.primary",
              letterSpacing: "-1px",
            }}
          >
            {formatDuration(totalWatchedTime)}
          </Typography>
        </Box>

        <Typography
          variant="body2"
          align="center"
          sx={{
            color: "text.secondary",
            mt: 2,
            fontWeight: 500,
          }}
        >
          Total learning time
        </Typography>
      </CardContent>
    </Card>
  );
};
