import { Box, Button, Skeleton, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeliveryDiningOutlinedIcon from "@mui/icons-material/DeliveryDiningOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import { Link as RouterLink } from "react-router-dom";
import type { Dish } from "../types/menu";
import { HeroDishCarousel } from "./HeroDishCarousel";

export function CustomerHero({
  basePrice, dishes, isLoading,
}: {
  basePrice?: number;
  dishes?: Dish[];
  isLoading: boolean;
}) {
  return (
    <Box
      component="section"
      aria-labelledby="bienvenida-title"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "0.9fr 1.1fr" },
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: { xs: 3, md: 4 },
        bgcolor: "background.paper",
        boxShadow: "0 8px 32px rgba(88,25,53,0.04)",
        mb: { xs: 0, sm: 4 },
      }}
    >
      <Box sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Typography
          component="p"
          sx={{
            color: "primary.dark",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            display: { xs: "none", sm: "block" },
            mb: 1,
          }}
        >
          Sabores Angelicales
        </Typography>
        <Typography
          component="h1"
          id="bienvenida-title"
          tabIndex={-1}
          sx={{
            fontSize: { xs: "1.75rem", sm: "2rem", md: "2.8rem" },
            fontWeight: 800,
            lineHeight: { xs: 1.12, sm: 1.08 },
            letterSpacing: "-0.04em",
            textWrap: "balance",
            outline: "none",
            mb: 1.5,
          }}
        >
          ¡Hoy se almuerza rico en Quintero!{" "}
          <Box component="span" aria-hidden="true" sx={{ display: { xs: "none", sm: "inline" } }}>
            🍽️
          </Box>
        </Typography>
        <Typography
          color="text.secondary"
          sx={{
            fontSize: { xs: "0.875rem", md: "0.95rem" },
          }}
        >
          Disfruta un almuerzo fresco y delicioso, con distintas alternativas
          para elegir cada día.
        </Typography>
        <Box sx={{
          my: { xs: 1.75, sm: 2, md: 2.5 },
          p: { xs: 1.5, sm: 0 },
          bgcolor: { xs: "background.default", sm: "transparent" },
          border: { xs: "1px solid", sm: "none" },
          borderColor: { xs: "divider", sm: "transparent" },
          borderRadius: { xs: 2, sm: 0 },
        }}>
          {isLoading ? (
            <Skeleton variant="rounded" animation={false} width={240} height={44} sx={{ maxWidth: "100%" }} aria-hidden="true" />
          ) : basePrice !== undefined && (
            <Typography
              color="primary.dark"
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "baseline",
                columnGap: 1,
                fontWeight: 700,
                fontSize: { xs: "1.1rem", md: "1.3rem" },
                lineHeight: 1.2,
              }}
            >
              Y por solo
              <Box component="span" sx={{ color: "primary.main", fontSize: { xs: "2rem", md: "2.4rem" }, fontWeight: 900, letterSpacing: "-0.04em" }}>
                ${basePrice.toLocaleString("es-CL")}
              </Box>
            </Typography>
          )}
          <Typography
            color="text.secondary"
            sx={{ fontSize: "0.8rem", mt: 0.5 }}
          >
            Incluye ensalada surtida, pan fresco del día y postre del día.
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: "0.75rem", mt: 0.75, display: { xs: "none", sm: "block" } }}
          >
            Los platos con precio especial lo indican en su tarjeta.
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          to="/menu"
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          sx={{
            px: 2.5,
            minHeight: 48,
            width: { xs: "100%", sm: "auto" },
          }}
        >
          Elegir mi almuerzo
        </Button>
        <Typography
          color="text.secondary"
          sx={{ display: { xs: "block", sm: "none" }, fontSize: "0.7rem", textAlign: "center", mt: 1 }}
        >
          Precios especiales indicados en el menú.
        </Typography>
        <Box
          sx={{
            display: { xs: "grid", sm: "flex" },
            gridTemplateColumns: { xs: "1fr 1fr", sm: "none" },
            flexWrap: "wrap",
            gap: { xs: 1.5, sm: 0.75, md: 1.5 },
            mt: 2,
            color: "text.secondary",
          }}
        >
          <Typography
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              fontSize: "0.75rem",
            }}
          >
            <DeliveryDiningOutlinedIcon sx={{ fontSize: 18 }} />
            Delivery dentro de Quintero
          </Typography>
          <Typography
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              fontSize: "0.75rem",
            }}
          >
            <StorefrontOutlinedIcon sx={{ fontSize: 18 }} />
            Retiro en calle Luis Cousiño
          </Typography>
        </Box>
      </Box>
      <HeroDishCarousel dishes={dishes} isLoading={isLoading} />
    </Box>
  );
}
