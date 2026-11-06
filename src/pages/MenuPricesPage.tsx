import { useMountedRef } from "../hooks/useMountedRef";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { appAlert, staffToast } from "../utils/notifications";
import StaffNavigation from "../components/admin/StaffNavigation";
import { PageLayout } from "../components/layout/PageLayout";
import MenuPricesEditor from "../components/admin/MenuPricesEditor";
import { useAuth } from "../hooks/useAuth";
import {
  fetchMenuForPricing,
  saveMenuPrices,
} from "../data/services/menuPricingApi.service";
import type { MenuPricesInput } from "../data/services/menuPricingApi.service";
import type { BackendDailyMenuDto } from "../types/menu";

export default function MenuPricesPage() {
  const { token, logout } = useAuth();
  const mounted = useMountedRef();
  const [date, setDate] = useState(() =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(
      new Date(),
    ),
  );
  const [menu, setMenu] = useState<BackendDailyMenuDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const dirty = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    fetchMenuForPricing(date, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setMenu(data);
          setError(null);
          dirty.current = false;
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setMenu(null);
          void staffToast.fire({
            icon: "error",
            title: "No pudimos cargar el menú",
            text: "Revisa la conexión y pulsa Recargar.",
          });
          setError(
            axios.isAxiosError(error)
              ? "No pudimos cargar el menú. Intenta nuevamente."
              : "Error al cargar el menú.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [date, revision]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  const changeDate = async (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value === date) return;
    if (dirty.current) {
      const answer = await appAlert.fire({
        icon: "question",
        title: "Hay cambios sin guardar",
        text: "Si cambias de fecha se perderán los cambios de precios.",
        showCancelButton: true,
        confirmButtonText: "Cambiar de fecha",
        cancelButtonText: "Seguir editando",
      });
      if (!answer.isConfirmed) return;
    }
    setLoading(true);
    setError(null);
    setDate(value);
  };
  const save = async (input: MenuPricesInput) => {
    if (!menu || !token || saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await saveMenuPrices(menu._id, input, token);
      if (!mounted.current) return;
      setMenu(updated);
      dirty.current = false;
      void staffToast.fire({
        icon: "success",
        title: "Precios guardados",
        text: "El inicio y los nuevos pedidos usarán estos valores.",
      });
    } catch (error) {
      if (!mounted.current) return;
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        logout();
        return;
      }
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : null;
      void staffToast.fire({
        icon: "error",
        title: "No pudimos guardar los precios",
        text:
          typeof message === "string"
            ? message
            : "Conservamos tus cambios. Recarga para comprobar los precios antes de intentar de nuevo.",
      });
    } finally {
      if (mounted.current) setSaving(false);
    }
  };
  return (
    <PageLayout header={<StaffNavigation />}>
      <Typography component="h1" variant="h4" fontWeight={800} sx={{ mb: 1 }}>
        Menús y precios
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Administra el precio general del día y las excepciones por plato.
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <TextField
          label="Fecha del menú"
          type="date"
          value={date}
          onChange={(event) => void changeDate(event.target.value)}
          disabled={saving || loading}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Button
          disabled={saving || loading}
          onClick={async () => {
            if (dirty.current) {
              const answer = await appAlert.fire({
                title: "¿Recargar precios?",
                text: "Se perderán los cambios sin guardar.",
                showCancelButton: true,
                confirmButtonText: "Recargar",
                cancelButtonText: "Cancelar",
              });
              if (!answer.isConfirmed) return;
            }
            setLoading(true);
            setRevision((value) => value + 1);
          }}
        >
          Recargar
        </Button>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {loading ? (
        <Box sx={{ py: 5, textAlign: "center" }}>
          <CircularProgress aria-label="Cargando precios" />
        </Box>
      ) : menu ? (
        <MenuPricesEditor
          key={`${menu._id}-${menu.updatedAt ?? revision}`}
          menu={menu}
          saving={saving}
          onSave={save}
          onDirtyChange={(value) => {
            dirty.current = value;
          }}
        />
      ) : (
        !error && (
          <Alert severity="info">
            No hay un menú publicado para esta fecha.
          </Alert>
        )
      )}
    </PageLayout>
  );
}
