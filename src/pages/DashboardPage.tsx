import { staffToast } from "../utils/notifications";
import { PageLayout } from "../components/layout/PageLayout";
import StaffNavigation from "../components/admin/StaffNavigation";
// src/pages/DashboardPage.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Grid,
  CircularProgress,
  LinearProgress,
  Button,
  Alert,
  Typography,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useAuth } from "../hooks/useAuth";
import DateRangeFilter from "../components/dashboard/DateRangeFilter";
import KpiCard from "../components/dashboard/KpiCard";
import RevenueChart from "../components/dashboard/RevenueChart";
import TopDishesChart from "../components/dashboard/TopDishesChart";

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

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Santiago",
  });
  const [startDate, setStartDate] = useState(
    () => sessionStorage.getItem("metrics-from") || today,
  );
  const [endDate, setEndDate] = useState(
    () => sessionStorage.getItem("metrics-to") || today,
  );
  const requestVersion = useRef(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [topDishes, setTopDishes] = useState<TopDish[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [revenue, setRevenue] = useState<RevenueByDay[]>([]);
  const [cancellations, setCancellations] = useState<CancellationStats[]>([]);

  const loadData = useCallback(() => {
    if (!token) return Promise.resolve();
    const version = ++requestVersion.current;
    return Promise.all([
      fetchDashboardSummary(token, startDate, endDate),
      fetchTopDishes(token, startDate, endDate, 5),
      fetchPeakHours(token, startDate, endDate),
      fetchRevenue(token, startDate, endDate),
      fetchCancellations(token, startDate, endDate),
    ])
      .then(
        ([
          summaryRes,
          topDishesRes,
          peakHoursRes,
          revenueRes,
          cancellationsRes,
        ]) => {
          if (version !== requestVersion.current) return;
          setError(null);
          setSummary(summaryRes);
          setTopDishes(topDishesRes);
          setPeakHours(peakHoursRes);
          setRevenue(revenueRes);
          setCancellations(cancellationsRes);
          setUpdatedAt(new Date());
        },
      )
      .catch(() => {
        if (version === requestVersion.current) {
          setError("No pudimos actualizar las métricas. Intenta nuevamente.");
          void staffToast.fire({
            icon: "error",
            title: "No pudimos actualizar las métricas",
            text: "Revisa la conexión y vuelve a intentarlo.",
          });
        }
      })
      .finally(() => {
        if (version === requestVersion.current) setLoading(false);
      });
  }, [token, startDate, endDate]);

  useEffect(() => {
    void loadData();
    return () => {
      requestVersion.current += 1;
    };
  }, [loadData]);

  const handleRangeChange = useCallback(
    (start: string, end: string) => {
      setLoading(true);
      if (start === startDate && end === endDate) {
        void loadData();
        return;
      }
      setStartDate(start);
      setEndDate(end);
      sessionStorage.setItem("metrics-from", start);
      sessionStorage.setItem("metrics-to", end);
    },
    [startDate, endDate, loadData],
  );

  return (
    <PageLayout header={<StaffNavigation />}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography
            component="h1"
            variant="h4"
            fontWeight={800}
            sx={{ fontSize: { xs: "1.65rem", sm: "2.125rem" } }}
          >
            Cómo va tu negocio
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Pedidos recibidos en el período · Horario de Chile
          </Typography>
        </Box>
        <Button
          startIcon={<RefreshIcon />}
          onClick={() => {
            setLoading(true);
            void loadData();
          }}
          disabled={loading}
          sx={{ flexShrink: 0 }}
        >
          Actualizar
        </Button>
      </Box>
      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onRangeChange={handleRangeChange}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}{" "}
          <Button
            onClick={() => {
              setLoading(true);
              void loadData();
            }}
          >
            Reintentar
          </Button>
        </Alert>
      )}

      {updatedAt && !error && (
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ mb: 2 }}
        >
          Actualizado a las{" "}
          {updatedAt.toLocaleTimeString("es-CL", {
            timeZone: "America/Santiago",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Typography>
      )}
      {loading && summary && (
        <LinearProgress aria-label="Actualizando métricas" />
      )}
      {!loading && !error && summary?.pedidosTotales === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No hay pedidos en este período. Prueba con los últimos 7 días.
        </Alert>
      )}
      {loading && !summary ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : summary && !error ? (
        <>
          {/* KPIs */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, sm: 6, md: 3 }} sx={{ minWidth: 0 }}>
              <KpiCard
                title="Pedidos recibidos"
                value={summary?.pedidosTotales ?? 0}
                subtitle="incluye todos los estados"
                icon={<ShoppingCartIcon />}
                color="primary"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 6, md: 3 }} sx={{ minWidth: 0 }}>
              <KpiCard
                title="Ventas entregadas"
                value={`$${(summary?.ingresosTotales ?? 0).toLocaleString("es-CL")}`}
                subtitle={`${summary.pedidosCompletados} pedidos entregados`}
                icon={<AttachMoneyIcon />}
                color="success"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 6, md: 3 }} sx={{ minWidth: 0 }}>
              <KpiCard
                title="Menús vendidos"
                value={summary.menusVendidos}
                subtitle="porciones de pedidos entregados"
                icon={<RestaurantIcon />}
                color="primary"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 6, md: 3 }} sx={{ minWidth: 0 }}>
              <KpiCard
                title="Pedidos por atender"
                value={summary.pedidosPendientes + summary.pedidosEnPreparacion}
                subtitle={`${summary.pedidosPendientes} pendientes · ${summary.pedidosEnPreparacion} en preparación`}
                icon={<PendingActionsIcon />}
                color="warning"
              />
            </Grid>
          </Grid>

          {/* Charts Row 1 */}
          <Grid container spacing={3} sx={{ mb: 3, mt: 0 }}>
            <Grid size={{ xs: 12, md: 7 }} sx={{ mb: { xs: 2, md: 0 } }}>
              <RevenueChart data={revenue} />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }} sx={{ mt: { xs: 1.5, md: 0 } }}>
              <TopDishesChart data={topDishes} />
            </Grid>
          </Grid>

          {/* Charts Row 2 */}
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid
              size={{ xs: 12, md: 7 }}
              sx={{ mb: { xs: 2, md: 0 }, mt: { xs: 1.5, md: 0 } }}
            >
              <PeakHoursHeatmap data={peakHours} />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }} sx={{ mt: { xs: 1.5, md: 0 } }}>
              <CancellationsChart data={cancellations} />
            </Grid>
          </Grid>
        </>
      ) : null}
    </PageLayout>
  );
}
