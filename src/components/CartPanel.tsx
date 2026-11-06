import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import CheckIcon from "@mui/icons-material/Check";
import { MENU_SALAD, MENU_BREAD, MENU_DESSERT } from "../domain/menu/menuOffer";
import type { CartItem } from "../types/cart";
import { getRemainingDishStock } from "../domain/cart/stock.rules";

interface CartPanelProps {
  cartItems: CartItem[];
  totalItems: number;
  totalPrice: number;
  isMobile: boolean;
  onClose: () => void;
  onUpdateQuantity: (key: string, delta: number) => void;
  onRemove: (key: string) => void;
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
      component="section"
      aria-label="Resumen del pedido"
      sx={{
        width: isMobile ? "100%" : 440,
        maxWidth: "100vw",
        height: isMobile ? "auto" : "100dvh",
        maxHeight: isMobile ? "88dvh" : "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ letterSpacing: "0.08em", lineHeight: 1.6 }}
          >
            Paso 1 de 2 · Revisa tu selección
          </Typography>
          <Typography component="h2" variant="h6" fontWeight={800}>
            Tu pedido
          </Typography>
        </Box>
        <IconButton
          aria-label="Cerrar resumen del pedido"
          onClick={onClose}
          sx={{ bgcolor: "secondary.light", width: 44, height: 44 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={{
          minHeight: 0,
          flex: "1 1 auto",
          overflowY: "auto",
          overscrollBehavior: "contain",
          p: 2.5,
        }}
      >
        {cartItems.length ? (
          <>
            <List
              disablePadding
              aria-label="Platos de tu pedido"
              sx={{ display: "grid", gap: 1.5 }}
            >
              {cartItems.map((item) => {
                const name = item.dish.isHipo
                  ? "Menú hipocalórico"
                  : item.dish.name;
                const atLimit =
                  getRemainingDishStock(cartItems, item.dish) === 0;
                return (
                  <ListItem
                    key={item.key}
                    disablePadding
                    sx={{
                      display: "block",
                      p: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                      }}
                    >
                      {item.dish.imageUrl ? (
                        <Box
                          component="img"
                          src={item.dish.imageUrl}
                          alt=""
                          sx={{
                            width: 64,
                            height: 64,
                            flexShrink: 0,
                            objectFit: "cover",
                            borderRadius: 1.5,
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 64,
                            height: 64,
                            flexShrink: 0,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: "secondary.light",
                            borderRadius: 1.5,
                          }}
                        >
                          <RestaurantMenuIcon color="primary" />
                        </Box>
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          fontWeight={700}
                          variant="body2"
                          sx={{ lineHeight: 1.45 }}
                        >
                          {name}
                        </Typography>
                        {item.dish.isHipo && item.selections.protein && (
                          <Typography
                            variant="caption"
                            color="primary.dark"
                            sx={{ display: "block", mt: 0.4 }}
                          >
                            Proteína: {item.selections.protein}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          ${item.dish.price.toLocaleString("es-CL")} por menú
                        </Typography>
                      </Box>
                      <IconButton
                        aria-label={`Eliminar ${name}`}
                        onClick={() => onRemove(item.key)}
                        size="small"
                        sx={{
                          color: "text.secondary",
                          width: 44,
                          height: 44,
                          "&:hover": {
                            color: "error.main",
                            bgcolor: "background.default",
                          },
                        }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                        mt: 1.5,
                      }}
                    >
                      <Box
                        role="group"
                        aria-label={`Cantidad de ${name}`}
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 2,
                        }}
                      >
                        <IconButton
                          aria-label={`Quitar una porción de ${name}`}
                          onClick={() => onUpdateQuantity(item.key, -1)}
                          sx={{ width: 44, height: 44 }}
                        >
                          <RemoveIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <Typography
                          aria-live="polite"
                          sx={{
                            minWidth: 24,
                            textAlign: "center",
                            fontWeight: 700,
                          }}
                        >
                          {item.quantity}
                        </Typography>
                        <IconButton
                          aria-label={`Agregar una porción de ${name}`}
                          onClick={() => onUpdateQuantity(item.key, 1)}
                          disabled={atLimit}
                          sx={{ width: 44, height: 44 }}
                        >
                          <AddIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                      <Typography
                        fontWeight={800}
                        color="primary.main"
                        aria-label={`Subtotal de ${name}`}
                      >
                        $
                        {(item.dish.price * item.quantity).toLocaleString(
                          "es-CL",
                        )}
                      </Typography>
                    </Box>
                    {atLimit && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.75 }}
                      >
                        Ya agregaste todas las porciones disponibles.
                      </Typography>
                    )}
                  </ListItem>
                );
              })}
            </List>
            <Box
              component="aside"
              aria-label="Acompañamientos de cada menú"
              sx={{
                mt: 2,
                px: 1.5,
                py: 1.25,
                bgcolor: "background.default",
                borderRadius: 2,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", fontWeight: 600, mb: 0.75 }}
              >
                Cada menú incluye
              </Typography>
              <Box
                component="ul"
                sx={{
                  m: 0,
                  p: 0,
                  listStyle: "none",
                  display: "flex",
                  flexWrap: "wrap",
                  columnGap: 1.5,
                  rowGap: 0.5,
                }}
              >
                {[MENU_SALAD, MENU_BREAD, MENU_DESSERT].map((item) => (
                  <Box
                    component="li"
                    key={item}
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <CheckIcon sx={{ fontSize: 14, color: "primary.main" }} />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </>
        ) : (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <RestaurantMenuIcon
              sx={{ fontSize: 42, color: "primary.light", mb: 1 }}
            />
            <Typography fontWeight={700}>Tu pedido está vacío</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Elige un plato del menú para comenzar.
            </Typography>
            <Button onClick={onClose} sx={{ mt: 2 }}>
              Ver menú
            </Button>
          </Box>
        )}
      </Box>

      {cartItems.length > 0 && (
        <Box
          sx={{
            flexShrink: 0,
            px: 2.5,
            pt: 2,
            pb: "max(16px, env(safe-area-inset-bottom))",
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Box>
              <Typography fontWeight={700}>Total del pedido</Typography>
              <Typography variant="caption" color="text.secondary">
                {totalItems}{" "}
                {totalItems === 1 ? "menú completo" : "menús completos"}
              </Typography>
            </Box>
            <Typography
              variant="h5"
              fontWeight={800}
              color="primary.main"
              aria-label="Total del pedido"
            >
              ${totalPrice.toLocaleString("es-CL")}
            </Typography>
          </Box>
          <Button
            variant="contained"
            fullWidth
            size="large"
            endIcon={<ArrowForwardRoundedIcon />}
            onClick={onConfirmOrder}
          >
            Continuar a confirmar
          </Button>
          <Button
            fullWidth
            onClick={onClose}
            color="inherit"
            sx={{ color: "text.secondary", mt: 0.5 }}
          >
            Seguir eligiendo
          </Button>
        </Box>
      )}
    </Box>
  );
}
