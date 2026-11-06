import { Paper, Typography, Box, LinearProgress } from "@mui/material";
import type { TopDish } from "../../data/services/statisticsApi.service";

interface TopDishesChartProps {
  data: TopDish[];
  title?: string;
  limit?: number;
}

export default function TopDishesChart({
  data,
  title = "Platos más vendidos",
  limit = 5,
}: TopDishesChartProps) {
  const dishes = data.slice(0, limit);
  const max = Math.max(...dishes.map((dish) => dish.cantidadVendida), 1);
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
      }}
    >
      <Typography component="h2" variant="subtitle1" fontWeight={700}>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Porciones entregadas en el período
      </Typography>
      {dishes.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 250,
            color: "text.secondary",
          }}
        >
          <Typography>No hay datos en el período seleccionado</Typography>
        </Box>
      ) : (
        <Box
          component="ol"
          sx={{ listStyle: "none", p: 0, m: 0, mt: 2, display: "grid", gap: 2 }}
        >
          {dishes.map((dish) => (
            <Box component="li" key={dish.nombre}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 2,
                  justifyContent: "space-between",
                  mb: 0.75,
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {/^hipo$/i.test(dish.nombre)
                    ? "Menú hipocalórico"
                    : dish.nombre}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={800}
                  color="primary.dark"
                  sx={{ flexShrink: 0 }}
                >
                  {dish.cantidadVendida}{" "}
                  {dish.cantidadVendida === 1 ? "menú" : "menús"}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(dish.cantidadVendida / max) * 100}
                aria-hidden="true"
                sx={{
                  height: 7,
                  borderRadius: 4,
                  bgcolor: "secondary.light",
                  "& .MuiLinearProgress-bar": { borderRadius: 4 },
                }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
