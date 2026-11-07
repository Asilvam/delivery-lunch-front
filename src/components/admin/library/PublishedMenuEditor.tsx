import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import type { BackendDailyMenuDto, BackendDishDto } from "../../../types/menu";
import type {
  LibraryDish,
  MenuPublicationInput,
} from "../../../data/services/dishLibraryApi.service";
import { mapBackendDishToDish } from "../../../data/mappers/menu.mapper";
import { cloudinaryImage } from "../../../shared/utils/images/cloudinary";
import MenuPublicationPreview from "./MenuPublicationPreview";
import { appAlert } from "../../../utils/notifications";

const normalized = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const matchCatalog = (dish: BackendDishDto, library: LibraryDish[]) =>
  library.find(
    (p) =>
      p._id === dish.catalogoId ||
      normalized(p.nombre) === normalized(dish.nombre) ||
      (p.esHipo &&
        (dish.es_hipo || /^hipo(calorico)?$/.test(normalized(dish.nombre)))),
  );
const integer = (value: string, min: number) =>
  /^\d+$/.test(value) &&
  Number.isSafeInteger(Number(value)) &&
  Number(value) >= min;
const text = (value: unknown) =>
  Array.isArray(value)
    ? value.join(", ")
    : typeof value === "string"
      ? value
      : "";
type Row = {
  key: string;
  id?: string;
  catalogoId?: string;
  nombre: string;
  descripcion: string;
  stock: string;
  initialStock: number;
  hasOrders: boolean;
  price: string;
  proteins: string[];
  isHipo: boolean;
  imageUrl?: string;
};
const fromDish = (dish: BackendDishDto, library: LibraryDish[]): Row => ({
  key: dish._id,
  id: dish._id,
  catalogoId: dish.catalogoId ?? matchCatalog(dish, library)?._id,
  nombre: dish.nombre,
  descripcion: dish.descripcion ?? "",
  stock: String(dish.stock ?? 0),
  initialStock: dish.stock ?? 0,
  hasOrders: dish.tienePedidos ?? false,
  price: String(dish.precio),
  proteins: dish.opciones ?? [],
  isHipo: dish.es_hipo ?? false,
  imageUrl: mapBackendDishToDish(dish).imageUrl,
});

export default function PublishedMenuEditor({
  menu,
  library,
  saving,
  onSave,
  onDirtyChange,
  onReload,
}: {
  menu: BackendDailyMenuDto;
  library: LibraryDish[];
  saving: boolean;
  onSave: (input: MenuPublicationInput) => Promise<void>;
  onDirtyChange: (value: boolean) => void;
  onReload: () => void;
}) {
  const initialBase = menu.precioBase ?? 5500;
  const initialRows = () =>
    menu.platos.filter((p) => !p.retirado).map((p) => fromDish(p, library));
  const [base, setBase] = useState(String(initialBase));
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [dirty, setDirty] = useState(false);
  const [addedKey, setAddedKey] = useState<string>();
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const mark = () => {
    setDirty(true);
    onDirtyChange(true);
  };
  const update = (key: string, change: Partial<Row>) => {
    mark();
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...change } : row)),
    );
  };
  const add = (dish: LibraryDish) => {
    const previous = menu.platos.find(
      (p) =>
        p.catalogoId === dish._id || matchCatalog(p, library)?._id === dish._id,
    );
    const row: Row = previous
      ? {
          ...fromDish(previous, library),
          price:
            previous.precio === initialBase ? base : String(previous.precio),
        }
      : {
          key: `library-${dish._id}`,
          catalogoId: dish._id,
          nombre: dish.nombre,
          descripcion: dish.descripcion ?? "",
          stock: "",
          initialStock: 0,
          hasOrders: false,
          price: base,
          proteins: [],
          isHipo: dish.esHipo,
          imageUrl: dish.imagenUrl,
        };
    mark();
    setRows((current) => [...current, row]);
    setAddedKey(row.key);
    setQuery("");
  };
  const available = library.filter(
    (p) => p.activo && !rows.some((row) => row.catalogoId === p._id),
  );
  const valid =
    !!menu.updatedAt &&
    integer(base, 1) &&
    rows.every(
      (row) =>
        integer(row.stock, 0) &&
        (row.price === "" || integer(row.price, 1)) &&
        (!row.isHipo || row.proteins.length > 0),
    );
  const payload = (): MenuPublicationInput => ({
    precioBase: Number(base),
    expectedUpdatedAt: menu.updatedAt!,
    platos: rows.map((row) => ({
      ...(row.id ? { id: row.id } : {}),
      ...(row.catalogoId ? { catalogoId: row.catalogoId } : {}),
      ...(!row.id || row.stock !== String(row.initialStock)
        ? {
            stock: Number(row.stock),
            ...(row.id ? { expectedStock: row.initialStock } : {}),
          }
        : {}),
      precioEspecial:
        row.price && Number(row.price) !== Number(base)
          ? Number(row.price)
          : null,
      opcionesProteina: row.isHipo ? row.proteins : [],
    })),
  });
  const reset = () => {
    setBase(String(initialBase));
    setRows(initialRows());
    setDirty(false);
    onDirtyChange(false);
  };
  return (
    <Box
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        if (dirty && valid && !saving) void onSave(payload());
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          alignItems: "center",
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box>
          <Typography component="h2" variant="h6" fontWeight={700}>
            Platos del menú
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ajusta porciones y precios.
          </Typography>
        </Box>
        <Button
          disabled={saving}
          onClick={onReload}
          aria-label="Recargar menú"
          title="Consultar los datos guardados y el stock actualizado"
          sx={{ minWidth: 44 }}
        >
          <RefreshIcon sx={{ mr: { xs: 0, sm: 1 } }} />
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            Recargar menú
          </Box>
        </Button>
      </Box>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 2,
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "minmax(220px, 0.7fr) minmax(0, 1.5fr)",
          },
          gap: { xs: 2, md: 3 },
          alignItems: "start",
        }}
      >
        <TextField
          label="Precio general del día"
          value={base}
          onChange={(event) => {
            mark();
            const nextBase = event.target.value;
            setRows((current) =>
              current.map((row) =>
                row.price === base ? { ...row, price: nextBase } : row,
              ),
            );
            setBase(nextBase);
          }}
          disabled={saving}
          error={!integer(base, 1)}
          helperText="Se aplica a los platos sin un precio distinto."
          slotProps={{ htmlInput: { inputMode: "numeric" } }}
          fullWidth
        />
        <Autocomplete
          options={available}
          value={null}
          inputValue={query}
          onInputChange={(_, value, reason) =>
            setQuery(reason === "input" ? value : "")
          }
          onChange={(_, dish) => {
            if (dish) add(dish);
          }}
          getOptionLabel={(dish) => dish.nombre}
          disabled={saving}
          noOptionsText="No hay más platos activos disponibles"
          openText="Mostrar platos"
          closeText="Cerrar lista"
          renderInput={(params) => (
            <TextField
              {...params}
              label="Agregar plato desde la biblioteca"
              placeholder="Busca por nombre"
              helperText="Selecciona un plato para agregarlo al menú."
            />
          )}
          renderOption={(props, dish) => {
            const { key, ...rest } = props;
            return (
              <Box component="li" key={key} {...rest} sx={{ gap: 1.5 }}>
                <Box
                  component="img"
                  src={cloudinaryImage(dish.imagenUrl, 120)}
                  alt=""
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 1,
                    objectFit: "cover",
                  }}
                />
                {dish.nombre}
              </Box>
            );
          }}
        />
      </Paper>
      {!rows.length && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Este menú no ofrece platos. Agrega uno desde la biblioteca para volver
          a recibir pedidos.
        </Alert>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "repeat(2, minmax(0, 1fr))",
          },
          gap: 2,
          alignItems: "start",
        }}
      >
        {rows.map((row) => {
          const catalog = library.find((p) => p._id === row.catalogoId);
          const original = menu.platos.find((p) => p._id === row.id);
          const proteinOptions = [
            ...new Set([
              ...(original?.opciones ?? []),
              ...(catalog?.opciones ?? []),
            ]),
          ];
          return (
            <Paper
              component="article"
              key={row.key}
              variant="outlined"
              sx={{ p: 2, minWidth: 0 }}
              aria-label={row.nombre}
            >
              <Box
                sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 2 }}
              >
                {row.imageUrl && (
                  <Box
                    component="img"
                    src={cloudinaryImage(row.imageUrl, 160)}
                    alt={row.nombre}
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 1.5,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                )}
                <Typography
                  component="h3"
                  variant="subtitle1"
                  fontWeight={700}
                  sx={{ minWidth: 0, overflowWrap: "anywhere" }}
                >
                  {row.nombre}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.5,
                }}
              >
                <TextField
                  label="Stock disponible"
                  autoFocus={row.key === addedKey}
                  value={row.stock}
                  type="number"
                  size="small"
                  disabled={saving}
                  error={!integer(row.stock, 0)}
                  onChange={(event) =>
                    update(row.key, { stock: event.target.value })
                  }
                  helperText="Porciones disponibles ahora. 0 = agotado."
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      step: 1,
                      "aria-label": `Stock disponible de ${row.nombre}`,
                    },
                  }}
                />
                <TextField
                  label="Precio del plato"
                  value={row.price}
                  placeholder={base}
                  size="small"
                  fullWidth
                  disabled={saving}
                  error={row.price !== "" && !integer(row.price, 1)}
                  onChange={(event) =>
                    update(row.key, { price: event.target.value })
                  }
                  slotProps={{
                    htmlInput: {
                      inputMode: "numeric",
                      "aria-label": `Precio de ${row.nombre}`,
                    },
                  }}
                  helperText={
                    row.price && Number(row.price) !== Number(base)
                      ? "Precio distinto al general."
                      : "Usa el precio general del día."
                  }
                />
              </Box>
              {row.isHipo && (
                <FormControl fullWidth size="small" required sx={{ mt: 2 }}>
                  <InputLabel id={`published-proteins-${row.key}`}>
                    Proteínas disponibles
                  </InputLabel>
                  <Select
                    multiple
                    labelId={`published-proteins-${row.key}`}
                    label="Proteínas disponibles"
                    value={row.proteins}
                    disabled={saving}
                    onChange={(event) =>
                      update(row.key, {
                        proteins:
                          typeof event.target.value === "string"
                            ? event.target.value.split(",")
                            : event.target.value,
                      })
                    }
                    renderValue={(value) => value.join(", ")}
                  >
                    {proteinOptions.map((protein) => (
                      <MenuItem key={protein} value={protein}>
                        <Checkbox checked={row.proteins.includes(protein)} />
                        {protein}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                  gap: 1,
                  mt: 2,
                }}
              >
                <Button
                  size="small"
                  color="error"
                  startIcon={<RemoveCircleOutlineIcon />}
                  disabled={saving || (row.hasOrders && row.stock === "0")}
                  onClick={async () => {
                    if (row.hasOrders) {
                      const result = await appAlert.fire({
                        icon: "info",
                        title: "Este plato ya tiene pedidos",
                        text: `${row.nombre} no se puede retirar. Puedes poner el stock en 0 para marcarlo agotado.`,
                        showCancelButton: true,
                        confirmButtonText: "Marcar agotado",
                        cancelButtonText: "Cancelar",
                      });
                      if (result.isConfirmed) update(row.key, { stock: "0" });
                      return;
                    }
                    const result = await appAlert.fire({
                      icon: "warning",
                      title: "¿Retirar este plato?",
                      text: `${row.nombre} se retirará al guardar los cambios. Los pedidos registrados se conservan.`,
                      showCancelButton: true,
                      confirmButtonText: "Retirar del menú",
                      cancelButtonText: "Cancelar",
                    });
                    if (!result.isConfirmed) return;
                    mark();
                    setRows((current) =>
                      current.filter((p) => p.key !== row.key),
                    );
                  }}
                >
                  {row.hasOrders ? "Marcar agotado" : "Retirar del menú"}
                </Button>
              </Box>
            </Paper>
          );
        })}
      </Box>
      <Paper
        variant="outlined"
        sx={{
          position: "sticky",
          bottom: 0,
          zIndex: 2,
          mt: 2,
          p: 2,
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="body2" fontWeight={700}>
          {rows.length} platos ·{" "}
          {rows.reduce(
            (sum, row) => sum + (integer(row.stock, 0) ? Number(row.stock) : 0),
            0,
          )}{" "}
          porciones disponibles
        </Typography>
        <Box
          sx={{
            display: { xs: "grid", sm: "flex" },
            gridTemplateColumns: "1fr 1fr",
            gap: 1,
            flexWrap: "wrap",
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <Button disabled={!dirty || saving} onClick={reset}>
            Deshacer
          </Button>
          <Button
            variant="outlined"
            disabled={!valid || saving}
            onClick={() => setPreview(true)}
          >
            Previsualizar
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{ gridColumn: { xs: "1 / -1", sm: "auto" } }}
            disabled={!dirty || !valid || saving}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </Box>
      </Paper>
      {preview && (
        <MenuPublicationPreview
          fecha={menu.fecha}
          precioBase={Number(base)}
          includes={`${text(menu.ensalada)} · ${menu.pan} · ${text(menu.postre)}`}
          dishes={rows.map((row) => ({
            id: row.key,
            nombre: row.nombre,
            descripcion: row.descripcion,
            imagenUrl: row.imageUrl,
            precio: Number(row.price || base),
            stock: Number(row.stock),
            esHipo: row.isHipo,
            opciones: row.proteins,
          }))}
          onClose={() => setPreview(false)}
        />
      )}
    </Box>
  );
}
