import { BrandHeader } from "../layout/PageLayout";
import {
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Paper,
  useMediaQuery,
} from "@mui/material";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import RestaurantOutlinedIcon from "@mui/icons-material/RestaurantOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { usePendingOrders } from "../../hooks/usePendingOrders";
import { appTheme } from "../../theme/appTheme";
import { OrderStatus } from "../../types/order";

const ADMIN_LINKS = [
  { to: "/admin", label: "Pedidos", icon: ShoppingCartOutlinedIcon },
  { to: "/cocina", label: "Cocina", icon: RestaurantOutlinedIcon },
  { to: "/admin/menus", label: "Menús", icon: MenuBookOutlinedIcon },
  { to: "/admin/clientes", label: "Clientes", icon: PeopleOutlineIcon },
  { to: "/dashboard", label: "Métricas", icon: BarChartOutlinedIcon },
];

export default function StaffNavigation() {
  const { role, logout } = useAuth();
  const { orders, connected, error } = usePendingOrders();
  const { pathname } = useLocation();
  const mobile =
    useMediaQuery(appTheme.breakpoints.down("sm")) && role === "admin";
  const count =
    connected && !error
      ? orders.filter(
          (order) =>
            !order.validadoPorAdmin && order.estado === OrderStatus.PENDIENTE,
        ).length
      : 0;
  const links =
    role === "admin"
      ? ADMIN_LINKS
      : ADMIN_LINKS.filter((link) => link.to === "/cocina");
  const accessibleLabel = (label: string) =>
    label === "Pedidos" && count > 0
      ? `Pedidos, ${count} ${count === 1 ? "pendiente" : "pendientes"} de aprobación`
      : label;
  return (
    <>
      <BrandHeader
        right={
          <Button onClick={logout} color="inherit" size="small">
            Cerrar sesión
          </Button>
        }
        navigation={
          mobile ? undefined : (
            <Box
              component="nav"
              aria-label="Navegación del personal"
              sx={{ display: "flex", gap: 1, overflowX: "auto" }}
            >
              {links.map(({ to, label }) => (
                <Button
                  key={to}
                  component={NavLink}
                  to={to}
                  end
                  aria-label={accessibleLabel(label)}
                  variant={pathname === to ? "contained" : "text"}
                  sx={{ flexShrink: 0 }}
                >
                  {label}
                  {label === "Pedidos" && count > 0 && (
                    <Box
                      component="span"
                      aria-hidden="true"
                      sx={{
                        ml: 1,
                        minWidth: 20,
                        height: 20,
                        px: 0.5,
                        borderRadius: 10,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: ".7rem",
                        fontWeight: 800,
                        bgcolor:
                          pathname === to ? "background.paper" : "primary.main",
                        color:
                          pathname === to
                            ? "primary.main"
                            : "primary.contrastText",
                      }}
                    >
                      {count > 99 ? "99+" : count}
                    </Box>
                  )}
                </Button>
              ))}
            </Box>
          )
        }
      />
      {mobile && (
        <Paper
          component="nav"
          aria-label="Navegación móvil del personal"
          elevation={4}
          square
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: appTheme.zIndex.appBar,
            pb: "env(safe-area-inset-bottom, 0px)",
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <BottomNavigation value={pathname} showLabels sx={{ height: 56 }}>
            {links.map(({ to, label, icon: Icon }) => (
              <BottomNavigationAction
                key={to}
                component={NavLink}
                to={to}
                end
                value={to}
                label={label}
                aria-label={accessibleLabel(label)}
                icon={
                  label === "Pedidos" ? (
                    <Badge
                      badgeContent={count}
                      max={99}
                      color="primary"
                      aria-hidden="true"
                    >
                      <Icon />
                    </Badge>
                  ) : (
                    <Icon />
                  )
                }
                sx={{
                  minWidth: 0,
                  px: 0.5,
                  gap: 0.25,
                  color: "text.secondary",
                  "& .MuiBottomNavigationAction-label": {
                    fontSize: ".7rem",
                    "&.Mui-selected": { fontSize: ".7rem", fontWeight: 800 },
                  },
                  "&.Mui-selected": {
                    bgcolor: "secondary.light",
                    color: "primary.dark",
                  },
                }}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </>
  );
}
