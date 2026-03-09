import React from "react";
import { Box, Typography } from "@mui/material";

interface ShortcutTooltipProps {
  label: string;
  shortcut: string;
}

export const ShortcutTooltip: React.FC<ShortcutTooltipProps> = ({
  label,
  shortcut,
}) => (
  <Box
    sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.25, px: 0.5 }}
  >
    <Typography
      variant="caption"
      sx={{ fontWeight: 700, fontSize: "0.75rem", color: "inherit" }}
    >
      {label}
    </Typography>
    <Box
      sx={{
        px: 0.75,
        py: 0.4,
        minWidth: 20,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 1.25,
        bgcolor: "rgba(255, 255, 255, 0.15)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: "0 2px 0 rgba(0, 0, 0, 0.2)",
        fontSize: "0.65rem",
        fontWeight: 900,
        color: "white",
        lineHeight: 1,
        textTransform: "uppercase",
      }}
    >
      {shortcut}
    </Box>
  </Box>
);

export const shortcutTooltipProps = {
  slotProps: {
    tooltip: {
      sx: {
        bgcolor: "rgba(15, 23, 42, 0.9)",
        backdropFilter: "blur(4px)",
        borderRadius: 2,
        p: 0.5,
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
      },
    },
  },
};
