// src/components/dashboard/CancellationsChart.tsx
import { Paper, Typography, Box } from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { CancellationStats } from "../../data/services/statisticsApi.service";

interface CancellationsChartProps {
  data: CancellationStats[];
  title?: string;
}

const COLORS = ["#4caf50", "#d32f2f"];

// Asegura que el color verde sea para entregados y rojo para cancelados
function getColorByName(name: string) {
  if (name === "Entregados") return "#4caf50";
  if (name === "Cancelados") return "#d32f2f";
  return "#8884d8";
}

export default function CancellationsChart({
  data,
  title = "Tasa de completación",
}: CancellationsChartProps) {
  const chartData = data.map((item) => ({
    name: item.estado === "entregado" ? "Entregados" : "Cancelados",
    value: item.count,
    percentage: item.porcentaje,
  }));

  const total = data.reduce((sum, item) => sum + item.count, 0);

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

      {total === 0 ? (
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
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColorByName(entry.name)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => [
                `${value} (${props?.payload?.percentage || 0}%)`,
                name,
              ]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e0e0e0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span style={{ color: "#333", fontSize: "0.85rem" }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}

      {total > 0 && (
        <Box textAlign="center" mt={1}>
          <Typography variant="h6" fontWeight={700}>
            Entregados: {chartData.find(d => d.name === "Entregados")?.value ?? 0}  |  Cancelados: {chartData.find(d => d.name === "Cancelados")?.value ?? 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            pedidos terminados
          </Typography>
        </Box>
      )}
    </Paper>
  );
}