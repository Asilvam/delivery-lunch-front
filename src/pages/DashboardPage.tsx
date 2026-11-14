import { staffAlert } from "../utils/notifications";
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
  Paper,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useAuth } from "../hooks/useAuth";
import DateRangeFilter from "../components/dashboard/DateRangeFilter";
import KpiCard from "../components/dashboard/KpiCard";
import RevenueChart from "../components/dashboard/RevenueChart";
import TopDishesChart from "../components/dashboard/TopDishesChart";

import PeakHoursHeatmap from "../components/dashboard/PeakHoursHeatmap";
import CancellationsChart from "../components/dashboard/CancellationsChart";
import CompletedOrdersReport from "../components/dashboard/CompletedOrdersReport";
import type { Order } from "../types/order";
import {
  fetchDashboardSummary,
  fetchTopDishes,
  fetchPeakHours,
  fetchRevenue,
  fetchCancellations,
  fetchCompletedOrders,
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
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);

  const loadData = useCallback(() => {
    if (!token) return Promise.resolve();
    const version = ++requestVersion.current;
    return Promise.all([
      fetchDashboardSummary(token, startDate, endDate),
      fetchTopDishes(token, startDate, endDate, 5),
      fetchPeakHours(token, startDate, endDate),
      fetchRevenue(token, startDate, endDate),
      fetchCancellations(token, startDate, endDate),
      fetchCompletedOrders(token, startDate, endDate),
    ])
      .then(
        ([
          summaryRes,
          topDishesRes,
          peakHoursRes,
          revenueRes,
          cancellationsRes,
          completedOrdersRes,
        ]) => {
          if (version !== requestVersion.current) return;
          setError(null);
          setSummary(summaryRes);
          setTopDishes(topDishesRes);
          setPeakHours(peakHoursRes);
          setRevenue(revenueRes);
          setCancellations(cancellationsRes);
          setCompletedOrders(completedOrdersRes);
          setUpdatedAt(new Date());
        },
      )
      .catch(() => {
        if (version === requestVersion.current) {
          setError("No pudimos actualizar las métricas. Intenta nuevamente.");
          void staffAlert.fire({
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
    <PageLayout header={<StaffNavigation />} mobileNavigation>
      <Box sx={{ mb: 2 }}>
        <Typography
          component="h1"
          variant="h4"
          fontWeight={800}
          sx={{ fontSize: { xs: "1.65rem", sm: "2.125rem" } }}
        >
          Cómo va tu negocio
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Pedidos recibidos en el período
        </Typography>
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
          <Typography
            component="h2"
            variant="h6"
            fontWeight={700}
            sx={{ mb: 2 }}
          >
            {startDate === endDate ? "Resumen del día" : "Resumen del período"}
          </Typography>
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
                value={
                  summary.pedidosPendientes +
                  summary.pedidosEnPreparacion +
                  (summary.pedidosListos ?? 0)
                }
                subtitle={`${summary.pedidosPendientes} pendientes · ${summary.pedidosEnPreparacion} en preparación${summary.pedidosListos ? ` · ${summary.pedidosListos} listos` : ""}`}
                icon={<PendingActionsIcon />}
                color="warning"
              />
            </Grid>
          </Grid>

          {/* Charts Row 1 */}
          {summary.pagos && (
            <Paper
              component="section"
              aria-labelledby="payments-title"
              variant="outlined"
              sx={{ p: { xs: 2, sm: 2.5 }, mb: 3 }}
            >
              <Typography
                id="payments-title"
                component="h2"
                variant="h6"
                fontWeight={700}
              >
                Pagos
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "minmax(0, 1fr)",
                    md: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: 2,
                  mt: 2,
                }}
              >
                <KpiCard
                  title="Cobrado"
                  value={`$${summary.pagos.total.toLocaleString("es-CL")}`}
                  icon={<AccountBalanceWalletOutlinedIcon />}
                  color="success"
                >
                  <Box
                    sx={{
                      display: "grid",
                      gap: 1,
                      pt: 1.5,
                      mt: 1,
                      borderTop: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    {[
                      {
                        label: "Efectivo",
                        value: summary.pagos.efectivo,
                        icon: PaymentsOutlinedIcon,
                      },
                      {
                        label: "Transferencia",
                        value: summary.pagos.transferencia,
                        icon: AccountBalanceOutlinedIcon,
                      },
                    ].map(({ label, value, icon: Icon }) => (
                      <Box
                        key={label}
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Icon sx={{ fontSize: 18, color: "text.secondary" }} />
                        <Typography variant="body2" color="text.secondary">
                          {label}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{
                            ml: "auto",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          ${value.toLocaleString("es-CL")}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </KpiCard>
                <KpiCard
                  title="Por cobrar"
                  value={`$${summary.pagos.porCobrar.toLocaleString("es-CL")}`}
                  subtitle="Pedidos entregados del período marcados con pago pendiente."
                  icon={<PendingActionsIcon />}
                  color={summary.pagos.porCobrar > 0 ? "warning" : "primary"}
                />
                <KpiCard
                  title="Sin registro de pago"
                  value={`${summary.pagos.sinRegistro} ${summary.pagos.sinRegistro === 1 ? "pedido" : "pedidos"}`}
                  subtitle="Pedidos entregados del período cuyo pago aún no se ha registrado."
                  icon={<HelpOutlineIcon />}
                  color={summary.pagos.sinRegistro > 0 ? "warning" : "primary"}
                />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 2 }}
              >
                Los cobros se agrupan por fecha de registro. Los pagos de
                pedidos cancelados se revisan manualmente.
              </Typography>
            </Paper>
          )}
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
          <CompletedOrdersReport
            key={`${startDate}:${endDate}`}
            orders={completedOrders}
            startDate={startDate}
            endDate={endDate}
            loading={loading}
            summary={summary}
            onPaymentRecorded={() => void loadData()}
          />
        </>
      ) : null}
    </PageLayout>
  );
}
