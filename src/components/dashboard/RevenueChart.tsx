// src/components/dashboard/RevenueChart.tsx
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
} from "recharts";
import type { RevenueByDay } from "../../data/services/statisticsApi.service";

interface RevenueChartProps {
  data: RevenueByDay[];
  title?: string;
}

export default function RevenueChart({ data, title = "Ingresos por día" }: RevenueChartProps) {
  const formatCurrency = (value: number) =>
    `$${value.toLocaleString("es-CL")}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
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
         <Box sx={{ width: data.length > 10 ? data.length * 56 : '100%', overflowX: data.length > 10 ? 'auto' : 'visible' }}>
           <ResponsiveContainer width="100%" height={250}>
             <BarChart data={data} margin={{ top: 24, right: 20, left: 10, bottom: 5 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
               <XAxis
                 dataKey="date"
                 tickFormatter={formatDate}
                 tick={{ fontSize: 12, angle: 40, textAnchor: 'start' }}
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
                 formatter={(value) => [formatCurrency(Number(value) || 0), "Ingresos"]}
                 labelFormatter={(label) => formatDate(String(label) || "")}
                 contentStyle={{
                   borderRadius: 8,
                   border: "1px solid #e0e0e0",
                   boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                 }}
               />
               <Bar dataKey="total" fill="#1976d2" radius={[4, 4, 0, 0]} barSize={32}>
                 <LabelList
                   dataKey="total"
                   position="top"
                     formatter={undefined}
                     // El valor ya está formateado en el dataKey si se requiere
                   style={{
                     fill: '#1976d2',
                     fontWeight: 700,
                     fontSize: 11,
                     textShadow: '0 1px 2px #fff',
                   }}
                 />
               </Bar>
             </BarChart>
           </ResponsiveContainer>
         </Box>
      )}
    </Paper>
  );
}