// src/components/dashboard/RevenueChart.tsx
import { Paper, Typography, Box, useTheme } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { parseIsoDate } from "../../shared/utils/date/menuDate";
import type { RevenueByDay } from "../../data/services/statisticsApi.service";

interface RevenueChartProps {
  data: RevenueByDay[];
  title?: string;
}

export default function RevenueChart({
  data,
  title = "Ventas entregadas por día",
}: RevenueChartProps) {
  const theme = useTheme();
  const formatCurrency = (value: number) => `$${value.toLocaleString("es-CL")}`;

  const formatDate = (dateStr: string) => {
    const date = parseIsoDate(dateStr);
    if (!date) return dateStr;
    return date.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
  };

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
          height={250}
          color="text.secondary"
        >
          <Typography>No hay datos en el período seleccionado</Typography>
        </Box>
      ) : (
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <Box
            sx={{ minWidth: data.length > 10 ? data.length * 56 : undefined }}
          >
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={data}
                margin={{ top: 24, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12, angle: 40, textAnchor: "start" }}
                  axisLine={{ stroke: "#e0e0e0" }}
                  height={48}
                  interval={0}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: "#e0e0e0" }}
                  width={80}
                />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value) || 0),
                    "Ingresos",
                  ]}
                  labelFormatter={(label) => formatDate(String(label) || "")}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e0e0e0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar
                  dataKey="total"
                  fill={theme.palette.primary.main}
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                >
                  <LabelList
                    dataKey="total"
                    position="top"
                    formatter={(value) => formatCurrency(Number(value) || 0)}
                    style={{
                      fill: theme.palette.primary.dark,
                      fontWeight: 700,
                      fontSize: 11,
                      textShadow: "0 1px 2px #fff",
                    }}
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
