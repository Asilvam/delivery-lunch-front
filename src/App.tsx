// src/App.tsx
import { useState } from 'react';
import {
  Container, CssBaseline, ThemeProvider, createTheme, Typography, Box, Grid,
  AppBar, Toolbar, IconButton, Badge, Drawer, Dialog, List, ListItem, Divider, Button, useMediaQuery, Tooltip
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete'; // NUEVO: Ícono del basurero
import { DishCard } from './components/DishCard';
import type { DailyMenu, Dish } from './types/menu';

// 1. TEMA ANGELICAL (Se mantiene igual)
const angelicalTheme = createTheme({
  palette: {
    primary: { main: '#d81b60', light: '#ff5c8d', dark: '#a00037', contrastText: '#fff' },
    secondary: { main: '#f48fb1', light: '#ffbef2', dark: '#bf5f82', contrastText: '#000' },
    background: { default: '#fff1f3', paper: '#ffffff' },
  },
  typography: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', h3: { fontWeight: 700 } },
});

// 2. DATOS DE PRUEBA (Se mantienen igual)
const mockMenuToday: DailyMenu = {
  date: '10/02/26',
  includes: { salad: 'Tomate con cebolla', bread: 'Pan amasado', dessert: 'Leche asada' },
  dishes: [
    { id: '1', name: 'Pollo krispy con arroz y papas fritas', price: 5500, imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?q=80&w=400&auto=format&fit=crop' },
    { id: '2', name: 'Cazuela de vacuno', price: 5500, imageUrl: 'https://images.unsplash.com/photo-1512132411229-c30391241dd8?q=80&w=400&auto=format&fit=crop' },
    { id: '3', name: 'Pulpa asada con arroz y papas fritas', price: 5500 },
    { id: '4', name: 'Pulpa asada con puré', price: 5500 },
    { id: '5', name: 'Pulpa asada con fideos', price: 5500 },
    { id: '6', name: 'Hipo', price: 5500, options: ['Pollo asado', 'Pulpa asada', 'Atún'], imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=400&auto=format&fit=crop' },
  ]
};

interface CartItem {
  dish: Dish;
  quantity: number;
}

function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const isMobile = useMediaQuery(angelicalTheme.breakpoints.down('sm'));

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
              <Button variant="contained" color="primary" fullWidth size="large" sx={{ borderRadius: 2, fontWeight: 'bold' }}>
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
              Menú del Día ({mockMenuToday.date})
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            {mockMenuToday.dishes.map((dish) => (
                <Grid item key={dish.id} xs={12} sm={6} md={4}>
                  <DishCard dish={dish} dailyIncludes={mockMenuToday.includes} onAddToCart={handleAddToCart} />
                </Grid>
            ))}
          </Grid>
        </Container>

        {/* Renderizado condicional del Carrito según el dispositivo */}
        {isMobile ? (
            <Dialog open={isCartOpen} onClose={() => setIsCartOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3, m: 2 } }}>
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