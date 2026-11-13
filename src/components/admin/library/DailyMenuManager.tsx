import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Typography,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../../../hooks/useAuth";
import { useMountedRef } from "../../../hooks/useMountedRef";
import {
  appAlert,
  staffToast,
  STAFF_ACTION_DURATION_MS,
} from "../../../utils/notifications";
import {
  fetchAdminMenu,
  fetchAdminMenus,
  fetchLibrary,
  libraryError,
  saveComposition,
  saveMenuPublication,
  type MenuPublicationInput,
  type AdminMenuSummary,
  type LibraryDish,
  type MenuCompositionInput,
} from "../../../data/services/dishLibraryApi.service";
import type { BackendDailyMenuDto } from "../../../types/menu";
import MenuCompositionEditor from "./MenuCompositionEditor";
import PublishedMenuEditor from "./PublishedMenuEditor";
import { parseIsoDate } from "../../../shared/utils/date/menuDate";

export default function DailyMenuManager({
  onDirtyChange,
  onOpenLibrary,
}: {
  onDirtyChange: (dirty: boolean) => void;
  onOpenLibrary: () => void;
}) {
  const { token } = useAuth();
  const mounted = useMountedRef();
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Santiago",
  });
  const [date, setDate] = useState(() =>
    new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" }),
  );
  const [menu, setMenu] = useState<BackendDailyMenuDto | null>(null);
  const [library, setLibrary] = useState<LibraryDish[]>([]);
  const [previous, setPrevious] = useState<AdminMenuSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [creating, setCreating] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [checkingDate, setCheckingDate] = useState(false);
  const [existingDate, setExistingDate] = useState(false);
  const [createError, setCreateError] = useState("");
  const dirty = useRef(false);
  const mark = (value: boolean) => {
    dirty.current = value;
    onDirtyChange(value);
  };
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    Promise.all([
      fetchAdminMenu(token, date, controller.signal),
      fetchLibrary(token, controller.signal),
      fetchAdminMenus(token, controller.signal),
    ])
      .then(([current, dishes, menus]) => {
        if (!controller.signal.aborted) {
          setMenu(current);
          setLibrary(dishes);
          setPrevious(menus);
          setError("");
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(
            libraryError(e, "No pudimos cargar el menú y la biblioteca."),
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token, date, revision]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  const changeDate = async (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !parseIsoDate(value) || saving)
      return false;
    if (value === date) return true;
    if (
      dirty.current &&
      !(
        await appAlert.fire({
          title: "Hay cambios sin guardar",
          text: "Al cambiar de fecha se descartará la edición actual.",
          showCancelButton: true,
          confirmButtonText: "Cambiar fecha",
          cancelButtonText: "Seguir editando",
        })
      ).isConfirmed
    )
      return false;
    mark(false);
    setLoading(true);
    setDate(value);
    return true;
  };
  const save = async (input: MenuCompositionInput) => {
    if (!token || saving) return;
    setSaving(true);
    try {
      const result = await saveComposition(token, input, menu?._id);
      if (mounted.current) {
        mark(false);
        setMenu(result);
        setPrevious((current) => [
          {
            _id: result._id,
            fecha: result.fecha,
            estado: result.estado,
            precioBase: result.precioBase ?? 5500,
            updatedAt: result.updatedAt,
          },
          ...current.filter((p) => p._id !== result._id),
        ]);
        void staffToast.fire({
          icon: "success",
          title:
            result.estado === "borrador"
              ? "Borrador guardado"
              : "Menú publicado",
          timer: STAFF_ACTION_DURATION_MS,
        });
      }
    } catch (e) {
      if (mounted.current)
        void staffToast.fire({
          icon: "error",
          title: libraryError(
            e,
            "No pudimos guardar el menú. Conservamos la edición.",
          ),
        });
    } finally {
      if (mounted.current) setSaving(false);
    }
  };
  const savePublished = async (input: MenuPublicationInput) => {
    if (!token || !menu || saving) return;
    setSaving(true);
    try {
      const result = await saveMenuPublication(token, menu._id, input);
      if (mounted.current) {
        mark(false);
        setMenu(result);
        void staffToast.fire({
          icon: "success",
          title: "Menú actualizado",
          timer: STAFF_ACTION_DURATION_MS,
        });
      }
    } catch (error) {
      if (mounted.current)
        void staffToast.fire({
          icon: "error",
          title: libraryError(
            error,
            "No pudimos guardar el menú. Conservamos tus cambios.",
          ),
        });
    } finally {
      if (mounted.current) setSaving(false);
    }
  };
  const reload = async () => {
    if (saving) return;
    if (
      dirty.current &&
      !(
        await appAlert.fire({
          title: "¿Recargar el menú?",
          text: "Se descartarán los cambios que aún no guardaste.",
          showCancelButton: true,
          confirmButtonText: "Recargar",
          cancelButtonText: "Seguir editando",
        })
      ).isConfirmed
    )
      return;
    mark(false);
    setLoading(true);
    setRevision((value) => value + 1);
  };
  const openCreate = () => {
    const occupied = new Set(previous.map((item) => item.fecha));
    const candidate = new Date(`${today}T12:00:00Z`);
    while (occupied.has(candidate.toISOString().slice(0, 10)))
      candidate.setUTCDate(candidate.getUTCDate() + 1);
    setNewDate(candidate.toISOString().slice(0, 10));
    setExistingDate(false);
    setCreateError("");
    setCreating(true);
  };
  const startMenu = async () => {
    if (!token || checkingDate || !parseIsoDate(newDate)) return;
    if (newDate < today) {
      setCreateError("No puedes crear menús con fecha pasada.");
      return;
    }
    setCheckingDate(true);
    setCreateError("");
    try {
      const existing = await fetchAdminMenu(token, newDate);
      if (!mounted.current) return;
      if (existing && !existingDate) {
        setExistingDate(true);
        return;
      }
      if (await changeDate(newDate)) setCreating(false);
    } catch (error) {
      if (mounted.current)
        setCreateError(
          libraryError(
            error,
            "No pudimos comprobar la fecha. Intenta nuevamente.",
          ),
        );
    } finally {
      if (mounted.current) setCheckingDate(false);
    }
  };
  const published = menu && menu.estado !== "borrador";
  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 2.5,
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "minmax(0, 1fr) auto",
          },
          gap: 2,
          alignItems: "center",
        }}
      >
        <Box
          sx={{ display: "flex", gap: 1.5, alignItems: "center", minWidth: 0 }}
        >
          <TextField
            label="Fecha del menú"
            type="date"
            size="small"
            value={date}
            disabled={saving || checkingDate}
            onChange={(e) => void changeDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ flex: { xs: 1, sm: "0 1 185px" }, minWidth: 0 }}
          />
          <Chip
            size="small"
            label={
              loading
                ? "Cargando…"
                : published
                  ? "Publicado"
                  : menu
                    ? "Borrador"
                    : "Sin guardar"
            }
            color={published ? "success" : "default"}
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          disabled={loading || saving}
        >
          Crear nuevo menú
        </Button>
      </Paper>
      <Dialog
        open={creating}
        onClose={() => {
          if (!checkingDate) setCreating(false);
        }}
        fullWidth
        maxWidth="xs"
        aria-labelledby="create-menu-title"
      >
        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            void startMenu();
          }}
        >
          <DialogTitle id="create-menu-title">Crear nuevo menú</DialogTitle>
          <DialogContent sx={{ display: "grid", gap: 2, pt: "8px !important" }}>
            <Typography variant="body2" color="text.secondary">
              Elige la fecha. Después selecciona los platos y sus porciones;
              podrás guardar un borrador o publicar.
            </Typography>
            <TextField
              label="Fecha del nuevo menú"
              type="date"
              value={newDate}
              autoFocus
              fullWidth
              required
              disabled={checkingDate}
              onChange={(event) => {
                setNewDate(event.target.value);
                setExistingDate(false);
                setCreateError("");
              }}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { min: today },
              }}
            />
            {existingDate && (
              <Alert severity="info">
                Ya existe un menú para esta fecha. Puedes abrirlo para editarlo
                o elegir otra fecha.
              </Alert>
            )}
            {createError && <Alert severity="error">{createError}</Alert>}
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1, gap: 1 }}>
            <Button onClick={() => setCreating(false)} disabled={checkingDate}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                checkingDate || !parseIsoDate(newDate) || newDate < today
              }
            >
              {checkingDate
                ? "Comprobando…"
                : existingDate
                  ? "Abrir menú existente"
                  : "Continuar"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button
              onClick={() => {
                setLoading(true);
                setRevision((r) => r + 1);
              }}
            >
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      {loading ? (
        <Box sx={{ py: 5, textAlign: "center" }}>
          <CircularProgress aria-label="Cargando menú y biblioteca" />
        </Box>
      ) : (
        !error &&
        token && (
          <>
            {published ? (
              <PublishedMenuEditor
                key={`${menu._id}-${menu.updatedAt}`}
                menu={menu}
                library={library}
                saving={saving}
                onSave={savePublished}
                onDirtyChange={mark}
                onReload={() => void reload()}
              />
            ) : (
              <MenuCompositionEditor
                key={`${date}-${menu?._id ?? "new"}-${menu?.updatedAt ?? revision}`}
                date={date}
                menu={menu}
                library={library}
                previous={previous}
                token={token}
                saving={saving}
                onSave={save}
                onDirtyChange={mark}
                onOpenLibrary={onOpenLibrary}
              />
            )}
          </>
        )
      )}
    </Box>
  );
}
