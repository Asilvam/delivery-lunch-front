// src/pages/DashboardPage.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Typography,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { useAuth } from "../hooks/useAuth";
import AdminNavigation from "../components/admin/AdminNavigation";
import DateRangeFilter from "../components/dashboard/DateRangeFilter";
import KpiCard from "../components/dashboard/KpiCard";
import RevenueChart from "../components/dashboard/RevenueChart";
import TopDishesChart from "../components/dashboard/TopDishesChart";

// Utilidad para obtener el nombre base del plato (sin variaciones)
function getBaseDishName(nombre: string): string {
  // Puedes ajustar este regex según tus variaciones reales
  return nombre.replace(/\s*(con|sin)\s+(ensalada|postre|bebida|jugos?|salsas?|guarnici[oó]n|extra.*)$/i, "").trim();
}

// Agrupa y suma los platos por nombre base
function groupTopDishesByBaseName(topDishes: TopDish[]): TopDish[] {
  const grouped: Record<string, TopDish> = {};
  for (const dish of topDishes) {
    const baseName = getBaseDishName(dish.nombre);
    if (!grouped[baseName]) {
      grouped[baseName] = {
        ...dish,
        nombre: baseName,
        cantidadVendida: 0,
        ingresosTotales: 0,
        porcentajeVentas: 0,
      };
    }
    grouped[baseName].cantidadVendida += dish.cantidadVendida;
    grouped[baseName].ingresosTotales += dish.ingresosTotales;
    grouped[baseName].porcentajeVentas += dish.porcentajeVentas;
  }
  // Ordena por cantidad vendida descendente
  return Object.values(grouped).sort((a, b) => b.cantidadVendida - a.cantidadVendida);
}
import PeakHoursHeatmap from "../components/dashboard/PeakHoursHeatmap";
import CancellationsChart from "../components/dashboard/CancellationsChart";
import {
  fetchDashboardSummary,
  fetchTopDishes,
  fetchPeakHours,
  fetchRevenue,
  fetchCancellations,
  type DashboardSummary,
  type TopDish,
  type PeakHour,
  type RevenueByDay,
  type CancellationStats,
} from "../data/services/statisticsApi.service";

export default function DashboardPage() {
  const { token } = useAuth();

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" });
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [topDishes, setTopDishes] = useState<TopDish[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [revenue, setRevenue] = useState<RevenueByDay[]>([]);
  const [cancellations, setCancellations] = useState<CancellationStats[]>([]);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const [summaryRes, topDishesRes, peakHoursRes, revenueRes, cancellationsRes] =
        await Promise.all([
          fetchDashboardSummary(token, startDate, endDate),
          fetchTopDishes(token, startDate, endDate, 5),
          fetchPeakHours(token, startDate, endDate),
          fetchRevenue(token, startDate, endDate),
          fetchCancellations(token, startDate, endDate),
        ]);
      setSummary(summaryRes);
      setTopDishes(topDishesRes);
      setPeakHours(peakHoursRes);
      setRevenue(revenueRes);
      setCancellations(cancellationsRes);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Error al cargar los datos del dashboard");
    } finally {
      setLoading(false);
    }
  }, [token, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRangeChange = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  return (
    <>
      <AdminNavigation />

      <Container maxWidth="xl" sx={{ mt: 2, mb: 1.5 }}>
        <Box mb={3}>
          <Typography variant="h4" fontWeight={800}>
            Métricas
          </Typography>
          <Typography color="text.secondary">
            Revisa ventas, demanda y desempeño del servicio.
          </Typography>
        </Box>
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onRangeChange={handleRangeChange}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* KPIs */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ mb: { xs: 2.5, sm: 0 } }}>
                <KpiCard
                  title="Pedidos"
                  value={summary?.pedidosTotales ?? 0}
                  subtitle="total en el período"
                  icon={<ShoppingCartIcon />}
                  color="primary"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ mb: { xs: 2.5, sm: 0 } }}>
                <KpiCard
                  title="Ingresos"
                  value={`$${(summary?.ingresosTotales ?? 0).toLocaleString("es-CL")}`}
                  subtitle="total en el período"
                  icon={<AttachMoneyIcon />}
                  color="success"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ mb: { xs: 2.5, sm: 0 } }}>
                <KpiCard
                  title="Completación"
                  value={`${summary?.tasaCompletacion ?? 0}%`}
                  subtitle={`${summary?.pedidosCompletados ?? 0} de ${summary?.pedidosTotales ?? 0}`}
                  icon={<CheckCircleIcon />}
                  color="primary"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ mb: { xs: 2.5, sm: 0 } }}>
                <KpiCard
                  title="Ticket Promedio"
                  value={`$${(summary?.ticketPromedio ?? 0).toLocaleString("es-CL")}`}
                  subtitle="por pedido"
                  icon={<ReceiptIcon />}
                  color="warning"
                />
              </Grid>
            </Grid>

            {/* Charts Row 1 */}
            <Grid container spacing={3} sx={{ mb: 3, mt: { md: 6, xs: 0 } }}>
              <Grid size={{ xs: 12, md: 7 }} sx={{ mb: { xs: 2, md: 0 } }}>
                <RevenueChart data={revenue} />
              </Grid>
              <Grid size={{ xs: 12, md: 5 }} sx={{ mt: { xs: 1.5, md: 0 } }}>
                <TopDishesChart data={groupTopDishesByBaseName(topDishes)} />
              </Grid>
            </Grid>

            {/* Charts Row 2 */}
            <Grid container spacing={3} sx={{ mt: { md: 6, xs: 0 } }}>
              <Grid size={{ xs: 12, md: 7 }} sx={{ mb: { xs: 2, md: 0 }, mt: { xs: 1.5, md: 0 } }}>
                <PeakHoursHeatmap data={peakHours} />
              </Grid>
              <Grid size={{ xs: 12, md: 5 }} sx={{ mt: { xs: 1.5, md: 0 } }}>
                <CancellationsChart data={cancellations} />
              </Grid>
            </Grid>
          </>
        )}
      </Container>
    </>
  );
}
