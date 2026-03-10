import React from "react";
import { Box, Typography, Card, CardContent } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { CheckCircle as CheckCircleIcon } from "@mui/icons-material";

interface OverallProgressCardProps {
  completedVideos: number;
  remainingVideos: number;
  totalVideos: number;
}

export const OverallProgressCard: React.FC<OverallProgressCardProps> = ({
  completedVideos,
  remainingVideos,
  totalVideos,
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
                cx: 140,
              },
            ]}
            width={340}
            height={180}
            margin={{ right: 80 }}
            slotProps={{
              legend: {
                direction: "vertical",
                position: { vertical: "middle", horizontal: "end" },
                sx: {
                  fontSize: 12,
                  fontWeight: 600,
                  "& .MuiChartsLegend-mark": {
                    width: 10,
                    height: 10,
                  },
                },
              },
            }}
          />
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
          {completedVideos} of {totalVideos} videos done
        </Typography>
      </CardContent>
    </Card>
  );
};
