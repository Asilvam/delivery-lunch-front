// src/App.tsx
import { useEffect, useState } from 'react';
import {
  Container, CssBaseline, ThemeProvider, createTheme, Typography, Box, Grid,
  AppBar, Toolbar, IconButton, Badge, Drawer, Dialog, List, ListItem, Divider,
  Button, useMediaQuery, Tooltip, Skeleton, alpha,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import Swal from 'sweetalert2';
import { DishCard } from './components/DishCard';
import { fetchDailyMenusMock, getMenuDateTimestamp } from './api/menuMocks';
import type { DailyMenu, Dish, DishSelectionVisibility, DishSelections } from './types/menu';

const userToast = Swal.mixin({
  toast: true,
  position: 'center',
  showConfirmButton: false,
  timer: 2800,
  timerProgressBar: true,
});

// ─── TEMA MODERNO ─────────────────────────────────────────────────────────────
const modernTheme = createTheme({
  palette: {
    primary: { main: '#d81b60', light: '#f06292', dark: '#9c0f45', contrastText: '#fff' },
    secondary: { main: '#f48fb1', light: '#fce4ec', dark: '#bf5f82', contrastText: '#000' },
    background: { default: '#fdf2f8', paper: '#ffffff' },
    text: { primary: '#1a0a2e', secondary: '#6b5b73' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: { fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700 },
    body1: { fontSize: '0.95rem' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 500 } },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRadius: '20px 0 0 20px' },
      },
    },
  },
});

interface CartItem {
  key: string;
  dish: Dish;
  quantity: number;
  selections: DishSelections;
  visibility: DishSelectionVisibility;
}

const buildCartItemKey = (dishId: string, selections: DishSelections) => {
  return `${dishId}::${selections.protein ?? ''}::${selections.salad ?? ''}::${selections.dessert}`;
};

const getDishQuantityInCart = (items: CartItem[], dishId: string) => {
  return items
    .filter((item) => item.dish.id === dishId)
    .reduce((total, item) => total + item.quantity, 0);
};

const showAddToCartFeedback = async (dishName: string, nextQuantity: number, wasExisting: boolean) => {
  await userToast.fire({
    icon: 'success',
    title: wasExisting
      ? `${dishName} ahora tiene ${nextQuantity} ${nextQuantity === 1 ? 'unidad' : 'unidades'}`
      : `${dishName} fue agregado al pedido`,
    timer: 1600,
  });
};

const showStockLimitFeedback = async (dishName: string, isSoldOut: boolean, stock?: number) => {
  await userToast.fire({
    icon: isSoldOut ? 'error' : 'warning',
    title: isSoldOut
      ? `${dishName} está agotado`
      : `Solo quedan ${stock ?? 0} ${stock === 1 ? 'plato disponible' : 'platos disponibles'} de ${dishName}`,
    timer: 1800,
  });
};

function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [menus, setMenus] = useState<DailyMenu[]>([]);
  const [isLoadingMenus, setIsLoadingMenus] = useState(true);
  const [menuLoadError, setMenuLoadError] = useState<string | null>(null);
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
  const isMobile = useMediaQuery(modernTheme.breakpoints.down('sm'));

  useEffect(() => {
    let mounted = true;
    const loadMenus = async () => {
      try {
        setIsLoadingMenus(true);
        void userToast.fire({ icon: 'info', title: 'Cargando menús…', timer: 1200 });
        const data = await fetchDailyMenusMock();
        if (!mounted) return;
        setMenus(data);
        setMenuLoadError(null);
        setSelectedMenuIndex(0);
        if (data.length === 0) {
          void userToast.fire({ icon: 'info', title: 'Sin menús disponibles para hoy.' });
        }
      } catch {
        if (!mounted) return;
        setMenuLoadError('No se pudieron cargar los menús diarios.');
        setMenus([]);
        void userToast.fire({ icon: 'error', title: 'Error al cargar menús. Intenta nuevamente.' });
      } finally {
        if (mounted) setIsLoadingMenus(false);
      }
    };
    void loadMenus();
    return () => { mounted = false; Swal.close(); };
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
    const stock = dishToAdd.stock;
    const totalDishQuantity = getDishQuantityInCart(cartItems, dishToAdd.id);

    if (stock === 0) {
      void showStockLimitFeedback(dishToAdd.name, true, stock);
      return;
    }

    if (typeof stock === 'number' && totalDishQuantity >= stock) {
      void showStockLimitFeedback(dishToAdd.name, false, stock);
      return;
    }

    const existing = cartItems.find((item) => item.key === cartItemKey);
    const nextQuantity = existing ? existing.quantity + 1 : 1;
    const nextItems = existing
      ? cartItems.map((item) => item.key === cartItemKey ? { ...item, quantity: item.quantity + 1 } : item)
      : [...cartItems, {
        key: cartItemKey,
        dish: dishToAdd,
        quantity: 1,
        selections,
        visibility,
      }];

    setCartItems(nextItems);

    void showAddToCartFeedback(dishToAdd.name, nextQuantity, Boolean(existing));
  };

  const handleUpdateQuantity = (cartItemKey: string, delta: number) => {
    const targetItem = cartItems.find((item) => item.key === cartItemKey);
    if (!targetItem) {
      return;
    }

    if (delta > 0 && typeof targetItem.dish.stock === 'number') {
      const totalDishQuantity = getDishQuantityInCart(cartItems, targetItem.dish.id);
      if (totalDishQuantity >= targetItem.dish.stock) {
        void showStockLimitFeedback(targetItem.dish.name, targetItem.dish.stock === 0, targetItem.dish.stock);
        return;
      }
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.key === cartItemKey ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const handleRemoveFromCart = (cartItemKey: string) => {
    setCartItems((prev) => prev.filter((item) => item.key !== cartItemKey));
  };

  const triggerCompletionFeedback = () => {
    try {
      if ('vibrate' in navigator) navigator.vibrate([120, 60, 120]);
      const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = 880; gain.gain.value = 0.03;
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.12);
      osc.onended = () => { void ctx.close(); };
    } catch { /* noop */ }
  };

  const handleConfirmOrder = async () => {
    if (cartItems.length === 0) {
      void userToast.fire({ icon: 'info', title: 'No hay platos en el carrito.' });
      return;
    }
    setIsCartOpen(false);
    let progress = 0;
    let intervalId: number | undefined;
    await Swal.fire({
      title: 'Transfiriendo dinero',
      html: `
        <div style="margin-bottom:10px;">Transfiriendo a Ricardo Olguín — cuenta rut del Tortuga.</div>
        <div style="width:100%;height:10px;background:#fce4ec;border-radius:999px;overflow:hidden;margin-bottom:8px;">
          <div id="pb" style="width:0%;height:100%;background:linear-gradient(90deg,#d81b60,#f06292);transition:width 40ms linear;"></div>
        </div>
        <strong id="pct">0%</strong>`,
      allowOutsideClick: false, allowEscapeKey: false, showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
        intervalId = window.setInterval(() => {
          progress = Math.min(progress + 1, 100);
          const pct = Swal.getHtmlContainer()?.querySelector('#pct');
          const pb = Swal.getHtmlContainer()?.querySelector('#pb') as HTMLElement | null;
          if (pct) pct.textContent = `${progress}%`;
          if (pb) pb.style.width = `${progress}%`;
          if (progress >= 100) { window.clearInterval(intervalId); Swal.close(); }
        }, 40);
      },
      willClose: () => { if (intervalId) window.clearInterval(intervalId); },
    });
    const result = await Swal.fire({ icon: 'success', title: '¡Dineros transferidos con éxito!', confirmButtonText: 'Ok' });
    if (result.isConfirmed) { triggerCompletionFeedback(); setCartItems([]); }
  };

  const totalItems = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const totalPrice = cartItems.reduce((acc, i) => acc + i.dish.price * i.quantity, 0);

  // ─── CARRITO ────────────────────────────────────────────────────────────────
  const cartContent = (
    <Box sx={{ width: isMobile ? '100%' : 400, display: 'flex', flexDirection: 'column', height: '100%', maxHeight: isMobile ? '85vh' : '100%' }}>
      {/* Header */}
      <Box sx={{ p: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'secondary.light' }}>
        <Box>
          <Typography variant="h6" fontWeight={800} color="primary.dark">Tu Pedido</Typography>
          {totalItems > 0 && (
            <Typography variant="caption" color="text.secondary">{totalItems} {totalItems === 1 ? 'plato' : 'platos'}</Typography>
          )}
        </Box>
        <IconButton onClick={() => setIsCartOpen(false)} sx={{ bgcolor: 'secondary.light', '&:hover': { bgcolor: 'secondary.main' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Items */}
      <List sx={{ flexGrow: 1, overflowY: 'auto', px: 2, py: 1 }}>
        {cartItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <RestaurantMenuIcon sx={{ fontSize: 56, color: 'secondary.main', mb: 1 }} />
            <Typography color="text.secondary" fontWeight={500}>Aún no has agregado platos.</Typography>
            <Typography variant="caption" color="text.secondary">Explora el menú y agrega tus favoritos</Typography>
          </Box>
        ) : (
          cartItems.map((item) => {
            const totalDishQuantity = getDishQuantityInCart(cartItems, item.dish.id);
            const stockLimit = item.dish.stock;
            const hasStockLimit = typeof stockLimit === 'number';
            const isAtStockLimit = hasStockLimit && totalDishQuantity >= stockLimit;

            return (
              <ListItem key={item.key} disablePadding sx={{ py: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ pr: 1, flex: 1 }}>
                    <Typography fontWeight={600} sx={{ fontSize: '0.9rem', color: 'text.primary' }}>
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
                  <Typography fontWeight={800} color="primary.main" sx={{ whiteSpace: 'nowrap', fontSize: '0.95rem' }}>
                    ${(item.dish.price * item.quantity).toLocaleString('es-CL')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'secondary.light', borderRadius: 99, px: 0.5, py: 0.3 }}>
                    <IconButton size="small" onClick={() => handleUpdateQuantity(item.key, -1)} color="primary" sx={{ p: 0.4 }}>
                      <RemoveIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <Typography fontWeight={700} sx={{ minWidth: 22, textAlign: 'center', fontSize: '0.9rem' }}>
                      {item.quantity}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleUpdateQuantity(item.key, 1)}
                      color="primary"
                      disabled={Boolean(hasStockLimit && isAtStockLimit)}
                      sx={{ p: 0.4 }}
                    >
                      <AddIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                  <Tooltip title="Eliminar plato">
                    <IconButton onClick={() => handleRemoveFromCart(item.key)} size="small"
                      sx={{ color: 'error.main', bgcolor: 'rgba(211,47,47,0.06)', '&:hover': { bgcolor: 'rgba(211,47,47,0.14)' } }}>
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
        <Box sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'secondary.light', bgcolor: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography fontWeight={600} color="text.secondary" fontSize="0.9rem">Total</Typography>
            <Typography variant="h5" fontWeight={800} color="primary.main">
              ${totalPrice.toLocaleString('es-CL')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => void handleConfirmOrder()}
            sx={{
              py: 1.5,
              borderRadius: 3,
              fontWeight: 700,
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #d81b60 0%, #f06292 100%)',
              boxShadow: '0 6px 20px rgba(216,27,96,0.32)',
              '&:hover': { background: 'linear-gradient(135deg, #9c0f45 0%, #d81b60 100%)', boxShadow: '0 8px 24px rgba(216,27,96,0.42)' },
            }}
          >
            Confirmar Pedido
          </Button>
        </Box>
      )}
    </Box>
  );

  return (
    <ThemeProvider theme={modernTheme}>
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

        {/* Section header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            fontWeight={800}
            sx={{ color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}
          >
            {isLoadingMenus ? 'Cargando menú…' : selectedMenu ? `Menú del ${selectedMenu.date}` : 'Menú diario'}
          </Typography>
          <Box sx={{ width: 40, height: 4, borderRadius: 99, background: 'linear-gradient(90deg, #d81b60, #f06292)', mb: 2 }} />

          {/* Date navigation */}
          {!isLoadingMenus && menusForNavigation.length > 1 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <IconButton
                disabled={!canGoBack}
                onClick={() => setSelectedMenuIndex((p) => Math.max(0, p - 1))}
                size="small"
                sx={{ bgcolor: canGoBack ? 'rgba(216,27,96,0.08)' : 'transparent', border: '1px solid', borderColor: canGoBack ? 'rgba(216,27,96,0.2)' : 'divider' }}
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>

              <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                {menusForNavigation.map((menu, idx) => (
                  <Box
                    key={menu.date}
                    onClick={() => setSelectedMenuIndex(idx)}
                    sx={{
                      px: 2, py: 0.6, borderRadius: 99, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                      transition: 'all 0.18s ease',
                      ...(idx === selectedMenuIndex
                        ? { bgcolor: 'primary.main', color: 'white', boxShadow: '0 3px 10px rgba(216,27,96,0.3)' }
                        : { bgcolor: 'rgba(216,27,96,0.07)', color: 'primary.dark', '&:hover': { bgcolor: 'rgba(216,27,96,0.14)' } }
                      ),
                    }}
                  >
                    {menu.date}
                  </Box>
                ))}
              </Box>

              <IconButton
                disabled={!canGoForward}
                onClick={() => setSelectedMenuIndex((p) => Math.min(menusForNavigation.length - 1, p + 1))}
                size="small"
                sx={{ bgcolor: canGoForward ? 'rgba(216,27,96,0.08)' : 'transparent', border: '1px solid', borderColor: canGoForward ? 'rgba(216,27,96,0.2)' : 'divider' }}
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>

              {selectedMenuIndex !== 0 && (
                <Button
                  size="small"
                  startIcon={<TodayIcon sx={{ fontSize: 14 }} />}
                  onClick={() => setSelectedMenuIndex(0)}
                  sx={{ borderRadius: 99, px: 1.5, py: 0.5, fontSize: '0.78rem', color: 'text.secondary', border: '1px solid', borderColor: 'divider' }}
                >
                  Hoy
                </Button>
              )}
            </Box>
          )}
        </Box>

        {/* Loading skeletons */}
        {isLoadingMenus && (
          <Grid container spacing={3} justifyContent="center">
            {[1, 2, 3].map((n) => (
              <Grid key={n} size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 2px 16px rgba(216,27,96,0.08)' }}>
                  <Skeleton variant="rectangular" height={200} />
                  <Box sx={{ p: 2.5 }}>
                    <Skeleton variant="text" width="70%" height={28} />
                    <Skeleton variant="text" width="100%" height={20} sx={{ mt: 1 }} />
                    <Skeleton variant="text" width="60%" height={20} />
                    <Skeleton variant="rectangular" height={44} sx={{ mt: 2, borderRadius: 2 }} />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Error state */}
        {!isLoadingMenus && menuLoadError && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="error" fontWeight={600}>{menuLoadError}</Typography>
          </Box>
        )}

        {/* Dish grid */}
        {!isLoadingMenus && !menuLoadError && selectedMenu && (
          <Grid container spacing={3} justifyContent="center">
            {selectedMenu.dishes.map((dish) => (
              <Grid key={dish.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <DishCard dish={dish} dailyIncludes={selectedMenu.includes} onAddToCart={handleAddToCart} />
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
          slotProps={{ paper: { sx: { borderRadius: 4, m: 2, maxHeight: '90vh' } } }}
        >
          {cartContent}
        </Dialog>
      ) : (
        <Drawer anchor="right" open={isCartOpen} onClose={() => setIsCartOpen(false)}>
          {cartContent}
        </Drawer>
      )}
    </ThemeProvider>
  );
}

export default App;

