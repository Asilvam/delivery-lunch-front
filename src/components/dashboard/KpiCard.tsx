// src/components/dashboard/KpiCard.tsx
import { Paper, Typography, Box } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "flat";
  trendLabel?: string;
  icon?: React.ReactNode;
  color?: "primary" | "success" | "warning" | "error";
}

const colorMap = {
  primary: "primary.main",
  success: "success.main",
  warning: "warning.main",
  error: "error.main",
};

export default function KpiCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  color = "primary",
}: KpiCardProps) {
  const TrendIcon =
    trend === "up"
      ? TrendingUpIcon
      : trend === "down"
        ? TrendingDownIcon
        : TrendingFlatIcon;
  const trendColor =
    trend === "up"
      ? "success.main"
      : trend === "down"
        ? "error.main"
        : "text.secondary";

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Typography
          variant="body2"
          color="text.secondary"
          fontWeight={500}
          textTransform="uppercase"
          sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
          letterSpacing={0.5}
        >
          {title}
        </Typography>
        {icon && (
          <Box sx={{ color: `${color}.main`, opacity: 0.8 }}>{icon}</Box>
        )}
      </Box>

      <Typography
        variant="h4"
        fontWeight={800}
        sx={{
          mt: 1,
          mb: 0.5,
          color: colorMap[color],
          fontSize: { xs: "1.6rem", sm: "2rem", md: "2.125rem" },
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </Typography>

      <Box display="flex" alignItems="center" gap={0.5} mt="auto">
        {trend && <TrendIcon sx={{ fontSize: 16, color: trendColor }} />}
        {trendLabel && (
          <Typography variant="caption" sx={{ color: trendColor }}>
            {trendLabel}
          </Typography>
        )}
        {subtitle && !trendLabel && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
