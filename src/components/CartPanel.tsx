import {
  Box,
  List,
  ListItem,
  Divider,
  Typography,
  IconButton,
  Button,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import type { CartItem } from '../types/cart';
import { getRemainingDishStock } from '../domain/cart/stock.rules';
import styles from './CartPanel.module.css';

interface CartPanelProps {
  cartItems: CartItem[];
  totalItems: number;
  totalPrice: number;
  isMobile: boolean;
  onClose: () => void;
  onUpdateQuantity: (cartItemKey: string, delta: number) => void;
  onRemove: (cartItemKey: string) => void;
  onConfirmOrder: () => void;
}

export function CartPanel({
  cartItems,
  totalItems,
  totalPrice,
  isMobile,
  onClose,
  onUpdateQuantity,
  onRemove,
  onConfirmOrder,
}: CartPanelProps) {
  return (
    <Box
      sx={{
        width: isMobile ? '100%' : 400,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: isMobile ? '85vh' : '100%',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          pb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'secondary.light',
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={800} color="primary.dark">
            Tu Pedido - paso 1 de 2
          </Typography>
          {totalItems > 0 && (
            <Typography variant="caption" color="text.secondary">
              {totalItems} {totalItems === 1 ? 'plato' : 'platos'}
            </Typography>
          )}
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            bgcolor: 'secondary.light',
            '&:hover': { bgcolor: 'secondary.main' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Items */}
      <List sx={{ flexGrow: 1, overflowY: 'auto', px: 2, py: 1 }}>
        {cartItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <RestaurantMenuIcon
              sx={{ fontSize: 56, color: 'secondary.main', mb: 1 }}
            />
            <Typography color="text.secondary" fontWeight={500}>
              Aún no has agregado platos.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Explora el menú y agrega tus favoritos
            </Typography>
          </Box>
        ) : (
          cartItems.map((item) => {
            const remainingStock = getRemainingDishStock(cartItems, item.dish);
            const isAtStockLimit =
              typeof remainingStock === 'number' && remainingStock === 0;
            return (
              <ListItem
                key={item.key}
                disablePadding
                sx={{
                  py: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 0.75,
                  }}
                >
                  <Box sx={{ pr: 1, flex: 1 }}>
                    <Typography
                      fontWeight={600}
                      sx={{ fontSize: '0.9rem', color: 'text.primary' }}
                    >
                      {item.dish.name}
                    </Typography>
                    <Box sx={{ display: 'grid', gap: 0.35, mt: 0.5 }}>
                      {item.visibility.protein && item.selections.protein && (
                        <Typography variant="caption" color="text.secondary">
                          Proteína: {item.selections.protein}
                        </Typography>
                      )}
                      {item.visibility.salad && item.selections.salad && (
                        <Typography variant="caption" color="text.secondary">
                          Ensalada: {item.selections.salad}
                        </Typography>
                      )}
                      {item.visibility.dessert && (
                        <Typography variant="caption" color="text.secondary">
                          Postre: {item.selections.dessert}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Typography
                    fontWeight={800}
                    color="primary.main"
                    sx={{ whiteSpace: 'nowrap', fontSize: '0.95rem' }}
                  >
                    ${(item.dish.price * item.quantity).toLocaleString('es-CL')}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      bgcolor: 'secondary.light',
                      borderRadius: 99,
                      px: 0.5,
                      py: 0.3,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => onUpdateQuantity(item.key, -1)}
                      color="primary"
                      sx={{ p: 0.4 }}
                    >
                      <RemoveIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <Typography
                      fontWeight={700}
                      sx={{
                        minWidth: 22,
                        textAlign: 'center',
                        fontSize: '0.9rem',
                      }}
                    >
                      {item.quantity}
                    </Typography>
                    <Tooltip
                      title={isAtStockLimit ? 'Stock máximo alcanzado' : ''}
                      placement="top"
                    >
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onUpdateQuantity(item.key, 1)}
                          color="primary"
                          disabled={isAtStockLimit}
                          sx={{ p: 0.4 }}
                        >
                          <AddIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                  <Tooltip title="Eliminar plato">
                    <IconButton
                      onClick={() => onRemove(item.key)}
                      size="small"
                      sx={{
                        color: 'error.main',
                        bgcolor: 'rgba(211,47,47,0.06)',
                        '&:hover': { bgcolor: 'rgba(211,47,47,0.14)' },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Divider sx={{ mt: 1.5 }} />
              </ListItem>
            );
          })
        )}
      </List>

      {/* Footer / Total */}
      {cartItems.length > 0 && (
        <Box
          sx={{
            p: 3,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'secondary.light',
            bgcolor: 'white',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography fontWeight={600} color="text.secondary" fontSize="0.9rem">
              Total
            </Typography>
            <Typography variant="h5" fontWeight={800} color="primary.main">
              ${totalPrice.toLocaleString('es-CL')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={onConfirmOrder}
            className={styles.cartConfirmButton}
          >
            Confirmar pedido
          </Button>
        </Box>
      )}
    </Box>
  );
}
