import type { ReactNode } from "react";
import {
  AppBar,
  Box,
  Container,
  Link,
  Toolbar,
  Typography,
} from "@mui/material";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import { Link as RouterLink, useLocation } from "react-router-dom";

export function BrandHeader({
  right,
  navigation,
}: {
  right?: ReactNode;
  navigation?: ReactNode;
}) {
  return (
    <AppBar position="sticky" color="inherit" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar
          disableGutters
          sx={{ gap: 1.5, minHeight: { xs: 64, sm: 72 } }}
        >
          <Link
            component={RouterLink}
            to="/"
            underline="none"
            aria-label="Sabores Angelicales, ir al menú"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              minWidth: 0,
              flexGrow: 1,
              color: "primary.main",
            }}
          >
            <RestaurantMenuIcon sx={{ fontSize: 25, flexShrink: 0 }} />
            <Typography
              sx={{
                fontSize: { xs: "0.95rem", sm: "1.2rem" },
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Sabores Angelicales
            </Typography>
          </Link>
          {right}
        </Toolbar>
        {navigation && <Box sx={{ pb: 1.5 }}>{navigation}</Box>}
      </Container>
    </AppBar>
  );
}

export function BrandFooter() {
  const { pathname } = useLocation();
  return (
    <Box
      component="footer"
      sx={{
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          py: 1.5,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} Sabores Angelicales
        </Typography>
        <Link
          component={RouterLink}
          to={pathname === "/" ? "/login" : "/"}
          underline="hover"
          color="primary.dark"
          sx={{
            minHeight: 44,
            display: "inline-flex",
            alignItems: "center",
            fontSize: "0.8rem",
            fontWeight: 600,
          }}
        >
          {pathname === "/" ? "Acceso del personal" : "Ver menú del día"}
        </Link>
      </Container>
    </Box>
  );
}

/** El footer sigue al contenido: sin posición fija, alturas forzadas ni márgenes automáticos. */
export function PageLayout({
  header,
  children,
  mainId,
}: {
  header: ReactNode;
  children: ReactNode;
  mainId?: string;
}) {
  return (
    <Box sx={{ minHeight: "100svh", bgcolor: "background.default" }}>
      {header}
      <Container
        component="main"
        id={mainId}
        maxWidth="lg"
        sx={{ py: { xs: 2.5, sm: 3 }, minWidth: 0 }}
      >
        {children}
      </Container>
      <BrandFooter />
    </Box>
  );
}
