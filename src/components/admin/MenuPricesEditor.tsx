import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  InputAdornment,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { MENU_PRICE } from "../../domain/menu/menuOffer";
import type { BackendDailyMenuDto } from "../../types/menu";
import type { MenuPricesInput } from "../../data/services/menuPricingApi.service";

interface Props {
  menu: BackendDailyMenuDto;
  saving: boolean;
  onSave: (input: MenuPricesInput) => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
}
const money = (value: number) => `$${value.toLocaleString("es-CL")}`;
const validPrice = (value: string) =>
  /^\d+$/.test(value) &&
  Number.isSafeInteger(Number(value)) &&
  Number(value) > 0;

export default function MenuPricesEditor({
  menu,
  saving,
  onSave,
  onDirtyChange,
}: Props) {
  const initialBase = menu.precioBase ?? MENU_PRICE;
  const initialRows = () =>
    menu.platos.map((dish) => ({
      id: dish._id,
      special: dish.precio !== initialBase,
      price: String(dish.precio),
    }));
  const [base, setBase] = useState(String(initialBase));
  const [rows, setRows] = useState(initialRows);
  const prices = rows.map((row) => ({
    id: row.id,
    precio: Number(row.special ? row.price : base),
  }));
  const valid =
    validPrice(base) &&
    rows.every((row) => !row.special || validPrice(row.price));
  const isDirty = (nextBase: string, nextRows: typeof rows) =>
    nextBase !== String(initialBase) ||
    nextRows.some(
      (row, index) =>
        Number(row.special ? row.price : nextBase) !==
        menu.platos[index].precio,
    );
  const dirty = isDirty(base, rows);
  const changeBase = (value: string) => {
    setBase(value);
    onDirtyChange(isDirty(value, rows));
  };
  const changeRow = (id: string, change: Partial<(typeof rows)[number]>) => {
    const next = rows.map((row) =>
      row.id === id ? { ...row, ...change } : row,
    );
    setRows(next);
    onDirtyChange(isDirty(base, next));
  };
  return (
    <Box
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid && dirty && !saving)
          void onSave({
            precioBase: Number(base),
            platos: prices,
            ...(menu.updatedAt ? { expectedUpdatedAt: menu.updatedAt } : {}),
          });
      }}
    >
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
        <Typography component="h2" variant="h6" sx={{ mb: 1 }}>
          Precio general
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          Se destaca en el inicio. Los platos que usen este precio mostrarán
          solo el botón Agregar.
        </Typography>
        <TextField
          label="Precio general del menú"
          value={base}
          onChange={(event) => changeBase(event.target.value)}
          disabled={saving}
          error={!validPrice(base)}
          helperText={
            !validPrice(base)
              ? "Ingresa un monto entero mayor a cero."
              : "Pesos chilenos, sin decimales."
          }
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            },
            htmlInput: { inputMode: "numeric" },
          }}
          fullWidth
          sx={{ maxWidth: 360 }}
        />
      </Paper>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography component="h2" variant="h6" sx={{ mb: 1 }}>
          Precios por plato
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          Activa Precio especial para asignar un monto distinto. Ese monto
          aparecerá junto al botón del plato.
        </Typography>
        <Stack
          divider={
            <Box sx={{ borderBottom: "1px solid", borderColor: "divider" }} />
          }
        >
          {menu.platos.map((dish, index) => {
            const row = rows[index];
            return (
              <Box
                key={dish._id}
                sx={{
                  py: 2,
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { sm: "center" },
                  gap: 2,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={700}>{dish.nombre}</Typography>
                  {!row.special && (
                    <Typography variant="body2" color="text.secondary">
                      Usa el precio general
                      {validPrice(base) ? ` · ${money(Number(base))}` : ""}
                    </Typography>
                  )}
                </Box>
                <FormControlLabel
                  label="Precio especial"
                  control={
                    <Switch
                      checked={row.special}
                      disabled={saving}
                      onChange={(event) =>
                        changeRow(row.id, {
                          special: event.target.checked,
                          ...(!row.special
                            ? { price: validPrice(base) ? base : row.price }
                            : {}),
                        })
                      }
                      slotProps={{
                        input: {
                          "aria-label": `Precio especial de ${dish.nombre}`,
                        },
                      }}
                    />
                  }
                />
                {row.special && (
                  <TextField
                    label={`Precio de ${dish.nombre}`}
                    value={row.price}
                    onChange={(event) =>
                      changeRow(row.id, { price: event.target.value })
                    }
                    disabled={saving}
                    error={!validPrice(row.price)}
                    helperText={
                      !validPrice(row.price)
                        ? "Ingresa un monto entero mayor a cero."
                        : Number(row.price) === Number(base)
                          ? "Al coincidir, mostrará solo el botón."
                          : "Se mostrará junto a Agregar."
                    }
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                      },
                      htmlInput: { inputMode: "numeric" },
                    }}
                    sx={{ width: { xs: "100%", sm: 240 } }}
                  />
                )}
              </Box>
            );
          })}
        </Stack>
        {menu.platos.length === 0 && (
          <Alert severity="info">Este menú aún no tiene platos.</Alert>
        )}
      </Paper>
      <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={!dirty || !valid || saving || !rows.length}
        >
          {saving ? "Guardando…" : "Guardar precios"}
        </Button>
        <Button
          disabled={!dirty || saving}
          onClick={() => {
            setBase(String(initialBase));
            setRows(initialRows());
            onDirtyChange(false);
          }}
        >
          Deshacer cambios
        </Button>
      </Stack>
    </Box>
  );
}
