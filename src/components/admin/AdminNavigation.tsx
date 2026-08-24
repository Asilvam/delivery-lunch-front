import {
  AppBar,
  Box,
  Button,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AssignmentIcon from "@mui/icons-material/Assignment";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import BarChartIcon from "@mui/icons-material/BarChart";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import LogoutIcon from "@mui/icons-material/Logout";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const routes = [
  { label: "Pedidos", path: "/admin", icon: <AssignmentIcon /> },
  { label: "Menús", path: "/admin/menus", icon: <RestaurantMenuIcon /> },
  { label: "Métricas", path: "/dashboard", icon: <BarChartIcon /> },
  { label: "Cocina", path: "/cocina", icon: <RestaurantIcon /> },
];

export default function AdminNavigation() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const activePath = routes.find((route) => route.path === pathname)?.path ?? false;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        bgcolor: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid",
        borderColor: "rgba(216,27,96,0.12)",
      }}
    >
      <Toolbar sx={{ minHeight: 58 }}>
        <AdminPanelSettingsIcon sx={{ mr: 1, color: "primary.main" }} />
        <Typography variant="h6" fontWeight={800} flexGrow={1} noWrap>
          Administración
        </Typography>
        <Button
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          color="inherit"
          size="small"
          sx={{ minWidth: { xs: 40, sm: "auto" } }}
        >
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            Salir
          </Box>
        </Button>
      </Toolbar>
      <Tabs
        value={activePath}
        onChange={(_, value: string) => navigate(value)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label="Navegación administrativa"
        sx={{ px: { xs: 1, sm: 2 }, minHeight: 46 }}
      >
        {routes.map((route) => (
          <Tab
            key={route.path}
            value={route.path}
            label={route.label}
            icon={route.icon}
            iconPosition="start"
            sx={{ minHeight: 46, textTransform: "none", fontWeight: 700 }}
          />
        ))}
      </Tabs>
    </AppBar>
  );
}
