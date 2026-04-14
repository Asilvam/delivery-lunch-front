// src/components/OrderConfirmDialog.tsx
import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
    Divider,
    CircularProgress,
} from '@mui/material';
import type { CartItem } from '../types/cart';
import type { DailyMenu } from '../types/menu';
import type { OrderPayload } from '../types/order';
import styles from './OrderConfirmDialog.module.css';

interface OrderConfirmDialogProps {
    open: boolean;
    menu: DailyMenu;
    cartItems: CartItem[];
    totalPrice: number;
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
}: OrderConfirmDialogProps) => {
    const [cliente, setCliente] = useState('');
    const [telefono, setTelefono] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ cliente?: string; telefono?: string }>({});

    const validate = () => {
        const next: typeof errors = {};
        if (!cliente.trim()) next.cliente = 'El nombre es obligatorio';
        if (!telefono.trim()) next.telefono = 'El teléfono es obligatorio';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        const payload: OrderPayload = {
            menuId: menu.id,
            fecha: menu.isoDate,
            cliente: cliente.trim(),
            telefono: telefono.trim(),
            total: totalPrice,
            items: cartItems.map((item) => ({
                platoId: item.dish.id,
                nombre: item.dish.name,
                cantidad: item.quantity,
                precio: item.dish.price,
                selecciones: {
                    ...(item.selections.protein ? { proteina: item.selections.protein } : {}),
                    ...(item.selections.salad   ? { ensalada: item.selections.salad }   : {}),
                    postre: item.selections.dessert,
                },
            })),
        };

        setIsSubmitting(true);
        try {
            await onSubmit(payload);
        } finally {
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
            maxWidth="xs"
            PaperProps={{ className: styles.dialogPaper }}
        >
            <DialogTitle className={styles.title}>
                <Typography component="div" variant="h6" fontWeight={800} color="primary.dark">
                    Tu Pedido - paso 2 de 2
                </Typography>
                <Typography component="div" variant="caption" color="text.secondary">
                    Completa tus datos para enviar el pedido
                </Typography>
            </DialogTitle>

            <DialogContent>
                <Box className={styles.form}>
                    {/* Datos del cliente */}
                    <TextField
                        label="Nombre"
                        value={cliente}
                        onChange={(e) => setCliente(e.target.value)}
                        error={Boolean(errors.cliente)}
                        helperText={errors.cliente}
                        disabled={isSubmitting}
                        fullWidth
                        size="small"
                        autoFocus
                        inputProps={{ autoComplete: 'name' }}
                    />
                    <TextField
                        label="Teléfono"
                        type="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        error={Boolean(errors.telefono)}
                        helperText={errors.telefono}
                        disabled={isSubmitting}
                        fullWidth
                        size="small"
                        inputProps={{ autoComplete: 'tel' }}
                    />

                    {/* Resumen del pedido */}
                    <Box className={styles.summaryBox}>
                        <Typography className={styles.summaryTitle}>
                            Resumen
                        </Typography>
                        {cartItems.map((item) => (
                            <Box key={item.key} className={styles.summaryItem}>
                                <Typography className={styles.summaryItemName}>
                                    {item.dish.name}
                                </Typography>
                                <Typography className={styles.summaryItemQty}>
                                    x{item.quantity}
                                </Typography>
                                <Typography className={styles.summaryItemPrice}>
                                    ${(item.dish.price * item.quantity).toLocaleString('es-CL')}
                                </Typography>
                            </Box>
                        ))}
                        <Divider className={styles.divider} />
                        <Box className={styles.totalRow}>
                            <Typography className={styles.totalLabel}>Total</Typography>
                            <Typography className={styles.totalAmount}>
                                ${totalPrice.toLocaleString('es-CL')}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions className={styles.actions}>
                <Button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className={styles.cancelButton}
                    fullWidth
                >
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={styles.submitButton}
                    fullWidth
                    startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {isSubmitting ? 'Confirmando...' : 'Confirmar datos'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
