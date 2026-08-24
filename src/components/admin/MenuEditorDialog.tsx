import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveIcon from "@mui/icons-material/Save";
import Swal from "sweetalert2";
import type {
  AdminMenu,
  AdminMenuInput,
  AdminMenuDishInput,
} from "../../types/adminMenu";
import { uploadAdminMenuImage } from "../../data/services/adminMenuApi.service";

interface EditableDish {
  clientId: string;
  id?: string;
  nombre: string;
  precio: string;
  stock: string;
  imagen_url: string;
  opciones: string;
  es_hipo: boolean;
}

interface Props {
  token: string;
  menu?: AdminMenu;
  initialDate: string;
  onClose: () => void;
  onSave: (input: AdminMenuInput) => Promise<void>;
}

const splitOptions = (value: string): string[] =>
  value
    .split(",")
    .map((option) => option.trim())
    .filter(Boolean);

const todayIso = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" });

const createDish = (): EditableDish => ({
  clientId: crypto.randomUUID(),
  nombre: "",
  precio: "",
  stock: "",
  imagen_url: "",
  opciones: "",
  es_hipo: false,
});

const mapDish = (dish: AdminMenu["platos"][number]): EditableDish => ({
  clientId: dish._id,
  id: dish._id,
  nombre: dish.nombre,
  precio: String(dish.precio),
  stock: String(dish.stock),
  imagen_url: dish.imagen_url ?? "",
  opciones: (dish.opciones ?? []).join(", "),
  es_hipo: dish.es_hipo ?? false,
});

export default function MenuEditorDialog({
  token,
  menu,
  initialDate,
  onClose,
  onSave,
}: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [fecha, setFecha] = useState(menu?.fecha ?? initialDate);
  const [ensalada, setEnsalada] = useState((menu?.ensalada ?? []).join(", "));
  const [pan, setPan] = useState(menu?.pan ?? "");
  const [postre, setPostre] = useState((menu?.postre ?? []).join(", "));
  const [dishes, setDishes] = useState<EditableDish[]>(
    menu?.platos.length ? menu.platos.map(mapDish) : [createDish()],
  );
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const saladOptions = useMemo(() => splitOptions(ensalada), [ensalada]);
  const dessertOptions = useMemo(() => splitOptions(postre), [postre]);

  const updateDish = (
    index: number,
    field: keyof EditableDish,
    value: string | boolean,
  ) => {
    setDirty(true);
    setDishes((current) =>
      current.map((dish, dishIndex) =>
        dishIndex === index ? { ...dish, [field]: value } : dish,
      ),
    );
  };

  const moveDish = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= dishes.length) return;
    setDirty(true);
    setDishes((current) => {
      const copy = [...current];
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
      return copy;
    });
  };

  const removeDish = (index: number) => {
    setDirty(true);
    setDishes((current) => current.filter((_, dishIndex) => dishIndex !== index));
  };

  const handleImageUpload = async (index: number, file?: File) => {
    if (!file) return;
    const dish = dishes[index];
    setUploadingId(dish.clientId);
    setError(null);
    try {
      const url = await uploadAdminMenuImage(token, file);
      updateDish(index, "imagen_url", url);
    } catch {
      setError("No se pudo subir la imagen. Usa JPG, PNG o WebP de hasta 5 MB.");
    } finally {
      setUploadingId(null);
    }
  };

  const validate = (): string | null => {
    if (!fecha) return "Selecciona una fecha.";
    if (!pan.trim()) return "Indica el pan incluido.";
    if (dishes.length === 0) return "Agrega al menos un plato.";

    for (const [index, dish] of dishes.entries()) {
      if (!dish.nombre.trim()) return `Completa el nombre del plato ${index + 1}.`;
      if (!Number.isInteger(Number(dish.precio)) || Number(dish.precio) <= 0) {
        return `Ingresa un precio válido para ${dish.nombre || `el plato ${index + 1}`}.`;
      }
      if (!Number.isInteger(Number(dish.stock)) || Number(dish.stock) < 0) {
        return `Ingresa un stock válido para ${dish.nombre || `el plato ${index + 1}`}.`;
      }
      if (dish.imagen_url) {
        try {
          new URL(dish.imagen_url);
        } catch {
          return `La URL de imagen de ${dish.nombre} no es válida.`;
        }
      }
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const platos: AdminMenuDishInput[] = dishes.map((dish) => ({
      ...(dish.id ? { id: dish.id } : {}),
      nombre: dish.nombre.trim(),
      precio: Number(dish.precio),
      stock: Number(dish.stock),
      ...(dish.imagen_url.trim() ? { imagen_url: dish.imagen_url.trim() } : {}),
      opciones: splitOptions(dish.opciones),
      es_hipo: dish.es_hipo,
    }));

    setSaving(true);
    setError(null);
    try {
      await onSave({
        fecha,
        ensalada: saladOptions,
        pan: pan.trim(),
        postre: dessertOptions,
        status: menu ? (menu.status ?? "published") : "draft",
        platos,
      });
      setDirty(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar el menú.",
      );
    } finally {
      setSaving(false);
    }
  };

  const requestClose = async () => {
    if (!dirty) {
      onClose();
      return;
    }
    const result = await Swal.fire({
      title: "¿Descartar cambios?",
      text: "Los cambios que no guardaste se perderán.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Descartar",
      cancelButtonText: "Seguir editando",
      confirmButtonColor: "#d32f2f",
    });
    if (result.isConfirmed) onClose();
  };

  return (
    <Dialog
      open
      onClose={() => void requestClose()}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="lg"
      slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 3 } } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="div" fontWeight={800}>
          {menu ? "Editar menú" : "Crear menú"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Guarda primero el borrador y publícalo cuando esté listo para clientes.
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" fontWeight={800} mb={2}>
                    1. Datos generales
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <TextField
                        label="Fecha"
                        type="date"
                        value={fecha}
                        onChange={(event) => {
                          setFecha(event.target.value);
                          setDirty(true);
                        }}
                        disabled={Boolean(menu)}
                        fullWidth
                        slotProps={{
                          inputLabel: { shrink: true },
                          htmlInput: { min: todayIso() },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 7 }}>
                      <TextField
                        label="Pan incluido"
                        value={pan}
                        onChange={(event) => {
                          setPan(event.target.value);
                          setDirty(true);
                        }}
                        placeholder="Ej. Pan amasado"
                        required
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Ensaladas"
                        value={ensalada}
                        onChange={(event) => {
                          setEnsalada(event.target.value);
                          setDirty(true);
                        }}
                        helperText="Separa las alternativas con comas"
                        placeholder="Chilena, surtida, repollo"
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Postres"
                        value={postre}
                        onChange={(event) => {
                          setPostre(event.target.value);
                          setDirty(true);
                        }}
                        helperText="Separa las alternativas con comas"
                        placeholder="Flan, fruta, jalea"
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Box>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      2. Platos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ordena los platos como aparecerán en el menú público.
                    </Typography>
                  </Box>
                  <Button
                    startIcon={<AddIcon />}
                    variant="outlined"
                    onClick={() => {
                      setDishes((current) => [...current, createDish()]);
                      setDirty(true);
                    }}
                  >
                    Agregar
                  </Button>
                </Box>

                <Stack spacing={2}>
                  {dishes.map((dish, index) => (
                    <Card key={dish.clientId} variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={2}>
                          <Chip label={`Plato ${index + 1}`} color="primary" size="small" />
                          <Box ml="auto">
                            <IconButton
                              aria-label="Mover plato hacia arriba"
                              onClick={() => moveDish(index, -1)}
                              disabled={index === 0}
                              size="small"
                            >
                              <ArrowUpwardIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              aria-label="Mover plato hacia abajo"
                              onClick={() => moveDish(index, 1)}
                              disabled={index === dishes.length - 1}
                              size="small"
                            >
                              <ArrowDownwardIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              aria-label="Eliminar plato"
                              color="error"
                              onClick={() => removeDish(index)}
                              size="small"
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>

                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              label="Nombre"
                              value={dish.nombre}
                              onChange={(event) => updateDish(index, "nombre", event.target.value)}
                              required
                              fullWidth
                            />
                          </Grid>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <TextField
                              label="Precio"
                              type="number"
                              value={dish.precio}
                              onChange={(event) => updateDish(index, "precio", event.target.value)}
                              slotProps={{ htmlInput: { min: 1, step: 100 } }}
                              required
                              fullWidth
                            />
                          </Grid>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <TextField
                              label="Stock"
                              type="number"
                              value={dish.stock}
                              onChange={(event) => updateDish(index, "stock", event.target.value)}
                              slotProps={{ htmlInput: { min: 0, step: 1 } }}
                              required
                              fullWidth
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 8 }}>
                            <TextField
                              label="URL de imagen"
                              value={dish.imagen_url}
                              onChange={(event) =>
                                updateDish(index, "imagen_url", event.target.value)
                              }
                              placeholder="https://..."
                              fullWidth
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }} display="flex" alignItems="center">
                            <Button
                              component="label"
                              variant="outlined"
                              startIcon={
                                uploadingId === dish.clientId ? (
                                  <CircularProgress size={18} />
                                ) : (
                                  <CloudUploadIcon />
                                )
                              }
                              disabled={uploadingId !== null}
                              fullWidth
                            >
                              Subir imagen
                              <input
                                hidden
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(event) =>
                                  void handleImageUpload(index, event.target.files?.[0])
                                }
                              />
                            </Button>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 8 }}>
                            <TextField
                              label="Opciones de proteína"
                              value={dish.opciones}
                              onChange={(event) =>
                                updateDish(index, "opciones", event.target.value)
                              }
                              helperText="Opcional. Separa alternativas con comas"
                              fullWidth
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }} display="flex" alignItems="center">
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={dish.es_hipo}
                                  onChange={(event) =>
                                    updateDish(index, "es_hipo", event.target.checked)
                                  }
                                />
                              }
                              label="Hipocalórico"
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              variant="outlined"
              sx={{ position: { md: "sticky" }, top: { md: 16 }, bgcolor: "grey.50" }}
            >
              <CardContent>
                <Typography variant="overline" color="text.secondary" fontWeight={700}>
                  Vista previa
                </Typography>
                <Typography variant="h6" fontWeight={800} mb={0.5}>
                  Menú {fecha || "sin fecha"}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {dishes.length} {dishes.length === 1 ? "plato" : "platos"} · Stock total{" "}
                  {dishes.reduce((sum, dish) => sum + (Number(dish.stock) || 0), 0)}
                </Typography>
                <Stack direction="row" gap={0.75} flexWrap="wrap" mb={2}>
                  {saladOptions.map((option) => (
                    <Chip key={option} label={option} size="small" />
                  ))}
                  {dessertOptions.map((option) => (
                    <Chip key={option} label={option} size="small" color="secondary" />
                  ))}
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1.5}>
                  {dishes.map((dish, index) => (
                    <Box key={dish.clientId} display="flex" gap={1.5} alignItems="center">
                      <Box
                        component={dish.imagen_url ? "img" : "div"}
                        src={dish.imagen_url || undefined}
                        alt=""
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1.5,
                          objectFit: "cover",
                          bgcolor: "secondary.light",
                          flexShrink: 0,
                        }}
                      />
                      <Box minWidth={0} flexGrow={1}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {dish.nombre || `Plato ${index + 1}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ${(Number(dish.precio) || 0).toLocaleString("es-CL")} · {dish.stock || 0}{" "}
                          disponibles
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={() => void requestClose()} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={() => void handleSave()}
          disabled={saving || uploadingId !== null}
        >
          {menu?.status === "published" ? "Guardar cambios" : "Guardar borrador"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
