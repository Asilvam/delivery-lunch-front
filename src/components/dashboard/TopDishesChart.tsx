// src/components/dashboard/TopDishesChart.tsx
import { Paper, Typography, Box } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import type { TopDish } from "../../data/services/statisticsApi.service";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

interface TopDishesChartProps {
  data: TopDish[];
  title?: string;
  limit?: number;
}

const COLORS = ["#1976d2", "#388e3c", "#f57c00", "#7b1fa2", "#d32f2f"];

export default function TopDishesChart({
  data,
  title = "Platos más vendidos",
  limit = 5,
}: TopDishesChartProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const chartData = data.slice(0, limit).map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
  }));

  // Responsive minWidth for chart on mobile
  const chartMinWidth = isMobile ? 340 : undefined;
  // Alto de barra más grande para mejor legibilidad
  const barHeight = isMobile ? 56 : 64;
  const chartHeight = Math.max(barHeight * chartData.length, isMobile ? 220 : 320);
  // Más ancho para nombres
  const yAxisWidth = isMobile ? 110 : 170;

  return (
    <Paper
      elevation={0}
      sx={{
        p: isMobile ? 1.5 : 2.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} mb={2} fontSize={isMobile ? 15 : undefined}>
        {title}
      </Typography>

      {chartData.length === 0 ? (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          height={chartHeight}
          color="text.secondary"
        >
          <Typography fontSize={isMobile ? 13 : undefined}>No hay datos en el período seleccionado</Typography>
        </Box>
      ) : (
        <Box sx={{ width: "100%", overflowX: isMobile ? "auto" : "visible" }}>
          <Box sx={{ minWidth: chartMinWidth }}>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: isMobile ? 8 : 20, left: isMobile ? 2 : 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  axisLine={{ stroke: "#e0e0e0" }}
                />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  tick={{ fontSize: isMobile ? 9 : 11 }}
                  axisLine={{ stroke: "#e0e0e0" }}
                  width={yAxisWidth}
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === "cantidadVendida"
                      ? `${Number(value) || 0} unidades`
                      : `$${(Number(value) || 0).toLocaleString("es-CL")}`,
                    name === "cantidadVendida" ? "Vendidos" : "Ingresos",
                  ]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e0e0e0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    fontSize: isMobile ? 12 : undefined,
                  }}
                />
                 <Bar dataKey="cantidadVendida" radius={[0, 4, 4, 0]}>
                   {chartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                    <LabelList
                      dataKey="cantidadVendida"
                      position="right"
                      content={({ x, y, value }) => (
                        <text
                          x={typeof x === 'number' ? x + 16 : undefined}
                          y={y}
                          dy={6}
                          fontSize={isMobile ? 16 : 20}
                          fontWeight={800}
                          fill="#222"
                          stroke="#fff"
                          strokeWidth={2}
                          paintOrder="stroke"
                          style={{
                            filter: 'drop-shadow(0 1px 2px #fff)',
                            pointerEvents: 'none',
                          }}
                          textAnchor="start"
                        >
                          {value}
                        </text>
                      )}
                    />
                 </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}
    </Paper>
  );
}