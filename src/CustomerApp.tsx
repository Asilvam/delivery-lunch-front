import axios from "axios";
import { MENU_PRICE } from "./domain/menu/menuOffer";
import { useCustomerSession } from "./hooks/useCustomerSession";
// src/CustomerApp.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Alert,
  Typography,
  Box,
  Grid,
  IconButton,
  Badge,
  Drawer,
  Dialog,
  Button,
  useMediaQuery,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";
import { appAlert } from "./utils/notifications";

import { appTheme } from "./theme/appTheme";
import { buildCartItemKey, normalizeMenuCart } from "./domain/cart/cartHelpers";
import {
  userToast,
  showAddToCartFeedback,
  showStockLimitFeedback,
  triggerCompletionFeedback,
} from "./utils/feedback";
import { PageLayout, BrandHeader } from "./components/layout/PageLayout";
import { CartPanel } from "./components/CartPanel";
import { DishCard } from "./components/DishCard";
import { MenuLoadingScreen } from "./components/MenuLoadingScreen";
import { OrderConfirmDialog } from "./components/OrderConfirmDialog";
import { fetchDailyMenus, getMenuDateTimestamp } from "./api/menu";
import { sendOrder, getPendingOrder } from "./api/order";
import type {
  DailyMenu,
  Dish,
  DishSelectionVisibility,
  DishSelections,
} from "./types/menu";
import type { CartItem } from "./types/cart";
import { OrderReceiptDialog } from "./components/OrderReceiptDialog";
import type { OrderResponse } from "./types/order";
import type { OrderPayload } from "./types/order";
import { canAddDish, getRemainingDishStock } from "./domain/cart/stock.rules";
import { logger } from "./shared/utils/logger";

function refreshCartPrices(items: CartItem[], menus: DailyMenu[]): CartItem[] {
  const dishes = new Map(
    menus.flatMap((menu) => menu.dishes).map((dish) => [dish.id, dish]),
  );
  return items.map((item) => ({
    ...item,
    dish: dishes.get(item.dish.id) ?? item.dish,
  }));
}

export default function CustomerApp() {
  const { session, signOut } = useCustomerSession();
  const sending = useRef(false);
  const [receipt, setReceipt] = useState<{
    order: OrderResponse;
    payload: OrderPayload;
  } | null>(null);
  const closeReceipt = useCallback(() => setReceipt(null), []);
  const [pendingOrder, setPendingOrder] = useState(() => getPendingOrder());
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const stored = JSON.parse(
        sessionStorage.getItem("lunch_cart") || "[]",
      ) as CartItem[];
      return Array.isArray(stored)
        ? getPendingOrder()
          ? stored
          : normalizeMenuCart(stored)
        : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    sessionStorage.setItem("lunch_cart", JSON.stringify(cartItems));
  }, [cartItems]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [menus, setMenus] = useState<DailyMenu[]>([]);
  const [isLoadingMenus, setIsLoadingMenus] = useState(true);
  const [menuLoadError, setMenuLoadError] = useState<string | null>(null);
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
  const isMobile = useMediaQuery(appTheme.breakpoints.down("sm"));

  useEffect(() => {
    let mounted = true;
    const loadMenus = async () => {
      logger.info("[App] Cargando menús...");
      try {
        setIsLoadingMenus(true);
        const [data] = await Promise.all([
          fetchDailyMenus(),
          new Promise<void>((resolve) => setTimeout(resolve, 1000)),
        ]);
        if (!mounted) return;
        logger.info(`[App] Menús cargados: ${data.length} día(s)`, data);
        setMenus(data);
        if (!getPendingOrder())
          setCartItems((items) => refreshCartPrices(items, data));
        setMenuLoadError(null);
        setSelectedMenuIndex(0);
        if (data.length === 0) {
          logger.warn("[App] El backend no retornó menús para hoy");
          void userToast.fire({
            icon: "info",
            title: "Sin menús disponibles para hoy.",
          });
        }
      } catch (error) {
        if (!mounted) return;
        logger.error("[App] Error al cargar menús", error);
        setMenuLoadError("No se pudieron cargar los menús diarios.");
        setMenus([]);
        void userToast.fire({
          icon: "error",
          title: "Error al cargar menús. Intenta nuevamente.",
        });
      } finally {
        if (mounted) setIsLoadingMenus(false);
      }
    };
    void loadMenus();
    return () => {
      mounted = false;
      appAlert.close();
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
  const selectedMenu =
    menusForNavigation[selectedMenuIndex] ?? menusForNavigation[0];
  const basePrice = selectedMenu?.basePrice ?? MENU_PRICE;
  const hasSpecialPrices = selectedMenu?.dishes.some(
    (dish) => dish.price !== basePrice,
  );
  const canGoBack = selectedMenuIndex > 0;
  const canGoForward = selectedMenuIndex < menusForNavigation.length - 1;

  const handleAddToCart = (
    dishToAdd: Dish,
    selections: DishSelections,
    visibility: DishSelectionVisibility,
  ) => {
    if (getPendingOrder()) {
      void userToast.fire({
        icon: "info",
        title:
          "Confirma el resultado del envío pendiente antes de cambiar el pedido.",
      });
      setIsOrderDialogOpen(true);
      return;
    }
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
            {
              key: cartItemKey,
              dish: dishToAdd,
              quantity: 1,
              selections,
              visibility,
            },
          ];
    });

    if (wasBlocked) {
      void showStockLimitFeedback(dishToAdd.name, false, 0);
      return;
    }
    void showAddToCartFeedback(dishToAdd.name, nextQuantity, wasExisting);
    logger.debug(
      `[App] Carrito actualizado — ${dishToAdd.name} x${nextQuantity}`,
    );
  };

  const handleUpdateQuantity = (cartItemKey: string, delta: number) => {
    if (getPendingOrder()) {
      setIsOrderDialogOpen(true);
      return;
    }
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
      void showStockLimitFeedback(
        targetItem.dish.name,
        targetItem.dish.stock === 0,
        0,
      );
  };

  const handleRemoveFromCart = (cartItemKey: string) => {
    if (getPendingOrder()) {
      setIsOrderDialogOpen(true);
      return;
    }
    setCartItems((prev) => prev.filter((item) => item.key !== cartItemKey));
  };

  const handleConfirmOrder = () => {
    if (cartItems.length === 0) {
      void userToast.fire({
        icon: "info",
        title: "No hay platos en el carrito.",
      });
      return;
    }
    logger.info("[App] Abriendo dialog de confirmación de pedido");
    setIsCartOpen(false);
    setIsOrderDialogOpen(true);
  };

  const handleSubmitOrder = async (payload: OrderPayload) => {
    if (!session || sending.current) return;
    sending.current = true;
    try {
      const order = await sendOrder(
        payload,
        session.access_token,
        session.customer.googleId,
      );
      setPendingOrder(null);
      setIsOrderDialogOpen(false);
      setCartItems([]);
      sessionStorage.removeItem("checkout_contact");
      triggerCompletionFeedback();
      setReceipt({ order, payload });
      try {
        setMenus(await fetchDailyMenus());
      } catch {
        /* El comprobante ya confirmó el pedido. */
      }
    } catch (error) {
      const pending = getPendingOrder();
      setPendingOrder(pending);
      if (
        axios.isAxiosError(error) &&
        error.response?.data?.code === "PRICE_CHANGED"
      ) {
        setIsOrderDialogOpen(false);
        setIsCartOpen(true);
        try {
          const fresh = await fetchDailyMenus();
          setMenus(fresh);
          setCartItems((items) => refreshCartPrices(items, fresh));
          void userToast.fire({
            icon: "info",
            title: "El precio cambió",
            text: "Actualizamos tu resumen. Revisa el nuevo total antes de continuar.",
          });
        } catch {
          void userToast.fire({
            icon: "error",
            title: "No pudimos actualizar los precios",
            text: "Conservamos tus platos. Recarga el menú antes de volver a enviar.",
          });
        }
        return;
      }
      if (axios.isAxiosError(error) && error.response?.status === 401)
        signOut();
      const serverMessage = axios.isAxiosError(error)
        ? error.response?.data?.message
        : null;
      void userToast.fire({
        icon: pending ? "warning" : "error",
        title: pending
          ? "El envío sigue sin confirmar"
          : "No pudimos enviar el pedido",
        text:
          error instanceof Error && !axios.isAxiosError(error)
            ? error.message
            : pending
              ? "Tu pedido está guardado. Reintenta el mismo envío para confirmar su resultado sin duplicarlo."
              : typeof serverMessage === "string"
                ? serverMessage
                : "Conservamos tus platos y tus datos. Revisa el pedido e intenta nuevamente.",
      });
    } finally {
      sending.current = false;
    }
  };

  const totalItems = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const totalPrice = cartItems.reduce(
    (acc, i) => acc + i.dish.price * i.quantity,
    0,
  );

  return (
    <>
      {/* ─── APP BAR ──────────────────────────────────────────────────────────── */}
      <PageLayout
        mainId="menu-del-dia"
        header={
          <BrandHeader
            right={
              <IconButton
                aria-label="Abrir mi pedido"
                color="primary"
                onClick={() => setIsCartOpen(true)}
                sx={{
                  bgcolor:
                    totalItems > 0 ? "rgba(216,27,96,0.08)" : "transparent",
                  border:
                    totalItems > 0
                      ? "1.5px solid rgba(216,27,96,0.2)"
                      : "1.5px solid transparent",
                  transition: "all 0.2s ease",
                  "&:hover": { bgcolor: "rgba(216,27,96,0.12)" },
                }}
              >
                <Badge badgeContent={totalItems} color="secondary" max={99}>
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            }
          />
        }
      >
        {pendingOrder && (
          <Alert
            severity="warning"
            action={
              <Button onClick={() => setIsOrderDialogOpen(true)}>
                Confirmar resultado
              </Button>
            }
          >
            Hay un envío pendiente de confirmación. Conservamos tu pedido para
            reintentarlo sin duplicados.
          </Alert>
        )}

        {/* ─── MAIN ─────────────────────────────────────────────────────────────── */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ letterSpacing: "0.08em" }}
          >
            {isLoadingMenus
              ? "Cargando menú…"
              : selectedMenu
                ? `Menú del día · ${new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${selectedMenu.isoDate}T12:00:00Z`))}`
                : "Menú del día"}
          </Typography>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: "1.7rem", sm: "2.1rem" },
              fontWeight: 800,
              letterSpacing: "-0.035em",
              lineHeight: 1.2,
              mt: 0.5,
              mb: 1.5,
            }}
          >
            Elige el que quieras.{" "}
            <Box
              component="span"
              sx={{
                display: { xs: "block", md: "inline" },
                color: "primary.main",
              }}
            >
              Por solo ${basePrice.toLocaleString("es-CL")}
            </Box>
          </Typography>
          {hasSpecialPrices && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Los platos con precio especial lo muestran junto a Agregar.
            </Typography>
          )}
          {!isLoadingMenus && menusForNavigation.length > 1 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <IconButton
                disabled={!canGoBack}
                onClick={() => setSelectedMenuIndex((p) => Math.max(0, p - 1))}
                size="small"
                sx={{
                  bgcolor: canGoBack ? "rgba(216,27,96,0.08)" : "transparent",
                  border: "1px solid",
                  borderColor: canGoBack ? "rgba(216,27,96,0.2)" : "divider",
                }}
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
                {menusForNavigation.map((menu, idx) => (
                  <Box
                    key={menu.date}
                    onClick={() => setSelectedMenuIndex(idx)}
                    sx={{
                      px: 2,
                      py: 0.6,
                      borderRadius: 99,
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      transition: "all 0.18s ease",
                      ...(idx === selectedMenuIndex
                        ? {
                            bgcolor: "primary.main",
                            color: "white",
                            boxShadow: "0 3px 10px rgba(216,27,96,0.3)",
                          }
                        : {
                            bgcolor: "rgba(216,27,96,0.07)",
                            color: "primary.dark",
                            "&:hover": { bgcolor: "rgba(216,27,96,0.14)" },
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
                  setSelectedMenuIndex((p) =>
                    Math.min(menusForNavigation.length - 1, p + 1),
                  )
                }
                size="small"
                sx={{
                  bgcolor: canGoForward
                    ? "rgba(216,27,96,0.08)"
                    : "transparent",
                  border: "1px solid",
                  borderColor: canGoForward ? "rgba(216,27,96,0.2)" : "divider",
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
                    fontSize: "0.78rem",
                    color: "text.secondary",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  Hoy
                </Button>
              )}
            </Box>
          )}
        </Box>

        {!isLoadingMenus && selectedMenu && (
          <Box
            sx={{
              mb: 2.5,
              px: 2,
              py: 1.5,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              bgcolor: "background.paper",
              display: "flex",
              alignItems: { xs: "flex-start", sm: "center" },
              flexDirection: { xs: "column", sm: "row" },
              gap: { xs: 0.5, sm: 2 },
            }}
          >
            <Typography
              variant="body2"
              fontWeight={800}
              color="primary.dark"
              sx={{ flexShrink: 0 }}
            >
              Todos incluyen
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ensalada surtida · Pan fresco del día · Postre del día
            </Typography>
          </Box>
        )}
        {isLoadingMenus && <MenuLoadingScreen />}

        {!isLoadingMenus && menuLoadError && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography color="error" fontWeight={600}>
              {menuLoadError}
            </Typography>
          </Box>
        )}

        {!isLoadingMenus && !menuLoadError && selectedMenu && (
          <Grid
            container
            spacing={{ xs: 2, sm: 2.5 }}
            alignItems="stretch"
            justifyContent="flex-start"
          >
            {selectedMenu.dishes.map((dish) => (
              <Grid key={dish.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <DishCard
                  dish={dish}
                  basePrice={basePrice}
                  onAddToCart={handleAddToCart}
                  remainingSharedStock={getRemainingDishStock(cartItems, dish)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </PageLayout>

      {/* ─── CARRITO ──────────────────────────────────────────────────────────── */}
      {isMobile ? (
        <Dialog
          open={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          fullWidth
          maxWidth="sm"
          slotProps={{
            paper: {
              sx: {
                borderRadius: 2,
                m: 1.5,
                width: "calc(100% - 24px)",
                maxHeight: "90dvh",
                overflow: "hidden",
              },
            },
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
        <Drawer
          anchor="right"
          open={isCartOpen}
          onClose={() => setIsCartOpen(false)}
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
        </Drawer>
      )}

      {receipt && (
        <OrderReceiptDialog
          open
          order={receipt.order}
          payload={receipt.payload}
          onClose={closeReceipt}
        />
      )}

      {/* ─── DIALOG CONFIRMACIÓN PEDIDO ───────────────────────────────────────── */}
      {(selectedMenu || pendingOrder) && (
        <OrderConfirmDialog
          open={isOrderDialogOpen}
          menu={selectedMenu}
          cartItems={cartItems}
          totalPrice={totalPrice}
          pendingPayload={pendingOrder?.payload}
          onClose={() => {
            setIsOrderDialogOpen(false);
            setIsCartOpen(true);
          }}
          onSubmit={handleSubmitOrder}
        />
      )}
    </>
  );
}
