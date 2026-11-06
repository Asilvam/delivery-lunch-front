import { useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
  type AdminMenuSummary,
  type LibraryDish,
  type MenuCompositionInput,
} from "../../../data/services/dishLibraryApi.service";
import {
  saveMenuPrices,
  type MenuPricesInput,
} from "../../../data/services/menuPricingApi.service";
import type { BackendDailyMenuDto } from "../../../types/menu";
import MenuCompositionEditor from "./MenuCompositionEditor";
import MenuPricesEditor from "../MenuPricesEditor";
import MenuPublicationPreview from "./MenuPublicationPreview";
import { mapBackendDishToDish } from "../../../data/mappers/menu.mapper";
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
  const [date, setDate] = useState(() =>
    new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" }),
  );
  const [menu, setMenu] = useState<BackendDailyMenuDto | null>(null);
  const [library, setLibrary] = useState<LibraryDish[]>([]);
  const [previous, setPrevious] = useState<AdminMenuSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [revision, setRevision] = useState(0);
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
    if (
      value === date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !parseIsoDate(value) ||
      saving
    )
      return;
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
      return;
    mark(false);
    setLoading(true);
    setDate(value);
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
  const savePrices = async (input: MenuPricesInput) => {
    if (!token || !menu || saving) return;
    setSaving(true);
    try {
      const result = await saveMenuPrices(menu._id, input, token);
      if (mounted.current) {
        mark(false);
        setMenu(result);
        void staffToast.fire({
          icon: "success",
          title: "Precios guardados",
          timer: STAFF_ACTION_DURATION_MS,
        });
      }
    } catch (e) {
      if (mounted.current)
        void staffToast.fire({
          icon: "error",
          title: libraryError(e, "No pudimos guardar los precios"),
        });
    } finally {
      if (mounted.current) setSaving(false);
    }
  };
  const published = menu && menu.estado !== "borrador";
  const text = (value: unknown) =>
    Array.isArray(value)
      ? value.join(", ")
      : typeof value === "string"
        ? value
        : "";
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          label="Fecha del menú"
          type="date"
          value={date}
          disabled={saving}
          onChange={(e) => void changeDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Chip
          label={
            loading
              ? "Cargando…"
              : published
                ? "Publicado"
                : menu
                  ? "Borrador"
                  : "Nuevo menú"
          }
          color={published ? "success" : "default"}
        />
      </Box>
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
              <>
                <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
                  <Typography component="h2" variant="h6" fontWeight={700}>
                    Menú publicado · {menu.platos.length} platos
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1, mb: 2 }}
                  >
                    Para preparar otro día, cambia la fecha. Puedes reutilizar
                    esta selección al crear el nuevo menú.
                  </Typography>
                  <Button variant="outlined" onClick={() => setPreview(true)}>
                    Ver publicación
                  </Button>
                </Paper>
                <Accordion variant="outlined">
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={700}>
                      Editar precio general y excepciones
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <MenuPricesEditor
                      key={`${menu._id}-${menu.updatedAt}`}
                      menu={menu}
                      saving={saving}
                      onSave={savePrices}
                      onDirtyChange={mark}
                    />
                  </AccordionDetails>
                </Accordion>
              </>
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
      {preview && menu && (
        <MenuPublicationPreview
          fecha={menu.fecha}
          precioBase={menu.precioBase ?? 5500}
          includes={`${text(menu.ensalada)} · ${menu.pan} · ${text(menu.postre)}`}
          dishes={menu.platos.map((p) => ({
            id: p._id,
            nombre: p.nombre,
            descripcion: p.descripcion,
            imagenUrl: mapBackendDishToDish(p).imageUrl,
            precio: p.precio,
            stock: p.stock ?? 0,
            esHipo: p.es_hipo,
            opciones: p.opciones ?? [],
          }))}
          onClose={() => setPreview(false)}
        />
      )}
    </Box>
  );
}
