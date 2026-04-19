// src/components/dashboard/PeakHoursHeatmap.tsx
import { Paper, Typography, Box } from "@mui/material";
import type { PeakHour } from "../../data/services/statisticsApi.service";

interface PeakHoursHeatmapProps {
  data: PeakHour[];
  title?: string;
}

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6:00 to 22:00

export default function PeakHoursHeatmap({
  data,
  title = "Horas pico de pedidos",
}: PeakHoursHeatmapProps) {
  // Create a matrix for the heatmap
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const getIntensity = (count: number) => {
    if (count === 0) return 0;
    return Math.min(Math.ceil((count / maxCount) * 4), 4);
  };

  const getCellColor = (intensity: number) => {
    const colors = [
      "#f5f5f5",
      "#c8e6c9",
      "#81c784",
      "#4caf50",
      "#2e7d32",
    ];
    return colors[intensity];
  };

  // Create lookup map for quick access
  const dataMap = new Map<string, number>();
  data.forEach((d) => {
    const key = `${d.dayOfWeek}-${d.hour}`;
    dataMap.set(key, d.count);
  });

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} mb={2}>
        {title}
      </Typography>

      {data.length === 0 ? (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          height={200}
          color="text.secondary"
        >
          <Typography>No hay datos en el período seleccionado</Typography>
        </Box>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          {/* Hour labels */}
          <Box display="flex" ml={4} mb={0.5}>
            {HOURS.map((hour) => (
              <Box
                key={hour}
                sx={{
                  width: 28,
                  textAlign: "center",
                  fontSize: "0.65rem",
                  color: "text.secondary",
                }}
              >
                {hour}
              </Box>
            ))}
          </Box>

          {/* Rows for each day */}
          {DAYS.map((day, dayIndex) => (
            <Box key={day} display="flex" alignItems="center" mb={0.5}>
              <Box
                sx={{
                  width: 32,
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "text.secondary",
                }}
              >
                {day}
              </Box>
              {HOURS.map((hour) => {
                // dayOfWeek: 1=Sun, 2=Mon... so Mon=2, Sun=1
                const dayOfWeek = dayIndex + 2 > 7 ? dayIndex - 5 : dayIndex + 2;
                const count = dataMap.get(`${dayOfWeek}-${hour}`) || 0;
                const intensity = getIntensity(count);

                return (
                  <Box
                    key={`${day}-${hour}`}
                    sx={{
                      width: 28,
                      height: 24,
                      backgroundColor: getCellColor(intensity),
                      borderRadius: 0.5,
                      mx: 0.25,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "default",
                      transition: "all 0.2s",
                      "&:hover": {
                        transform: "scale(1.1)",
                        boxShadow: 1,
                      },
                    }}
                    title={`${day} ${hour}:00 - ${count} pedidos`}
                  >
                    {count > 0 && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.6rem",
                          fontWeight: 600,
                          color: intensity >= 3 ? "white" : "text.primary",
                        }}
                      >
                        {count}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          ))}

          {/* Legend */}
          <Box display="flex" alignItems="center" justifyContent="center" mt={2} gap={1}>
            <Typography variant="caption" color="text.secondary">
              Menos
            </Typography>
            {["#f5f5f5", "#c8e6c9", "#81c784", "#4caf50", "#2e7d32"].map(
              (color, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 16,
                    height: 16,
                    backgroundColor: color,
                    borderRadius: 0.5,
                  }}
                />
              ),
            )}
            <Typography variant="caption" color="text.secondary">
              Más
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
}