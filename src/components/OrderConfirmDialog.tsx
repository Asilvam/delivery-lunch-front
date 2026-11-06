import CloseIcon from "@mui/icons-material/Close";
import { normalizePhone, phoneError } from "../domain/checkout/contact";
import { OrderSummary } from "./OrderSummary";
import { MENU_SALAD, MENU_DESSERT } from "../domain/menu/menuOffer";
import { GoogleCustomerAccess } from "./GoogleCustomerAccess";
import { useCustomerSession } from "../hooks/useCustomerSession";
// src/components/OrderConfirmDialog.tsx
import { useState, useEffect, useRef, useId } from "react";
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
  IconButton,
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
  const formId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
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
    next.telefono = phoneError(telefono);
    if (!next.telefono) delete next.telefono;
    setErrors(next);
    if (next.cliente) nameRef.current?.focus();
    else if (next.telefono) phoneRef.current?.focus();
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!session || submitting.current || (!pendingPayload && !validate()))
      return;
    if ((!menu || cartItems.length === 0) && !pendingPayload) return;
    submitting.current = true;

    const payload: OrderPayload = pendingPayload ?? {
      menuId: menu!.id,
      fecha: menu!.isoDate,
      cliente: customerName.trim(),
      telefono: normalizePhone(telefono),
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
      maxWidth="md"
      aria-labelledby={`${formId}-title`}
      aria-describedby={`${formId}-description`}
      PaperProps={{ className: styles.dialogPaper }}
    >
      <DialogTitle id={`${formId}-header`} className={styles.title} component="div">
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ lineHeight: 1.6 }}
            >
              Paso 2 de 2
            </Typography>
            <Typography
              id={`${formId}-title`}
              component="h2"
              variant="h6"
              fontWeight={800}
              color="primary.dark"
            >
              Confirma tu pedido
            </Typography>
          </Box>
          <IconButton
            aria-label="Cerrar confirmación del pedido"
            onClick={handleClose}
            disabled={isSubmitting}
            sx={{ width: 44, height: 44, bgcolor: "secondary.light" }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Typography
          id={`${formId}-description`}
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          {session
            ? "Revisa tus datos y el total antes de enviar."
            : "Identifícate con Google para confirmar. Tu pedido se conserva."}
        </Typography>
      </DialogTitle>

      <DialogContent className={styles.content}>
        <Box
          component="form"
          id={formId}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
          aria-busy={isSubmitting}
          className={styles.form}
        >
          <Box className={styles.customerColumn}>
            {!session && (
              <Typography component="h3" variant="subtitle2" fontWeight={800}>
                Identificación
              </Typography>
            )}
            <GoogleCustomerAccess disabled={isSubmitting} />
            {pendingPayload && (
              <Alert severity="warning">
                Hay un envío sin confirmar. Reinténtalo para recuperar su
                resultado sin crear otro pedido.
              </Alert>
            )}
            {session && (
              <Box
                component="section"
                aria-label="Datos de contacto"
                sx={{ display: "grid", gap: 2 }}
              >
                <Typography component="h3" variant="subtitle2" fontWeight={800}>
                  Tus datos de contacto
                </Typography>
                <TextField
                  label="Nombre"
                  value={pendingPayload?.cliente ?? customerName}
                  onChange={(e) => {
                    setCliente(e.target.value);
                    setErrors((prev) => ({ ...prev, cliente: undefined }));
                  }}
                  onBlur={() => {
                    if (!pendingPayload)
                      setErrors((prev) => ({
                        ...prev,
                        cliente: customerName.trim()
                          ? undefined
                          : "El nombre es obligatorio",
                      }));
                  }}
                  error={Boolean(errors.cliente)}
                  helperText={errors.cliente}
                  disabled={isSubmitting || Boolean(pendingPayload)}
                  fullWidth
                  size="small"
                  inputRef={nameRef}
                  autoComplete="name"
                  required
                />
                <TextField
                  label="Teléfono"
                  type="tel"
                  value={pendingPayload?.telefono ?? telefono}
                  placeholder="+56 9 1234 5678"
                  onChange={(e) => {
                    setTelefono(e.target.value);
                    setErrors((prev) => ({ ...prev, telefono: undefined }));
                  }}
                  onBlur={() => {
                    if (!pendingPayload) {
                      setTelefono(normalizePhone(telefono));
                      setErrors((prev) => ({
                        ...prev,
                        telefono: phoneError(telefono),
                      }));
                    }
                  }}
                  error={Boolean(errors.telefono)}
                  helperText={
                    errors.telefono ?? "Para contactarte sobre este pedido."
                  }
                  disabled={isSubmitting || Boolean(pendingPayload)}
                  fullWidth
                  size="small"
                  inputRef={phoneRef}
                  autoComplete="tel"
                  required
                  slotProps={{ htmlInput: { inputMode: "tel" } }}
                />
              </Box>
            )}

            {!session && (
              <Typography variant="body2" color="text.secondary">
                Al ingresar podrás revisar tu nombre y teléfono de contacto.
              </Typography>
            )}
          </Box>

          <Box className={styles.summaryColumn}>
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
        </Box>
      </DialogContent>

      <DialogActions
        className={styles.actions}
        sx={{
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        {session && (
          <Typography
            variant="caption"
            color="text.secondary"
            className={styles.actionHint}
          >
            {pendingPayload
              ? "Recuperaremos el resultado del mismo pedido."
              : "El local revisará y confirmará tu pedido."}
          </Typography>
        )}
        <Button
          type="submit"
          form={formId}
          variant="contained"
          disabled={
            isSubmitting ||
            !session ||
            (!pendingPayload && (!menu || cartItems.length === 0))
          }
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
              : `Enviar pedido · $${totalPrice.toLocaleString("es-CL")}`}
        </Button>
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
          className={styles.cancelButton}
          fullWidth
        >
          Volver al pedido
        </Button>
      </DialogActions>
    </Dialog>
  );
};
