import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Pagination,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { PageLayout } from "../components/layout/PageLayout";
import StaffNavigation from "../components/admin/StaffNavigation";
import { useAuth } from "../hooks/useAuth";
import {
  appAlert,
  staffAlert,
  STAFF_ACTION_DURATION_MS,
} from "../utils/notifications";
import {
  blockCustomer,
  deleteCustomer,
  fetchCustomers,
  type CustomerFilter,
} from "../data/services/customersApi.service";
import type { CustomerPage, CustomerRow } from "../types/customer";
const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "America/Santiago",
      }).format(new Date(value))
    : "Sin pedidos";
export default function CustomersPage() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CustomerFilter>("all");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<CustomerPage | null>(null);
  const [finishedRequest, setFinishedRequest] = useState("");
  const requestKey = JSON.stringify([token, query, status, page, revision]);
  const loading = finishedRequest !== requestKey;
  const [failed, setFailed] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void fetchCustomers(token, { q: query, status, page }, controller.signal)
      .then((next) => {
        if (controller.signal.aborted) return;
        const last = Math.max(1, Math.ceil(next.total / next.pageSize));
        if (page > last) {
          setPage(last);
          return;
        }
        setData(next);
        setFailed(false);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || axios.isCancel(error)) return;
        setFailed(true);
        setData(null);
        void staffAlert.fire({
          icon: "error",
          title: "No pudimos cargar los clientes. Intenta nuevamente.",
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setFinishedRequest(requestKey);
      });
    return () => controller.abort();
  }, [token, query, status, page, revision, requestKey]);
  const changeBlock = async (customer: CustomerRow) => {
    if (!token || updating) return;
    const blocked = !customer.blocked;
    const result = await appAlert.fire({
      icon: "warning",
      title: blocked ? "¿Bloquear este cliente?" : "¿Habilitar este cliente?",
      text: blocked
        ? `${customer.name} no podrá hacer nuevos pedidos. Sus pedidos registrados se conservan.`
        : `${customer.name} podrá iniciar sesión con Google y hacer pedidos sujetos a aprobación.`,
      showCancelButton: true,
      confirmButtonText: blocked ? "Bloquear cliente" : "Habilitar cliente",
      cancelButtonText: "Volver",
      ...(blocked
        ? {
            input: "text" as const,
            inputLabel: "Motivo interno (opcional)",
            inputAttributes: { maxlength: "300" },
          }
        : {}),
    });
    if (!result.isConfirmed) return;
    setUpdating(customer.googleId);
    try {
      await blockCustomer(
        token,
        customer.googleId,
        blocked,
        typeof result.value === "string" ? result.value.trim() : undefined,
      );
      setRevision((value) => value + 1);
      void staffAlert.fire({
        icon: "success",
        title: blocked ? "Cliente bloqueado" : "Cliente habilitado",
        timer: STAFF_ACTION_DURATION_MS,
      });
    } catch {
      void staffAlert.fire({
        icon: "error",
        title: "No pudimos cambiar el acceso del cliente. Intenta nuevamente.",
      });
    } finally {
      setUpdating(null);
    }
  };
  const removeCustomer = async (customer: CustomerRow) => {
    if (!token || updating) return;
    const result = await appAlert.fire({
      icon: "warning",
      title: "¿Eliminar este cliente?",
      text: `Se quitará a ${customer.name} del listado y se cerrará su sesión. Sus pedidos se conservan. Si vuelve a ingresar con Google, reaparecerá.`,
      showCancelButton: true,
      confirmButtonText: "Eliminar cliente",
      cancelButtonText: "Volver",
    });
    if (!result.isConfirmed) return;
    setUpdating(customer.googleId);
    try {
      await deleteCustomer(token, customer.googleId);
      setRevision((value) => value + 1);
      void staffAlert.fire({
        icon: "success",
        title: "Cliente eliminado",
        timer: STAFF_ACTION_DURATION_MS,
      });
    } catch {
      void staffAlert.fire({
        icon: "error",
        title: "No pudimos eliminar al cliente. Intenta nuevamente.",
      });
    } finally {
      setUpdating(null);
    }
  };
  return (
    <PageLayout header={<StaffNavigation />} mobileNavigation>
      <Typography
        component="h1"
        variant="h4"
        fontWeight={800}
        sx={{ fontSize: { xs: "1.65rem", sm: "2.125rem" } }}
      >
        Clientes
      </Typography>
      <Typography
        color="text.secondary"
        variant="body2"
        sx={{ mt: 0.75, mb: 2.5 }}
      >
        Consulta sus pedidos y administra el acceso para comprar.
      </Typography>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2.5,
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "minmax(0,1fr) 200px" },
        }}
      >
        <TextField
          label="Buscar nombre, correo o teléfono"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          fullWidth
        />
        <TextField
          select
          label="Acceso"
          value={status}
          size="small"
          onChange={(e) => {
            setStatus(e.target.value as CustomerFilter);
            setPage(1);
          }}
        >
          <MenuItem value="all">Todos</MenuItem>
          <MenuItem value="active">Habilitados</MenuItem>
          <MenuItem value="blocked">Bloqueados</MenuItem>
        </TextField>
      </Paper>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Typography component="h2" variant="subtitle2" fontWeight={700}>
          {data
            ? `${data.total} ${data.total === 1 ? "cliente" : "clientes"}`
            : "Listado de clientes"}
        </Typography>
        {loading && (
          <CircularProgress size={18} aria-label="Cargando clientes" />
        )}
        {failed && !loading && (
          <Button onClick={() => setRevision((value) => value + 1)}>
            Reintentar carga
          </Button>
        )}
      </Box>
      <Box aria-busy={loading} sx={{ display: "grid", gap: 1.5 }}>
        {data?.items.map((customer) => (
          <Paper
            component="article"
            variant="outlined"
            key={customer.googleId}
            sx={{
              p: { xs: 2, md: 2.5 },
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "minmax(0,2fr) minmax(0,2fr) 1fr auto",
              },
              gap: 2,
              alignItems: "center",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="h3"
                variant="subtitle2"
                fontWeight={800}
                sx={{ overflowWrap: "anywhere" }}
              >
                {customer.name}
              </Typography>
              <Chip
                size="small"
                label={customer.blocked ? "Bloqueado" : "Habilitado"}
                color={customer.blocked ? "error" : "success"}
                variant="outlined"
                sx={{ mt: 0.75 }}
              />
              {customer.blocked && customer.blockReason && (
                <Typography
                  variant="caption"
                  sx={{ display: "block", mt: 0.75, overflowWrap: "anywhere" }}
                  color="text.secondary"
                >
                  Motivo: {customer.blockReason}
                </Typography>
              )}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                {customer.email || "Sin correo registrado"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {customer.phone || "Sin teléfono registrado"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={700}>
                {customer.totalOrders}{" "}
                {customer.totalOrders === 1 ? "pedido" : "pedidos"} ·{" "}
                {customer.approvedOrders}{" "}
                {customer.approvedOrders === 1 ? "aprobado" : "aprobados"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Último: {date(customer.lastOrderAt)}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                justifyContent: { md: "flex-end" },
              }}
            >
              <Button
                variant="outlined"
                color={customer.blocked ? "primary" : "error"}
                onClick={() => void changeBlock(customer)}
                disabled={updating !== null || loading}
                aria-label={`${customer.blocked ? "Habilitar" : "Bloquear"} a ${customer.name}`}
                sx={{
                  minHeight: 44,
                  justifySelf: { xs: "stretch", md: "end" },
                }}
              >
                {updating === customer.googleId ? (
                  <CircularProgress size={18} />
                ) : customer.blocked ? (
                  "Habilitar"
                ) : (
                  "Bloquear"
                )}
              </Button>
              <Button
                color="error"
                onClick={() => void removeCustomer(customer)}
                disabled={updating !== null || loading}
                aria-label={`Eliminar a ${customer.name}`}
                sx={{ minHeight: 44 }}
              >
                Eliminar
              </Button>
            </Box>
          </Paper>
        ))}
        {!loading && data?.total === 0 && (
          <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
            <Typography>No hay clientes para esta búsqueda.</Typography>
          </Paper>
        )}
      </Box>
      {data && data.total > data.pageSize && (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Pagination
            page={page}
            count={Math.ceil(data.total / data.pageSize)}
            onChange={(_, value) => setPage(value)}
            size="small"
            aria-label="Páginas de clientes"
          />
        </Box>
      )}
    </PageLayout>
  );
}
