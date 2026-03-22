// src/App.tsx
import { useEffect, useState } from 'react';
import {
  Container, CssBaseline, ThemeProvider, createTheme, Typography, Box, Grid,
  AppBar, Toolbar, IconButton, Badge, Drawer, Dialog, List, ListItem, Divider, Button, useMediaQuery, Tooltip
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete'; // NUEVO: Ícono del basurero
import Swal from 'sweetalert2';
import { DishCard } from './components/DishCard';
import { fetchDailyMenusMock, getMenuDateTimestamp } from './api/menuMocks';
import type { DailyMenu, Dish } from './types/menu';

const userToast = Swal.mixin({
  toast: true,
  position: 'center',
  showConfirmButton: false,
  timer: 2800,
  timerProgressBar: true,
});

// 1. TEMA ANGELICAL (Se mantiene igual)
const angelicalTheme = createTheme({
  palette: {
    primary: { main: '#d81b60', light: '#ff5c8d', dark: '#a00037', contrastText: '#fff' },
    secondary: { main: '#f48fb1', light: '#ffbef2', dark: '#bf5f82', contrastText: '#000' },
    background: { default: '#fff1f3', paper: '#ffffff' },
  },
  typography: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', h3: { fontWeight: 700 } },
});

interface CartItem {
  dish: Dish;
  quantity: number;
}

function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [menus, setMenus] = useState<DailyMenu[]>([]);
  const [isLoadingMenus, setIsLoadingMenus] = useState(true);
  const [menuLoadError, setMenuLoadError] = useState<string | null>(null);
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
  const isMobile = useMediaQuery(angelicalTheme.breakpoints.down('sm'));

  useEffect(() => {
    let mounted = true;

    const loadMenus = async () => {
      try {
        setIsLoadingMenus(true);
        console.info('[App] Cargando menus diarios desde mock backend...');
        void userToast.fire({
          icon: 'info',
          title: 'Cargando menus diarios...',
          timer: 1200,
        });

        const data = await fetchDailyMenusMock();
        if (!mounted) return;

        setMenus(data);
        setMenuLoadError(null);
        setSelectedMenuIndex(0);
        console.info(`[App] Menus diarios cargados: ${data.length}`);

        if (data.length === 0) {
          console.warn('[App] El backend no devolvio menus disponibles.');
          void userToast.fire({
            icon: 'info',
            title: 'Sin menus disponibles para hoy o fechas siguientes.',
          });
        }
      } catch (error) {
        if (!mounted) return;
        setMenuLoadError('No se pudieron cargar los menus diarios.');
        setMenus([]);
        console.error('[App] Error cargando menus mock:', error);
        void userToast.fire({
          icon: 'error',
          title: 'Error al cargar menus diarios. Intenta nuevamente.',
        });
      } finally {
        if (mounted) {
          setIsLoadingMenus(false);
        }
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
    const timestamp = getMenuDateTimestamp(menu.date);
    return timestamp !== null && timestamp >= todayTimestamp;
  });

  const menusForNavigation = availableMenus.length > 0 ? availableMenus : menus;
  const selectedMenu = menusForNavigation[selectedMenuIndex] ?? menusForNavigation[0];

  const canGoBack = selectedMenuIndex > 0;
  const canGoForward = selectedMenuIndex < menusForNavigation.length - 1;

  // MODIFICADO: Ya no abre el carrito automáticamente al agregar
  const handleAddToCart = (dishToAdd: Dish) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.dish.id === dishToAdd.id);
      if (existingItem) {
        return prevItems.map(item =>
            item.dish.id === dishToAdd.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { dish: dishToAdd, quantity: 1 }];
    });
    // Se eliminó: setIsCartOpen(true);
  };

  // MODIFICADO: Ya no elimina si la cantidad es cero
  const handleUpdateQuantity = (dishId: string, delta: number) => {
    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (item.dish.id === dishId) {
          // Prevenimos que la cantidad baje de 1 usando Math.max(1, ...)
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      // Se eliminó: .filter(item => item.quantity > 0);
    });
  };

  // NUEVO: Función para eliminar el plato al presionar el basurero
  const handleRemoveFromCart = (dishId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.dish.id !== dishId));
  };

  const triggerCompletionFeedback = () => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([120, 60, 120]);
      }

      const AudioContextConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) {
        return;
      }

      const audioContext = new AudioContextConstructor();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.03;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.12);
      oscillator.onended = () => {
        void audioContext.close();
      };
    } catch (error) {
      console.warn('[App] No fue posible reproducir feedback de exito:', error);
    }
  };

  const handleConfirmOrder = async () => {
    if (cartItems.length === 0) {
      void userToast.fire({
        icon: 'info',
        title: 'No hay platos en el carrito.',
      });
      return;
    }

    // Cerramos el carrito antes de iniciar la transferencia para evitar superposicion de modales.
    setIsCartOpen(false);

    let progress = 0;
    let intervalId: number | undefined;

    await Swal.fire({
      title: 'Transfiriendo dinero',
      html: `
        <div style="margin-bottom: 10px;">
          Transfiriendo dinero a Ricardo Olguin cuenta rut del Tortuga.
        </div>
        <div style="width: 100%; height: 12px; background: #f3c6d8; border-radius: 999px; overflow: hidden; margin-bottom: 8px;">
          <div id="transfer-progress-bar" style="width: 0%; height: 100%; background: #d81b60; transition: width 40ms linear;"></div>
        </div>
        <strong id="transfer-progress">0%</strong>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
        intervalId = window.setInterval(() => {
          progress = Math.min(progress + 1, 100);
          const progressNode = Swal.getHtmlContainer()?.querySelector('#transfer-progress');
          const progressBarNode = Swal.getHtmlContainer()?.querySelector('#transfer-progress-bar') as HTMLElement | null;
          if (progressNode) {
            progressNode.textContent = `${progress}%`;
          }
          if (progressBarNode) {
            progressBarNode.style.width = `${progress}%`;
          }

          if (progress >= 100) {
            window.clearInterval(intervalId);
            Swal.close();
          }
        }, 40);
      },
      willClose: () => {
        if (intervalId) {
          window.clearInterval(intervalId);
        }
      },
    });

    const successResult = await Swal.fire({
      icon: 'success',
      title: 'Dineros transferidos con exito!',
      confirmButtonText: 'Ok',
    });

    if (successResult.isConfirmed) {
      triggerCompletionFeedback();
      setCartItems([]);
    }
  };

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + (item.dish.price * item.quantity), 0);

  // INTERFAZ DEL CARRITO (Actualizada con el Basurero)
  const cartContent = (
      <Box sx={{ width: isMobile ? '100%' : 400, p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', height: '100%', maxHeight: isMobile ? '80vh' : '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold" color="primary.dark">
            Tu Pedido
          </Typography>
          <IconButton onClick={() => setIsCartOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />

        <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {cartItems.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
                Aún no has agregado platos.
              </Typography>
          ) : (
              cartItems.map((item) => (
                  <ListItem key={item.dish.id} sx={{ px: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography fontWeight="medium" sx={{ pr: 2 }}>{item.dish.name}</Typography>
                      <Typography fontWeight="bold" color="primary.main">
                        ${(item.dish.price * item.quantity).toLocaleString('es-CL')}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      {/* Controles de cantidad */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'secondary.light', borderRadius: 2, p: 0.5 }}>
                        <IconButton size="small" onClick={() => handleUpdateQuantity(item.dish.id, -1)} color="primary">
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography fontWeight="bold" sx={{ minWidth: 20, textAlign: 'center' }}>
                          {item.quantity}
                        </Typography>
                        <IconButton size="small" onClick={() => handleUpdateQuantity(item.dish.id, 1)} color="primary">
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      {/* NUEVO: Botón del Basurero para eliminar el plato */}
                      <Tooltip title="Eliminar plato">
                        <IconButton onClick={() => handleRemoveFromCart(item.dish.id)} color="error" sx={{ color: 'primary.dark' }}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Divider sx={{ mt: 2, width: '100%' }} />
                  </ListItem>
              ))
          )}
        </List>

        {cartItems.length > 0 && (
            <Box sx={{ mt: 2, pt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">Total</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  ${totalPrice.toLocaleString('es-CL')}
                </Typography>
              </Box>
              <Button variant="contained" color="primary" fullWidth size="large" onClick={() => void handleConfirmOrder()} sx={{ borderRadius: 2, fontWeight: 'bold' }}>
                Confirmar Pedido
              </Button>
            </Box>
        )}
      </Box>
  );

  return (
      <ThemeProvider theme={angelicalTheme}>
        <CssBaseline />

        <AppBar position="sticky" color="inherit" elevation={1} sx={{ bgcolor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)' }}>
          <Toolbar>
            <Typography variant="h6" color="primary.main" fontWeight="bold" sx={{ flexGrow: 1 }}>
              Sabores Angelicales
            </Typography>
            <IconButton color="primary" onClick={() => setIsCartOpen(true)}>
              <Badge badgeContent={totalItems} color="secondary">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              Menu diario ({selectedMenu?.date ?? 'Sin fecha'})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1.5 }}>
              <Button variant="text" disabled={!canGoBack} onClick={() => setSelectedMenuIndex((prev) => Math.max(0, prev - 1))}>
                Anterior
              </Button>
              <Button variant="text" disabled={!canGoForward} onClick={() => setSelectedMenuIndex((prev) => Math.min(menusForNavigation.length - 1, prev + 1))}>
                Siguiente
              </Button>
              <Button
                variant="outlined"
                disabled={selectedMenuIndex === 0}
                onClick={() => setSelectedMenuIndex(0)}
              >
                Volver a hoy
              </Button>
            </Box>
          </Box>


          {!isLoadingMenus && !menuLoadError && selectedMenu && (
            <Grid container spacing={4} justifyContent="center">
              {selectedMenu.dishes.map((dish) => (
                  <Grid key={dish.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <DishCard dish={dish} dailyIncludes={selectedMenu.includes} onAddToCart={handleAddToCart} />
                  </Grid>
              ))}
            </Grid>
          )}
        </Container>

        {/* Renderizado condicional del Carrito según el dispositivo */}
        {isMobile ? (
            <Dialog
              open={isCartOpen}
              onClose={() => setIsCartOpen(false)}
              fullWidth
              maxWidth="sm"
              slotProps={{ paper: { sx: { borderRadius: 3, m: 2 } } }}
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