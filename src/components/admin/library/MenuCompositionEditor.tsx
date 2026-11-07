import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { appAlert, staffToast } from "../../../utils/notifications";
import {
  fetchAdminMenu,
  libraryError,
  type AdminMenuSummary,
  type LibraryDish,
  type MenuCompositionInput,
} from "../../../data/services/dishLibraryApi.service";
import type { BackendDailyMenuDto, BackendDishDto } from "../../../types/menu";
import { cloudinaryImage } from "../../../shared/utils/images/cloudinary";
import MenuPublicationPreview from "./MenuPublicationPreview";
import { useMountedRef } from "../../../hooks/useMountedRef";

type Selection = { stock: string; price: string; proteins: string[] };
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const findLibraryDish = (dish: BackendDishDto, library: LibraryDish[]) =>
  library.find(
    (p) =>
      p._id === dish.catalogoId ||
      normalize(p.nombre) === normalize(dish.nombre) ||
      (p.esHipo &&
        (dish.es_hipo || /^hipo(calorico)?$/.test(normalize(dish.nombre)))),
  );
const selectionsFromMenu = (
  menu: BackendDailyMenuDto | null,
  library: LibraryDish[],
  resetStock = false,
): Record<string, Selection> =>
  Object.fromEntries(
    (menu?.platos ?? []).flatMap((dish) => {
      const match = findLibraryDish(dish, library);
      return match
        ? [
            [
              match._id,
              {
                stock: resetStock ? "" : String(dish.stock ?? 0),
                price:
                  resetStock || dish.precio === menu?.precioBase
                    ? ""
                    : String(dish.precio),
                proteins: match.esHipo
                  ? (dish.opciones ?? []).filter((p) =>
                      match.opciones.includes(p),
                    )
                  : [],
              },
            ],
          ]
        : [];
    }),
  );
const strings = (value: unknown, fallback: string) =>
  Array.isArray(value)
    ? value.join(", ")
    : typeof value === "string"
      ? value
      : fallback;
const split = (value: string) =>
  value
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
const positive = (value: string) =>
  /^\d+$/.test(value) &&
  Number.isSafeInteger(Number(value)) &&
  Number(value) > 0;

export default function MenuCompositionEditor({
  date,
  menu,
  library,
  previous,
  token,
  saving,
  onSave,
  onDirtyChange,
  onOpenLibrary,
}: {
  date: string;
  menu: BackendDailyMenuDto | null;
  library: LibraryDish[];
  previous: AdminMenuSummary[];
  token: string;
  saving: boolean;
  onSave: (input: MenuCompositionInput) => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
  onOpenLibrary: () => void;
}) {
  const mounted = useMountedRef();
  const [base, setBase] = useState(String(menu?.precioBase ?? 5500));
  const [salad, setSalad] = useState(
    strings(menu?.ensalada, "Ensalada surtida"),
  );
  const [bread, setBread] = useState(menu?.pan ?? "Pan fresco del día");
  const [dessert, setDessert] = useState(
    strings(menu?.postre, "Postre del día"),
  );
  const [selected, setSelected] = useState<Record<string, Selection>>(() =>
    selectionsFromMenu(menu, library),
  );
  const [missing, setMissing] = useState(() =>
    (menu?.platos ?? [])
      .filter((p) => !findLibraryDish(p, library))
      .map((p) => p.nombre),
  );
  const [query, setQuery] = useState("");
  const [copying, setCopying] = useState(false);
  const [preview, setPreview] = useState(false);
  const dirty = useRef(false);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  const mark = () => {
    dirty.current = true;
    onDirtyChange(true);
  };
  const updateRow = (id: string, patch: Partial<Selection>) => {
    mark();
    setSelected((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));
  };
  const toggle = (dish: LibraryDish) => {
    mark();
    setSelected((current) => {
      const next = { ...current };
      if (next[dish._id]) delete next[dish._id];
      else next[dish._id] = { stock: "", price: "", proteins: [] };
      return next;
    });
  };
  const chosen = library.filter((p) => selected[p._id]);
  const selectedValid = chosen.every(
    (p) =>
      p.activo &&
      positive(selected[p._id].stock) &&
      (!selected[p._id].price || positive(selected[p._id].price)) &&
      (!p.esHipo || selected[p._id].proteins.length > 0),
  );
  const baseValid =
    positive(base) &&
    bread.trim() &&
    split(salad).length &&
    split(dessert).length &&
    !missing.length;
  const draftValid =
    !!baseValid &&
    chosen.every(
      (p) =>
        p.activo &&
        (selected[p._id].stock === "" ||
          (/^\d+$/.test(selected[p._id].stock) &&
            Number.isSafeInteger(Number(selected[p._id].stock)))) &&
        (!selected[p._id].price || positive(selected[p._id].price)),
    );
  const publishValid = baseValid && chosen.length > 0 && selectedValid;
  const payload = (estado: "borrador" | "publicado"): MenuCompositionInput => ({
    fecha: date,
    precioBase: Number(base),
    estado,
    ensalada: split(salad),
    pan: bread.trim(),
    postre: split(dessert),
    platos: chosen.map((p) => ({
      catalogoId: p._id,
      stock: Number(selected[p._id].stock || 0),
      precioEspecial: selected[p._id].price
        ? Number(selected[p._id].price)
        : null,
      opcionesProteina: p.esHipo ? selected[p._id].proteins : [],
    })),
    ...(menu?.updatedAt ? { expectedUpdatedAt: menu.updatedAt } : {}),
  });
  const copy = async (fecha: string) => {
    if (!fecha || copying) return;
    if (
      dirty.current &&
      !(
        await appAlert.fire({
          title: "¿Reemplazar la selección?",
          text: "Se descartarán los cambios de este borrador sin guardar.",
          showCancelButton: true,
          confirmButtonText: "Usar selección",
          cancelButtonText: "Seguir editando",
        })
      ).isConfirmed
    )
      return;
    setCopying(true);
    try {
      const source = await fetchAdminMenu(token, fecha);
      if (!mounted.current || !source) return;
      setSelected(selectionsFromMenu(source, library, true));
      setMissing(
        source.platos
          .filter((p) => !findLibraryDish(p, library))
          .map((p) => p.nombre),
      );
      setSalad(strings(source.ensalada, "Ensalada surtida"));
      setBread(source.pan);
      setDessert(strings(source.postre, "Postre del día"));
      mark();
      void staffToast.fire({
        icon: "info",
        title: "Selección copiada. Ingresa las porciones de este día.",
      });
    } catch (error) {
      if (mounted.current)
        void staffToast.fire({
          icon: "error",
          title: libraryError(error, "No pudimos recuperar la selección"),
        });
    } finally {
      if (mounted.current) setCopying(false);
    }
  };
  const busy = saving || copying;
  const visible = library
    .filter(
      (p) =>
        (p.activo || selected[p._id]) &&
        normalize(`${p.nombre} ${p.categoria}`).includes(normalize(query)),
    )
    // Keep each card in place while its fields are opened or edited.
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return (
    <Box
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        if (publishValid && !busy) void onSave(payload("publicado"));
      }}
    >
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
        <Typography component="h2" variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          {menu ? "Editar borrador" : "Crear menú"}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <TextField
            label="Precio del día"
            value={base}
            required
            disabled={busy}
            onChange={(e) => {
              mark();
              setBase(e.target.value);
            }}
            error={!positive(base)}
            helperText="Los platos sin precio especial usarán este valor."
            slotProps={{ htmlInput: { inputMode: "numeric" } }}
          />
          <TextField
            select
            slotProps={{
              select: { native: true },
              inputLabel: { shrink: true },
            }}
            label="Usar selección de otro menú"
            value=""
            disabled={busy || !previous.length}
            onChange={(e) => void copy(e.target.value)}
            helperText="Recupera platos y acompañamientos; las cantidades se ingresan de nuevo."
          >
            <option value="">Elegir un menú anterior</option>
            {previous
              .filter((p) => p.fecha !== date)
              .map((p) => (
                <option key={p._id} value={p.fecha}>
                  {p.fecha.split("-").reverse().join("/")} ·{" "}
                  {p.estado === "borrador" ? "Borrador" : "Publicado"}
                </option>
              ))}
          </TextField>
          <TextField
            label="Ensalada incluida"
            value={salad}
            disabled={busy}
            required
            onChange={(e) => {
              mark();
              setSalad(e.target.value);
            }}
          />
          <TextField
            label="Pan incluido"
            value={bread}
            disabled={busy}
            required
            onChange={(e) => {
              mark();
              setBread(e.target.value);
            }}
          />
          <TextField
            label="Postre del día"
            value={dessert}
            disabled={busy}
            required
            onChange={(e) => {
              mark();
              setDessert(e.target.value);
            }}
            helperText="Puedes indicar flan, macedonia, fruta u otra opción."
            sx={{ gridColumn: { sm: "1 / -1" } }}
          />
        </Box>
      </Paper>
      {!!missing.length && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button
              onClick={() => {
                mark();
                setMissing([]);
              }}
            >
              Descartar esas referencias
            </Button>
          }
        >
          Estos platos no están en la biblioteca: {missing.join(", ")}. Puedes
          agregarlos a la biblioteca o descartarlos de esta selección.
        </Alert>
      )}
      <Typography component="h2" variant="h6" fontWeight={700}>
        Elegir platos
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Selecciona los platos y sus porciones. Completa Precio especial solo si
        cambia el valor del día.
      </Typography>
      {!library.some((p) => p.activo) ? (
        <Alert
          severity="info"
          action={<Button onClick={onOpenLibrary}>Abrir biblioteca</Button>}
        >
          Primero carga los platos preparados o crea un plato en la biblioteca.
        </Alert>
      ) : (
        <>
          <TextField
            label="Buscar plato o categoría"
            fullWidth
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              alignItems: "start",
            }}
          >
            {visible.map((dish) => {
              const row = selected[dish._id];
              return (
                <Paper
                  key={dish._id}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderColor: row ? "primary.light" : "divider",
                    bgcolor: row ? "background.default" : "background.paper",
                  }}
                >
                  <Box
                    sx={{ display: "flex", gap: 1.25, alignItems: "center" }}
                  >
                    <Checkbox
                      checked={!!row}
                      disabled={busy || (!dish.activo && !row)}
                      onChange={() => toggle(dish)}
                      slotProps={{
                        input: { "aria-label": `Seleccionar ${dish.nombre}` },
                      }}
                      sx={{ p: 0.5 }}
                    />
                    <Box
                      component="img"
                      src={cloudinaryImage(dish.imagenUrl, 160)}
                      alt={dish.nombre}
                      loading="lazy"
                      sx={{
                        width: 60,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: 1.5,
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700}>
                        {dish.nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dish.categoria}
                      </Typography>
                      {!dish.activo && (
                        <Chip label="Archivado" size="small" color="warning" />
                      )}
                    </Box>
                  </Box>
                  {row && (
                    <Box sx={{ mt: 2 }}>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 1.5,
                        }}
                      >
                        <TextField
                          label="Porciones"
                          type="number"
                          size="small"
                          value={row.stock}
                          required
                          disabled={busy}
                          onChange={(e) =>
                            updateRow(dish._id, { stock: e.target.value })
                          }
                          error={row.stock !== "" && !positive(row.stock)}
                          slotProps={{
                            htmlInput: {
                              min: 1,
                              step: 1,
                              "aria-label": `Porciones de ${dish.nombre}`,
                            },
                          }}
                        />
                        <TextField
                          label="Precio especial"
                          size="small"
                          value={row.price}
                          placeholder={base}
                          disabled={busy}
                          onChange={(e) =>
                            updateRow(dish._id, { price: e.target.value })
                          }
                          error={!!row.price && !positive(row.price)}
                          helperText={
                            row.price
                              ? "Solo para este día"
                              : `Vacío: $${(Number(base) || 0).toLocaleString("es-CL")}`
                          }
                          slotProps={{
                            htmlInput: {
                              inputMode: "numeric",
                              "aria-label": `Precio especial de ${dish.nombre}`,
                            },
                          }}
                        />
                      </Box>
                      {dish.esHipo && (
                        <FormControl
                          fullWidth
                          size="small"
                          sx={{ mt: 2 }}
                          required
                        >
                          <InputLabel id={`proteins-${dish._id}`}>
                            Proteínas de este día
                          </InputLabel>
                          <Select
                            multiple
                            labelId={`proteins-${dish._id}`}
                            label="Proteínas de este día"
                            disabled={busy}
                            value={row.proteins}
                            onChange={(e) =>
                              updateRow(dish._id, {
                                proteins:
                                  typeof e.target.value === "string"
                                    ? e.target.value.split(",")
                                    : e.target.value,
                              })
                            }
                            renderValue={(value) => value.join(", ")}
                          >
                            {dish.opciones.map((p) => (
                              <MenuItem key={p} value={p}>
                                <Checkbox checked={row.proteins.includes(p)} />
                                {p}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    </Box>
                  )}
                </Paper>
              );
            })}
          </Box>
          {!visible.length && (
            <Typography sx={{ py: 3 }}>
              No hay platos que coincidan con la búsqueda.
            </Typography>
          )}
        </>
      )}
      <Paper
        variant="outlined"
        sx={{
          position: "sticky",
          bottom: 0,
          zIndex: 2,
          p: 2,
          mt: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="body2" fontWeight={700}>
          {chosen.length} platos ·{" "}
          {chosen.reduce(
            (sum, p) => sum + Number(selected[p._id].stock || 0),
            0,
          )}{" "}
          porciones
        </Typography>
        <Box sx={{ display: { xs: "grid", sm: "flex" }, gridTemplateColumns: "1fr 1fr", gap: 1, flexWrap: "wrap", width: { xs: "100%", sm: "auto" } }}>
          <Button
            disabled={!draftValid || busy}
            onClick={() => void onSave(payload("borrador"))}
          >
            {saving ? "Guardando…" : "Guardar borrador"}
          </Button>
          <Button
            variant="outlined"
            disabled={!publishValid || busy}
            onClick={() => setPreview(true)}
          >
            Previsualizar
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{ gridColumn: { xs: "1 / -1", sm: "auto" } }}
            disabled={!publishValid || busy}
          >
            {saving ? "Guardando…" : "Publicar menú"}
          </Button>
        </Box>
      </Paper>
      {preview && (
        <MenuPublicationPreview
          fecha={date}
          precioBase={Number(base)}
          includes={`${salad} · ${bread} · ${dessert}`}
          dishes={chosen.map((p) => ({
            id: p._id,
            nombre: p.nombre,
            descripcion: p.descripcion,
            imagenUrl: p.imagenUrl,
            precio: Number(selected[p._id].price || base),
            stock: Number(selected[p._id].stock),
            esHipo: p.esHipo,
            opciones: selected[p._id].proteins,
          }))}
          onClose={() => setPreview(false)}
        />
      )}
    </Box>
  );
}
