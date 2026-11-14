import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../../hooks/useAuth";
import { useOrderingHours } from "../../hooks/useOrderingHours";
import { useSweetAlertOpen } from "../../hooks/useSweetAlertOpen";
import { useMountedRef } from "../../hooks/useMountedRef";
import { fetchDailyMenusFromApi } from "../../data/services/menuApi.service";
import {
  getPendingManualOrder,
  sendManualOrder,
} from "../../data/services/orderApi.service";
import { normalizePhone, phoneError } from "../../domain/checkout/contact";
import { ORDERING_HOURS_MESSAGE } from "../../domain/orders/orderingHours";
import { staffAlert } from "../../utils/notifications";
import type { DailyMenu } from "../../types/menu";
import type { Order, OrderPayload } from "../../types/order";

const newRow = () => ({
  key: crypto.randomUUID(),
  dishId: "",
  quantity: "1",
  protein: "",
});
export default function ManualOrderDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (order: Order) => void;
}) {
  const { token } = useAuth();
  const openHours = useOrderingHours();
  const sweetAlertOpen = useSweetAlertOpen();
  const mounted = useMountedRef();
  const [pending, setPending] = useState(getPendingManualOrder);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rows, setRows] = useState(() => [newRow()]);
  const [menu, setMenu] = useState<DailyMenu>();
  const [loading, setLoading] = useState(!pending);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (pending) return;
    const ctrl = new AbortController();
    fetchDailyMenusFromApi(ctrl.signal)
      .then((menus) => {
        if (!ctrl.signal.aborted) {
          setMenu(menus[0]);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setFailed(true);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [revision, pending]);
  const update = (key: string, change: Partial<ReturnType<typeof newRow>>) =>
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...change } : row)),
    );
  const quantities = new Map<string, number>();
  for (const row of rows)
    quantities.set(
      row.dishId,
      (quantities.get(row.dishId) ?? 0) + Number(row.quantity),
    );
  const valid =
    !!menu &&
    !!name.trim() &&
    !phoneError(phone) &&
    rows.length > 0 &&
    rows.every((row) => {
      const dish = menu.dishes.find((item) => item.id === row.dishId);
      return (
        dish &&
        /^\d+$/.test(row.quantity) &&
        Number.isSafeInteger(Number(row.quantity)) &&
        Number(row.quantity) > 0 &&
        quantities.get(dish.id)! <= (dish.stock ?? 0) &&
        (!dish.isHipo || dish.proteinOptions?.includes(row.protein))
      );
    });
  const total =
    pending?.payload.total ??
    rows.reduce(
      (sum, row) =>
        sum +
        (menu?.dishes.find((dish) => dish.id === row.dishId)?.price ?? 0) *
          (Number(row.quantity) || 0),
      0,
    );
  const submit = async () => {
    if (!token || saving || (!pending && (!valid || !openHours || !menu)))
      return;
    const payload: OrderPayload = pending?.payload ?? {
      menuId: menu!.id,
      fecha: menu!.isoDate,
      cliente: name.trim(),
      telefono: normalizePhone(phone),
      total,
      items: rows.map((row) => {
        const dish = menu!.dishes.find((item) => item.id === row.dishId)!;
        return {
          platoId: dish.id,
          nombre: dish.name,
          cantidad: Number(row.quantity),
          precio: dish.price,
          selecciones: {
            postre: "Postre del día",
            ...(dish.isHipo ? { proteina: row.protein } : {}),
          },
        };
      }),
    };
    setSaving(true);
    try {
      const order = await sendManualOrder(payload, token);
      if (!mounted.current) return;
      onCreated(order);
      onClose();
      void staffAlert.fire({
        icon: "success",
        title: "Pedido creado, pendiente de aprobación",
        timer: 1000,
      });
    } catch (error) {
      if (!mounted.current) return;
      const attempt = getPendingManualOrder();
      setPending(attempt);
      if (!attempt) {
        setLoading(true);
        setRevision((value) => value + 1);
      }
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: unknown } } }).response
              ?.data?.message
          : null;
      void staffAlert.fire({
        icon: "error",
        title: attempt
          ? "Envío pendiente de confirmación. Reintenta para conocer el resultado."
          : typeof message === "string"
            ? message
            : "No pudimos crear el pedido. Revisa los datos e intenta nuevamente.",
      });
    } finally {
      if (mounted.current) setSaving(false);
    }
  };
  const locked = saving || !!pending;
  return (
    <Dialog
      open
      onClose={() => {
        if (!saving) onClose();
      }}
      fullWidth
      maxWidth="md"
      disableEnforceFocus={sweetAlertOpen}
      disableRestoreFocus={sweetAlertOpen}
      aria-labelledby="manual-order-title"
    >
      <DialogTitle id="manual-order-title">Crear pedido</DialogTitle>
      <DialogContent dividers>
        {pending ? (
          <>
            <Typography sx={{ mb: 2 }}>
              Hay un envío pendiente. Confirma su resultado antes de crear otro
              pedido.
            </Typography>
            <Typography fontWeight={700}>
              {pending.payload.cliente} · {pending.payload.telefono}
            </Typography>
            {pending.payload.items.map((item, index) => (
              <Typography key={index}>
                {item.cantidad} × {item.nombre}
                {item.selecciones.proteina
                  ? ` · ${item.selecciones.proteina}`
                  : ""}
              </Typography>
            ))}
          </>
        ) : (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
                mb: 2,
              }}
            >
              <TextField
                label="Nombre"
                value={name}
                required
                disabled={locked}
                onChange={(event) => setName(event.target.value)}
              />
              <TextField
                label="Teléfono"
                type="tel"
                value={phone}
                required
                disabled={locked}
                onChange={(event) => setPhone(event.target.value)}
                error={!!phone && !!phoneError(phone)}
                helperText={phone ? phoneError(phone) : ""}
              />
            </Box>
            {!openHours && (
              <Typography role="status" color="text.secondary" sx={{ mb: 2 }}>
                {ORDERING_HOURS_MESSAGE}
              </Typography>
            )}
            {loading ? (
              <CircularProgress size={24} aria-label="Cargando menú" />
            ) : failed ? (
              <Button
                onClick={() => {
                  setLoading(true);
                  setRevision((value) => value + 1);
                }}
              >
                Reintentar carga del menú
              </Button>
            ) : !menu ? (
              <Typography>No hay menú publicado para hoy.</Typography>
            ) : (
              <>
                {rows.map((row, index) => {
                  const dish = menu.dishes.find(
                    (item) => item.id === row.dishId,
                  );
                  return (
                    <Paper
                      variant="outlined"
                      key={row.key}
                      sx={{ p: 2, mb: 1.5 }}
                    >
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            sm: "minmax(0,1fr) 100px auto",
                          },
                          gap: 1.5,
                          alignItems: "start",
                        }}
                      >
                        <TextField
                          select
                          label={`Plato ${index + 1}`}
                          value={row.dishId}
                          disabled={locked || !openHours}
                          onChange={(event) =>
                            update(row.key, {
                              dishId: event.target.value,
                              protein: "",
                            })
                          }
                          helperText={
                            dish
                              ? `$${dish.price.toLocaleString("es-CL")} · ${dish.stock ?? 0} disponibles`
                              : "Elige un plato"
                          }
                        >
                          {menu.dishes.map((item) => (
                            <MenuItem
                              key={item.id}
                              value={item.id}
                              disabled={!item.stock}
                            >
                              {item.name}
                              {!item.stock ? " · Agotado" : ""}
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          label={`Cantidad ${index + 1}`}
                          type="number"
                          value={row.quantity}
                          disabled={locked || !openHours}
                          onChange={(event) =>
                            update(row.key, { quantity: event.target.value })
                          }
                          slotProps={{
                            htmlInput: { min: 1, max: dish?.stock, step: 1 },
                          }}
                        />
                        {rows.length > 1 && (
                          <Button
                            color="error"
                            disabled={locked}
                            onClick={() =>
                              setRows((current) =>
                                current.filter((item) => item.key !== row.key),
                              )
                            }
                            aria-label={`Quitar plato ${index + 1}`}
                          >
                            Quitar
                          </Button>
                        )}
                        {dish?.isHipo && (
                          <TextField
                            select
                            required
                            label={`Proteína ${index + 1}`}
                            value={row.protein}
                            disabled={locked || !openHours}
                            onChange={(event) =>
                              update(row.key, { protein: event.target.value })
                            }
                            sx={{ gridColumn: "1 / -1" }}
                          >
                            {dish.proteinOptions?.map((protein) => (
                              <MenuItem key={protein} value={protein}>
                                {protein}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      </Box>
                    </Paper>
                  );
                })}
                <Button
                  disabled={locked || !openHours}
                  onClick={() => setRows((current) => [...current, newRow()])}
                >
                  Agregar otro plato
                </Button>
              </>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions
        sx={{ p: 2, flexWrap: "wrap", gap: 1, justifyContent: "space-between" }}
      >
        <Typography fontWeight={800}>
          Total: ${total.toLocaleString("es-CL")}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onClose} disabled={saving}>
            Volver
          </Button>
          <Button
            variant="contained"
            disabled={saving || (!pending && (!valid || !openHours || loading))}
            onClick={() => void submit()}
          >
            {saving
              ? "Enviando…"
              : pending
                ? "Confirmar envío pendiente"
                : "Crear pedido"}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
