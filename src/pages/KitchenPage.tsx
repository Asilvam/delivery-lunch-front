// src/pages/KitchenPage.tsx
import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useKitchenOrdersStream } from "../hooks/useKitchenOrdersStream";
import { updateOrderStatus } from "../data/services/kitchenApi.service";
import KitchenOrdersPanel from "../components/kitchen/KitchenOrdersPanel";
import type { OrderStatus } from "../types/order";

export default function KitchenPage() {
  const { token, logout, role } = useAuth();
  const navigate = useNavigate();
  const { orders, updateOrder, connected, error } =
    useKitchenOrdersStream(token);

  const handleStatusChange = async (id: string, estado: OrderStatus) => {
    if (!token) return;
    const updated = await updateOrderStatus(token, id, estado);
    updateOrder(updated);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <RestaurantIcon sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h6" fontWeight={700} flexGrow={1}>
            Panel Cocina
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Button
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              color="inherit"
              size="small"
              sx={{ fontWeight: 600 }}
            >
              Salir
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ mt: 4, mb: 8 }}>
        <Typography variant="h5" fontWeight={800} mb={1}>
          Comandas
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Pedidos aprobados listos para preparar.
        </Typography>

        <KitchenOrdersPanel
          orders={orders}
          connected={connected}
          error={error}
          onStatusChange={handleStatusChange}
          isAdmin={role === "admin"}
        />
      </Container>
    </>
  );
}
