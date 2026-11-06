import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../../../hooks/useAuth";
import {
  staffToast,
  STAFF_ACTION_DURATION_MS,
} from "../../../utils/notifications";
import {
  archiveLibraryDish,
  fetchLibrary,
  importInitialLibrary,
  libraryError,
  type LibraryDish,
} from "../../../data/services/dishLibraryApi.service";
import { cloudinaryImage } from "../../../shared/utils/images/cloudinary";
import LibraryDishEditor from "./LibraryDishEditor";
import { useMountedRef } from "../../../hooks/useMountedRef";

export default function DishLibraryManager() {
  const { token } = useAuth();
  const mounted = useMountedRef();
  const [rows, setRows] = useState<LibraryDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [archived, setArchived] = useState(false);
  const [revision, setRevision] = useState(0);
  const [working, setWorking] = useState("");
  const [editor, setEditor] = useState<LibraryDish | "new" | null>(null);
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    fetchLibrary(token, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setRows(data);
          setError("");
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(libraryError(e, "No pudimos cargar la biblioteca."));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token, revision]);
  const reload = () => {
    setLoading(true);
    setRevision((value) => value + 1);
  };
  const importRows = async () => {
    if (!token || working) return;
    setWorking("import");
    try {
      const result = await importInitialLibrary(token);
      if (mounted.current) {
        void staffToast.fire({
          icon: "success",
          title: result.agregados
            ? `${result.agregados} platos agregados`
            : "La biblioteca inicial ya está cargada",
          timer: STAFF_ACTION_DURATION_MS,
        });
        reload();
      }
    } catch (e) {
      if (mounted.current)
        void staffToast.fire({
          icon: "error",
          title: libraryError(e, "No pudimos cargar los platos preparados"),
        });
    } finally {
      if (mounted.current) setWorking("");
    }
  };
  const toggle = async (dish: LibraryDish) => {
    if (!token || working) return;
    setWorking(dish._id);
    try {
      const result = await archiveLibraryDish(token, dish._id, !dish.activo);
      if (mounted.current) {
        setRows((current) =>
          current.map((p) => (p._id === result._id ? result : p)),
        );
        void staffToast.fire({
          icon: "success",
          title: result.activo ? "Plato activado" : "Plato archivado",
          timer: STAFF_ACTION_DURATION_MS,
        });
      }
    } catch (e) {
      if (mounted.current)
        void staffToast.fire({
          icon: "error",
          title: libraryError(e, "No pudimos cambiar el plato"),
        });
    } finally {
      if (mounted.current) setWorking("");
    }
  };
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const filtered = rows.filter(
    (p) =>
      (archived || p.activo) &&
      normalize(`${p.nombre} ${p.categoria}`).includes(normalize(query)),
  );
  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        <Button
          variant="contained"
          disabled={!!working}
          onClick={() => setEditor("new")}
        >
          Nuevo plato
        </Button>
        <Button
          variant="outlined"
          disabled={!!working || loading}
          onClick={() => void importRows()}
        >
          {working === "import"
            ? "Cargando biblioteca…"
            : "Cargar los 23 platos preparados"}
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Guarda cada plato una vez. Sus fotografías y opciones estarán
        disponibles al crear un menú; las cantidades y precios se definen para
        cada día.
      </Typography>
      <TextField
        label="Buscar plato o categoría"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        fullWidth
        size="small"
      />
      <FormControlLabel
        control={
          <Switch
            checked={archived}
            onChange={(e) => setArchived(e.target.checked)}
          />
        }
        label="Mostrar archivados"
      />
      {error && (
        <Alert
          severity="error"
          action={<Button onClick={reload}>Reintentar</Button>}
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}
      {loading ? (
        <Box sx={{ py: 5, textAlign: "center" }}>
          <CircularProgress aria-label="Cargando biblioteca" />
        </Box>
      ) : (
        <>
          <Typography variant="caption" color="text.secondary">
            {filtered.length} platos · {rows.filter((p) => p.activo).length}{" "}
            activos
          </Typography>
          {!rows.length && !error && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Carga los 23 platos preparados o crea tu primer plato para
              comenzar.
            </Alert>
          )}
          {!!rows.length && !filtered.length && (
            <Typography sx={{ py: 3 }}>
              No hay platos que coincidan con la búsqueda.
            </Typography>
          )}
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              mt: 1.5,
            }}
          >
            {filtered.map((dish) => (
              <Paper
                key={dish._id}
                variant="outlined"
                sx={{
                  p: 1.5,
                  display: "flex",
                  gap: 1.5,
                  alignItems: "center",
                  minWidth: 0,
                }}
              >
                <Box
                  component="img"
                  src={cloudinaryImage(dish.imagenUrl, 160)}
                  alt={dish.nombre}
                  loading="lazy"
                  sx={{
                    width: 72,
                    height: 72,
                    objectFit: "cover",
                    borderRadius: 1.5,
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={700} variant="body2">
                    {dish.nombre}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dish.categoria}
                  </Typography>
                  {!dish.activo && (
                    <Chip label="Archivado" size="small" sx={{ ml: 1 }} />
                  )}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Button
                      size="small"
                      disabled={!!working}
                      onClick={() => setEditor(dish)}
                    >
                      Editar
                    </Button>
                    <FormControlLabel
                      sx={{ mr: 0 }}
                      control={
                        <Switch
                          size="small"
                          checked={dish.activo}
                          disabled={!!working}
                          onChange={() => void toggle(dish)}
                          slotProps={{
                            input: { "aria-label": `Activo: ${dish.nombre}` },
                          }}
                        />
                      }
                      label={<Typography variant="caption">Activo</Typography>}
                    />
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        </>
      )}
      {editor && token && (
        <LibraryDishEditor
          dish={editor === "new" ? undefined : editor}
          token={token}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            reload();
            void staffToast.fire({
              icon: "success",
              title: "Plato guardado",
              timer: STAFF_ACTION_DURATION_MS,
            });
          }}
        />
      )}
    </Box>
  );
}
