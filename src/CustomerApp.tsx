// src/CustomerApp.tsx
import { useEffect, useState } from 'react';
import {
  Container,
  CssBaseline,
  ThemeProvider,
  Typography,
  Box,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Drawer,
  Dialog,
  Button,
  useMediaQuery,
  alpha,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import Swal from 'sweetalert2';

import { appTheme } from './theme/appTheme';
import { buildCartItemKey } from './domain/cart/cartHelpers';
import {
  userToast,
  showAddToCartFeedback,
  showStockLimitFeedback,
  triggerCompletionFeedback,
} from './utils/feedback';
import { CartPanel } from './components/CartPanel';
import { DishCard } from './components/DishCard';
import { MenuLoadingScreen } from './components/MenuLoadingScreen';
import { OrderConfirmDialog } from './components/OrderConfirmDialog';
import { fetchDailyMenus, getMenuDateTimestamp } from './api/menu';
import { sendOrder } from './api/order';
import type {
  DailyMenu,
  Dish,
  DishSelectionVisibility,
  DishSelections,
} from './types/menu';
import type { CartItem } from './types/cart';
import type { OrderPayload } from './types/order';
import { canAddDish, getRemainingDishStock } from './domain/cart/stock.rules';
import { logger } from './shared/utils/logger';

export default function CustomerApp() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [menus, setMenus] = useState<DailyMenu[]>([]);
  const [isLoadingMenus, setIsLoadingMenus] = useState(true);
  const [menuLoadError, setMenuLoadError] = useState<string | null>(null);
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
  const isMobile = useMediaQuery(appTheme.breakpoints.down('sm'));

  useEffect(() => {
    let mounted = true;
    const loadMenus = async () => {
      logger.info('[App] Cargando menús...');
      try {
        setIsLoadingMenus(true);
        const [data] = await Promise.all([
          fetchDailyMenus(),
          new Promise<void>((resolve) => setTimeout(resolve, 1000)),
        ]);
        if (!mounted) return;
        logger.info(`[App] Menús cargados: ${data.length} día(s)`, data);
        setMenus(data);
        setMenuLoadError(null);
        setSelectedMenuIndex(0);
        if (data.length === 0) {
          logger.warn('[App] El backend no retornó menús para hoy');
          void userToast.fire({ icon: 'info', title: 'Sin menús disponibles para hoy.' });
        }
      } catch (error) {
        if (!mounted) return;
        logger.error('[App] Error al cargar menús', error);
        setMenuLoadError('No se pudieron cargar los menús diarios.');
        setMenus([]);
        void userToast.fire({ icon: 'error', title: 'Error al cargar menús. Intenta nuevamente.' });
      } finally {
        if (mounted) setIsLoadingMenus(false);
      }
    };
    void loadMenus();
    return () => {
      mounted = false;
      Swal.close();
    };
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  const availableMenus: DailyMenu[] = menus.filter((menu) => {
    const ts = getMenuDateTimestamp(menu.date);
    return ts !== null && ts >= todayTimestamp;
  });

  const menusForNavigation = availableMenus.length > 0 ? availableMenus : menus;
  const selectedMenu = menusForNavigation[selectedMenuIndex] ?? menusForNavigation[0];
  const canGoBack = selectedMenuIndex > 0;
  const canGoForward = selectedMenuIndex < menusForNavigation.length - 1;

  const handleAddToCart = (
    dishToAdd: Dish,
    selections: DishSelections,
    visibility: DishSelectionVisibility,
  ) => {
    const cartItemKey = buildCartItemKey(dishToAdd.id, selections);
    const remainingStock = getRemainingDishStock(cartItems, dishToAdd);

    if (dishToAdd.stock === 0) {
      logger.warn(`[App] Intento de agregar plato agotado: ${dishToAdd.name}`);
      void showStockLimitFeedback(dishToAdd.name, true, 0);
      return;
    }

    if (!canAddDish(cartItems, dishToAdd)) {
      logger.warn(`[App] Stock límite alcanzado para: ${dishToAdd.name}`);
      void showStockLimitFeedback(dishToAdd.name, false, remainingStock ?? 0);
      return;
    }

    let nextQuantity = 0;
    let wasExisting = false;
    let wasBlocked = false;

    setCartItems((prev) => {
      if (!canAddDish(prev, dishToAdd)) {
        wasBlocked = true;
        return prev;
      }
      const existing = prev.find((item) => item.key === cartItemKey);
      wasExisting = Boolean(existing);
      nextQuantity = existing ? existing.quantity + 1 : 1;
      return existing
        ? prev.map((item) =>
            item.key === cartItemKey
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [
            ...prev,
            { key: cartItemKey, dish: dishToAdd, quantity: 1, selections, visibility },
          ];
    });

    if (wasBlocked) {
      void showStockLimitFeedback(dishToAdd.name, false, 0);
      return;
    }
    void showAddToCartFeedback(dishToAdd.name, nextQuantity, wasExisting);
    logger.debug(`[App] Carrito actualizado — ${dishToAdd.name} x${nextQuantity}`);
  };

  const handleUpdateQuantity = (cartItemKey: string, delta: number) => {
    const targetItem = cartItems.find((item) => item.key === cartItemKey);
    if (!targetItem) return;
    let wasBlocked = false;
    setCartItems((prev) => {
      const currentTargetItem = prev.find((item) => item.key === cartItemKey);
      if (!currentTargetItem) return prev;
      if (delta > 0 && !canAddDish(prev, currentTargetItem.dish)) {
        wasBlocked = true;
        return prev;
      }
      return prev.map((item) =>
        item.key === cartItemKey
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      );
    });
    if (wasBlocked)
      void showStockLimitFeedback(targetItem.dish.name, targetItem.dish.stock === 0, 0);
  };

  const handleRemoveFromCart = (cartItemKey: string) => {
    setCartItems((prev) => prev.filter((item) => item.key !== cartItemKey));
  };

  const handleConfirmOrder = () => {
    if (cartItems.length === 0) {
      void userToast.fire({ icon: 'info', title: 'No hay platos en el carrito.' });
      return;
    }
    logger.info('[App] Abriendo dialog de confirmación de pedido');
    setIsCartOpen(false);
    setIsOrderDialogOpen(true);
  };

  const handleSubmitOrder = async (payload: OrderPayload) => {
    const waitFrame = () => new Promise<void>((resolve) => setTimeout(resolve, 200));
    try {
      await sendOrder(payload);
      setIsOrderDialogOpen(false);
      triggerCompletionFeedback();
      await waitFrame();
      await Swal.fire({
        icon: 'success',
        title: '¡Pedido confirmado!',
        text: 'Tu pedido fue enviado correctamente.',
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#d81b60',
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: { icon: 'swal-icon-primary' },
      });
    } catch (error) {
      logger.error('[App] Error al enviar pedido', error);
      setIsOrderDialogOpen(false);
      await waitFrame();
      await Swal.fire({
        icon: 'error',
        title: 'Error al enviar el pedido',
        text: 'Ocurrió un problema al procesar tu pedido. Intenta nuevamente.',
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#d81b60',
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
    } finally {
      window.location.reload();
    }
  };

  const totalItems = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const totalPrice = cartItems.reduce((acc, i) => acc + i.dish.price * i.quantity, 0);

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />

      {/* ─── APP BAR ──────────────────────────────────────────────────────────── */}
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: alpha('#ffffff', 0.82),
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid',
          borderColor: 'rgba(216,27,96,0.10)',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <RestaurantMenuIcon sx={{ color: 'primary.main', fontSize: 26 }} />
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{
                background: 'linear-gradient(135deg, #d81b60 20%, #f06292 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}
            >
              Sabores Angelicales
            </Typography>
          </Box>
          <IconButton
            color="primary"
            onClick={() => setIsCartOpen(true)}
            sx={{
              bgcolor: totalItems > 0 ? 'rgba(216,27,96,0.08)' : 'transparent',
              border: totalItems > 0 ? '1.5px solid rgba(216,27,96,0.2)' : '1.5px solid transparent',
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: 'rgba(216,27,96,0.12)' },
            }}
          >
            <Badge badgeContent={totalItems} color="secondary" max={99}>
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* ─── MAIN ─────────────────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 10, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            fontWeight={800}
            sx={{ color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}
          >
            {isLoadingMenus
              ? 'Cargando menú…'
              : selectedMenu
                ? `Menú del ${selectedMenu.date}`
                : 'Menú diario'}
          </Typography>
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: 99,
              background: 'linear-gradient(90deg, #d81b60, #f06292)',
              mb: 2,
            }}
          />

          {!isLoadingMenus && menusForNavigation.length > 1 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <IconButton
                disabled={!canGoBack}
                onClick={() => setSelectedMenuIndex((p) => Math.max(0, p - 1))}
                size="small"
                sx={{
                  bgcolor: canGoBack ? 'rgba(216,27,96,0.08)' : 'transparent',
                  border: '1px solid',
                  borderColor: canGoBack ? 'rgba(216,27,96,0.2)' : 'divider',
                }}
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                {menusForNavigation.map((menu, idx) => (
                  <Box
                    key={menu.date}
                    onClick={() => setSelectedMenuIndex(idx)}
                    sx={{
                      px: 2,
                      py: 0.6,
                      borderRadius: 99,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      transition: 'all 0.18s ease',
                      ...(idx === selectedMenuIndex
                        ? {
                            bgcolor: 'primary.main',
                            color: 'white',
                            boxShadow: '0 3px 10px rgba(216,27,96,0.3)',
                          }
                        : {
                            bgcolor: 'rgba(216,27,96,0.07)',
                            color: 'primary.dark',
                            '&:hover': { bgcolor: 'rgba(216,27,96,0.14)' },
                          }),
                    }}
                  >
                    {menu.date}
                  </Box>
                ))}
              </Box>
              <IconButton
                disabled={!canGoForward}
                onClick={() =>
                  setSelectedMenuIndex((p) => Math.min(menusForNavigation.length - 1, p + 1))
                }
                size="small"
                sx={{
                  bgcolor: canGoForward ? 'rgba(216,27,96,0.08)' : 'transparent',
                  border: '1px solid',
                  borderColor: canGoForward ? 'rgba(216,27,96,0.2)' : 'divider',
                }}
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>
              {selectedMenuIndex !== 0 && (
                <Button
                  size="small"
                  startIcon={<TodayIcon sx={{ fontSize: 14 }} />}
                  onClick={() => setSelectedMenuIndex(0)}
                  sx={{
                    borderRadius: 99,
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.78rem',
                    color: 'text.secondary',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  Hoy
                </Button>
              )}
            </Box>
          )}
        </Box>

        {isLoadingMenus && <MenuLoadingScreen />}

        {!isLoadingMenus && menuLoadError && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="error" fontWeight={600}>
              {menuLoadError}
            </Typography>
          </Box>
        )}

        {!isLoadingMenus && !menuLoadError && selectedMenu && (
          <Grid container spacing={3} justifyContent="center">
            {selectedMenu.dishes.map((dish) => (
              <Grid key={dish.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <DishCard
                  dish={dish}
                  dailyIncludes={selectedMenu.includes}
                  onAddToCart={handleAddToCart}
                  remainingSharedStock={getRemainingDishStock(cartItems, dish)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* ─── CARRITO ──────────────────────────────────────────────────────────── */}
      {isMobile ? (
        <Dialog
          open={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          fullWidth
          maxWidth="sm"
          slotProps={{
            paper: { sx: { borderRadius: 4, m: 2, maxHeight: '90vh' } },
          }}
        >
          <CartPanel
            cartItems={cartItems}
            totalItems={totalItems}
            totalPrice={totalPrice}
            isMobile={isMobile}
            onClose={() => setIsCartOpen(false)}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemoveFromCart}
            onConfirmOrder={handleConfirmOrder}
          />
        </Dialog>
      ) : (
        <Drawer anchor="right" open={isCartOpen} onClose={() => setIsCartOpen(false)}>
          <CartPanel
            cartItems={cartItems}
            totalItems={totalItems}
            totalPrice={totalPrice}
            isMobile={isMobile}
            onClose={() => setIsCartOpen(false)}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemoveFromCart}
            onConfirmOrder={handleConfirmOrder}
          />
        </Drawer>
      )}

      {/* ─── DIALOG CONFIRMACIÓN PEDIDO ───────────────────────────────────────── */}
      {selectedMenu && (
        <OrderConfirmDialog
          open={isOrderDialogOpen}
          menu={selectedMenu}
          cartItems={cartItems}
          totalPrice={totalPrice}
          onClose={() => setIsOrderDialogOpen(false)}
          onSubmit={handleSubmitOrder}
        />
      )}
    </ThemeProvider>
  );
}
