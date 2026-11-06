import { OrderSummary } from "./OrderSummary";
import { MENU_SALAD, MENU_DESSERT } from "../domain/menu/menuOffer";
import { GoogleCustomerAccess } from "./GoogleCustomerAccess";
import { useCustomerSession } from "../hooks/useCustomerSession";
// src/components/OrderConfirmDialog.tsx
import { useState, useEffect, useRef } from "react";
import {
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import type { CartItem } from "../types/cart";
import type { DailyMenu } from "../types/menu";
import type { OrderPayload } from "../types/order";
import styles from "./OrderConfirmDialog.module.css";

interface OrderConfirmDialogProps {
  open: boolean;
  menu?: DailyMenu;
  cartItems: CartItem[];
  totalPrice: number;
  pendingPayload?: OrderPayload;
  onClose: () => void;
  onSubmit: (payload: OrderPayload) => Promise<void>;
}

export const OrderConfirmDialog = ({
  open,
  menu,
  cartItems,
  totalPrice,
  onClose,
  onSubmit,
  pendingPayload,
}: OrderConfirmDialogProps) => {
  const { session } = useCustomerSession();
  const submitting = useRef(false);
  const stored = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("checkout_contact") || "{}") as {
        cliente?: string;
        telefono?: string;
      };
    } catch {
      return {};
    }
  })();
  const [cliente, setCliente] = useState<string | null>(stored.cliente ?? null);
  const customerName = cliente ?? session?.customer.name ?? "";
  const [telefono, setTelefono] = useState(stored.telefono || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ cliente?: string; telefono?: string }>(
    {},
  );

  useEffect(() => {
    sessionStorage.setItem(
      "checkout_contact",
      JSON.stringify({ cliente, telefono }),
    );
  }, [cliente, telefono]);
  const validate = () => {
    const next: typeof errors = {};
    if (!customerName.trim()) next.cliente = "El nombre es obligatorio";
    if (
      !/^\+?[0-9 ()-]{8,20}$/.test(telefono.trim()) ||
      telefono.replace(/\D/g, "").length < 8
    )
      next.telefono = "Ingresa un teléfono válido con código de país";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!session || submitting.current || (!pendingPayload && !validate()))
      return;
    if (!menu && !pendingPayload) return;
    submitting.current = true;

    const payload: OrderPayload = pendingPayload ?? {
      menuId: menu!.id,
      fecha: menu!.isoDate,
      cliente: customerName.trim(),
      telefono: telefono.trim(),
      total: totalPrice,
      items: cartItems.map((item) => ({
        platoId: item.dish.id,
        nombre: item.dish.name,
        cantidad: item.quantity,
        precio: item.dish.price,
        selecciones: {
          ...(item.dish.isHipo && item.selections.protein
            ? { proteina: item.selections.protein }
            : {}),
          ensalada: MENU_SALAD,
          postre: MENU_DESSERT,
        },
      })),
    };

    setIsSubmitting(true);
    try {
      await onSubmit(pendingPayload || payload);
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setErrors({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ className: styles.dialogPaper }}
    >
      <DialogTitle className={styles.title}>
        <Typography
          component="div"
          variant="h6"
          fontWeight={800}
          color="primary.dark"
        >
          Tu Pedido - paso 2 de 2
        </Typography>
        <Typography component="div" variant="caption" color="text.secondary">
          Identifícate con Google y revisa tus datos antes de enviar
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box className={styles.form}>
          <GoogleCustomerAccess disabled={isSubmitting} />
          {pendingPayload && (
            <Alert severity="warning">
              Hay un envío sin confirmar. Reinténtalo para recuperar su
              resultado sin crear otro pedido.
            </Alert>
          )}
          {/* Datos del cliente */}
          <TextField
            label="Nombre"
            value={pendingPayload?.cliente ?? customerName}
            onChange={(e) => setCliente(e.target.value)}
            error={Boolean(errors.cliente)}
            helperText={errors.cliente}
            disabled={isSubmitting || Boolean(pendingPayload)}
            fullWidth
            size="small"
            autoFocus
            inputProps={{ autoComplete: "name" }}
          />
          <TextField
            label="Teléfono"
            type="tel"
            value={pendingPayload?.telefono ?? telefono}
            onChange={(e) => setTelefono(e.target.value)}
            error={Boolean(errors.telefono)}
            helperText={errors.telefono}
            disabled={isSubmitting || Boolean(pendingPayload)}
            fullWidth
            size="small"
            inputProps={{ autoComplete: "tel" }}
          />

          {/* Resumen del pedido */}
          <OrderSummary
            items={
              pendingPayload
                ? pendingPayload.items.map((item, index) => ({
                    key: `${item.platoId}-${index}`,
                    name: item.nombre,
                    quantity: item.cantidad,
                    price: item.precio,
                    protein: item.selecciones?.proteina,
                  }))
                : cartItems.map((item) => ({
                    key: item.key,
                    name: item.dish.isHipo
                      ? "Menú hipocalórico"
                      : item.dish.name,
                    quantity: item.quantity,
                    price: item.dish.price,
                    protein: item.dish.isHipo
                      ? item.selections.protein
                      : undefined,
                  }))
            }
            total={pendingPayload?.total ?? totalPrice}
          />
        </Box>
      </DialogContent>

      <DialogActions className={styles.actions}>
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
          className={styles.cancelButton}
          fullWidth
        >
          Volver al pedido
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting || !session}
          className={styles.submitButton}
          fullWidth
          startIcon={
            isSubmitting ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          {isSubmitting
            ? "Enviando pedido…"
            : pendingPayload
              ? "Reintentar el mismo envío"
              : "Enviar pedido"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
