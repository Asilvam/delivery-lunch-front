import { useSweetAlertOpen } from "./hooks/useSweetAlertOpen";
import { useCartValidity } from "./hooks/useCartValidity";
import {
  CART_STORAGE_KEY,
  cartForMenu,
  cartStatusMessage,
  chileToday,
  emptyMenuCart,
  menuCartStatus,
  readMenuCart,
  reconcileMenuCart,
} from "./domain/cart/menuCart";
import { useOrderingHours } from "./hooks/useOrderingHours";
import {
  isOrderingOpen,
  ORDERING_HOURS_MESSAGE,
} from "./domain/orders/orderingHours";
import axios from "axios";
import {
  Outlet,
  useLocation,
  useOutletContext,
  useNavigate,
} from "react-router-dom";
import type { Dispatch, SetStateAction } from "react";
import { MENU_PRICE } from "./domain/menu/menuOffer";
import { useCustomerSession } from "./hooks/useCustomerSession";
// src/CustomerApp.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Alert,
  Typography,
  Box,
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
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { appAlert } from "./utils/notifications";

import { appTheme } from "./theme/appTheme";
import { buildCartItemKey } from "./domain/cart/cartHelpers";
import {
  userAlert,
  showAddToCartFeedback,
  showStockLimitFeedback,
  triggerCompletionFeedback,
} from "./utils/feedback";
import { PageLayout, BrandHeader } from "./components/layout/PageLayout";
import { CartPanel } from "./components/CartPanel";
import { DishCard } from "./components/DishCard";
import { CustomerHero } from "./components/CustomerHero";
import { MenuLoadingScreen } from "./components/MenuLoadingScreen";
import { OrderConfirmDialog } from "./components/OrderConfirmDialog";
import { fetchDailyMenus } from "./api/menu";
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

export default function CustomerApp() {
  const sweetAlertOpen = useSweetAlertOpen();
  const { session, getSession, refreshSession } = useCustomerSession();
  const orderingOpen = useOrderingHours();
  const notifyClosed = () =>
    void userAlert.fire({ icon: "info", title: ORDERING_HOURS_MESSAGE });
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const previousPathname = useRef(pathname);
  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document
      .querySelector<HTMLElement>("main h1")
      ?.focus({ preventScroll: true });
  }, [pathname]);
  const sending = useRef(false);
  const [receipt, setReceipt] = useState<{
    order: OrderResponse;
    payload: OrderPayload;
  } | null>(null);
  const closeReceipt = useCallback(() => setReceipt(null), []);
  const [pendingOrder, setPendingOrder] = useState(() => getPendingOrder());
  const [menuCart, setMenuCart] = useState(() =>
    readMenuCart(!getPendingOrder()),
  );
  const cartItems = menuCart.items;
  const setCartItems = useCallback((update: SetStateAction<CartItem[]>) => {
    setMenuCart((current) => {
      const items =
        typeof update === "function" ? update(current.items) : update;
      return items.length ? { ...current, items } : emptyMenuCart();
    });
  }, []);
  useEffect(() => {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(menuCart));
  }, [menuCart]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const cartTrigger = useRef<HTMLButtonElement>(null);
  const setCartOpen = (open: boolean) => {
    if (open === isCartOpen) return;
    // Libera el foco antes de que MUI oculte el fondo o el panel que sale.
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    setIsCartOpen(open);
  };
  const setCheckoutOpen = (open: boolean) => {
    if (open === isOrderDialogOpen) return;
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    setIsOrderDialogOpen(open);
  };
  const restoreCartFocus = () => {
    if (isCartOpen || isOrderDialogOpen || receipt) return;
    const trigger = cartTrigger.current;
    if (trigger?.isConnected && !trigger.closest('[aria-hidden="true"]')) {
      trigger.focus({ preventScroll: true });
    }
  };
  const [menus, setMenus] = useState<DailyMenu[]>([]);
  const [isLoadingMenus, setIsLoadingMenus] = useState(true);
  const [menuLoadError, setMenuLoadError] = useState<string | null>(null);
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
  const isMobile = useMediaQuery(appTheme.breakpoints.down("sm"));
  const [menuRevision, setMenuRevision] = useState(0);
  const { today: todayIso, status: cartStatus } = useCartValidity(
    menuCart,
    menus,
    isLoadingMenus,
  );
  const cartIssue = pendingOrder ? undefined : cartStatusMessage[cartStatus];

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const loadMenus = async () => {
      logger.info("[App] Cargando menús...");
      try {
        setIsLoadingMenus(true);
        const [data] = await Promise.all([
          fetchDailyMenus(controller.signal),
          new Promise<void>((resolve) => setTimeout(resolve, 1000)),
        ]);
        if (!mounted) return;
        logger.info(`[App] Menús cargados: ${data.length} día(s)`, data);
        setMenus(data);
        if (!getPendingOrder())
          setMenuCart((current) => reconcileMenuCart(current, data));
        setMenuLoadError(null);
        setSelectedMenuIndex(0);
        if (data.length === 0) {
          logger.warn("[App] El backend no retornó menús para hoy");
          void userAlert.fire({
            icon: "info",
            title: "Sin menús disponibles para hoy.",
          });
        }
      } catch (error) {
        if (!mounted) return;
        logger.error("[App] Error al cargar menús", error);
        setMenuLoadError("No se pudieron cargar los menús diarios.");
        setMenus([]);
        void userAlert.fire({
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
      controller.abort();
    };
  }, [todayIso, menuRevision]);
  useEffect(
    () => () => {
      appAlert.close();
    },
    [],
  );

  const menusForNavigation = menus.filter((menu) => menu.isoDate === todayIso);
  const selectedMenu =
    menusForNavigation[selectedMenuIndex] ?? menusForNavigation[0];
  const checkoutMenu =
    menus.find(
      (menu) => menu.id === menuCart.menuId && menu.isoDate === menuCart.fecha,
    ) ?? selectedMenu;
  const basePrice = selectedMenu?.basePrice ?? MENU_PRICE;
  const ensureCartReady = () => {
    const status = menuCartStatus(menuCart, menus, isLoadingMenus);
    if (status === "ready") return true;
    void userAlert.fire({
      icon: "info",
      title: cartStatusMessage[status] ?? "Tu carrito está vacío.",
    });
    return false;
  };
  const startNewCart = () => {
    if (getPendingOrder()) {
      setCheckoutOpen(true);
      return;
    }
    setMenuCart(emptyMenuCart());
    setCartOpen(false);
    setMenuRevision((value) => value + 1);
    navigate("/menu");
  };

  const handleAddToCart = (
    dishToAdd: Dish,
    selections: DishSelections,
    visibility: DishSelectionVisibility,
  ) => {
    if (!isOrderingOpen()) {
      notifyClosed();
      return;
    }
    if (getPendingOrder()) {
      void userAlert.fire({
        icon: "info",
        title:
          "Confirma el resultado del envío pendiente antes de cambiar el pedido.",
      });
      setCheckoutOpen(true);
      return;
    }
    if (
      !selectedMenu ||
      selectedMenu.isoDate !== chileToday() ||
      !selectedMenu.expiresAt ||
      !Number.isFinite(Date.parse(selectedMenu.expiresAt)) ||
      Date.now() >= Date.parse(selectedMenu.expiresAt)
    ) {
      void userAlert.fire({
        icon: "info",
        title: "Este menú ya no está vigente. Revisa el menú del día.",
      });
      setMenuRevision((value) => value + 1);
      return;
    }
    if (
      cartItems.length &&
      (menuCart.menuId !== selectedMenu.id || !ensureCartReady())
    ) {
      setCartOpen(true);
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

    setMenuCart((current) => {
      const bound = current.items.length ? current : cartForMenu(selectedMenu);
      const prev = bound.items;
      if (!canAddDish(prev, dishToAdd)) {
        wasBlocked = true;
        return current;
      }
      const existing = prev.find((item) => item.key === cartItemKey);
      wasExisting = Boolean(existing);
      nextQuantity = existing ? existing.quantity + 1 : 1;
      const items = existing
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
      return { ...bound, items };
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
    if (delta > 0 && !isOrderingOpen()) {
      notifyClosed();
      return;
    }
    if (getPendingOrder()) {
      setCheckoutOpen(true);
      return;
    }
    if (delta > 0 && !ensureCartReady()) return;
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
      setCheckoutOpen(true);
      return;
    }
    setCartItems((prev) => prev.filter((item) => item.key !== cartItemKey));
  };

  const handleConfirmOrder = () => {
    if (!isOrderingOpen() && !getPendingOrder()) {
      notifyClosed();
      return;
    }
    if (!getPendingOrder() && !ensureCartReady()) return;
    if (cartItems.length === 0) {
      void userAlert.fire({
        icon: "info",
        title: "No hay platos en el carrito.",
      });
      return;
    }
    logger.info("[App] Abriendo dialog de confirmación de pedido");
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const handleSubmitOrder = async (payload: OrderPayload) => {
    if (!isOrderingOpen() && !getPendingOrder()) {
      notifyClosed();
      return;
    }
    if (
      !getPendingOrder() &&
      (!ensureCartReady() ||
        payload.menuId !== menuCart.menuId ||
        payload.fecha !== menuCart.fecha)
    )
      return;
    if (!session || sending.current) return;
    sending.current = true;
    try {
      const activeSession = await getSession();
      if (!activeSession) return;
      const order = await sendOrder(
        payload,
        activeSession.access_token,
        activeSession.customer.googleId,
      );
      setPendingOrder(null);
      setCheckoutOpen(false);
      setCartItems([]);
      sessionStorage.removeItem("checkout_contact");
      void refreshSession().catch(() => null);
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
        setCheckoutOpen(false);
        setCartOpen(true);
        try {
          const fresh = await fetchDailyMenus();
          setMenus(fresh);
          setMenuCart((current) => reconcileMenuCart(current, fresh));
          void userAlert.fire({
            icon: "info",
            title: "El precio cambió",
            text: "Actualizamos tu resumen. Revisa el nuevo total antes de continuar.",
          });
        } catch {
          void userAlert.fire({
            icon: "error",
            title: "No pudimos actualizar los precios",
            text: "Conservamos tus platos. Recarga el menú antes de volver a enviar.",
          });
        }
        return;
      }
      if (
        axios.isAxiosError(error) &&
        (error.response?.status === 401 ||
          error.response?.data?.code === "CUSTOMER_BLOCKED" ||
          error.response?.data?.code === "CUSTOMER_UNAVAILABLE")
      )
        await refreshSession().catch(() => null);
      const serverMessage = axios.isAxiosError(error)
        ? error.response?.data?.message
        : null;
      void userAlert.fire({
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
        header={
          <BrandHeader
            right={
              <IconButton
                ref={cartTrigger}
                aria-label="Abrir mi pedido"
                color="primary"
                onClick={() => setCartOpen(true)}
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
        {!orderingOpen && (
          <Box
            role="status"
            sx={{ mb: 2, p: 2, bgcolor: "secondary.light", borderRadius: 2 }}
          >
            <Typography fontWeight={700}>Pedidos cerrados por ahora</Typography>
            <Typography variant="body2" color="text.secondary">
              {ORDERING_HOURS_MESSAGE}
            </Typography>
          </Box>
        )}
        {pendingOrder && (
          <Alert
            severity="warning"
            action={
              <Button onClick={() => setCheckoutOpen(true)}>
                Confirmar resultado
              </Button>
            }
          >
            Hay un envío pendiente de confirmación. Conservamos tu pedido para
            reintentarlo sin duplicados.
          </Alert>
        )}

        <Outlet
          context={
            {
              selectedMenu,
              menusForNavigation,
              isLoadingMenus,
              menuLoadError,
              selectedMenuIndex,
              setSelectedMenuIndex,
              basePrice,
              cartItems,
              handleAddToCart,
              orderingOpen,
            } satisfies CustomerPageContext
          }
        />
      </PageLayout>

      {/* ─── CARRITO ──────────────────────────────────────────────────────────── */}
      {isMobile ? (
        <Dialog
          disableEnforceFocus={sweetAlertOpen}
          open={isCartOpen}
          onClose={() => setCartOpen(false)}
          disableRestoreFocus
          aria-label="Resumen del pedido"
          fullWidth
          maxWidth="sm"
          slotProps={{
            transition: { onExited: restoreCartFocus },
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
            cartIssue={cartIssue}
            onStartNewCart={
              cartStatus !== "checking" && !pendingOrder
                ? startNewCart
                : undefined
            }
            orderingOpen={orderingOpen}
            cartItems={cartItems}
            totalItems={totalItems}
            totalPrice={totalPrice}
            isMobile={isMobile}
            onClose={() => setCartOpen(false)}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemoveFromCart}
            onConfirmOrder={handleConfirmOrder}
          />
        </Dialog>
      ) : (
        <Drawer
          disableEnforceFocus={sweetAlertOpen}
          anchor="right"
          ModalProps={{ disableRestoreFocus: true }}
          slotProps={{ transition: { onExited: restoreCartFocus } }}
          open={isCartOpen}
          onClose={() => setCartOpen(false)}
        >
          <CartPanel
            cartIssue={cartIssue}
            onStartNewCart={
              cartStatus !== "checking" && !pendingOrder
                ? startNewCart
                : undefined
            }
            orderingOpen={orderingOpen}
            cartItems={cartItems}
            totalItems={totalItems}
            totalPrice={totalPrice}
            isMobile={isMobile}
            onClose={() => setCartOpen(false)}
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
      {(checkoutMenu || pendingOrder || cartItems.length > 0) && (
        <OrderConfirmDialog
          cartIssue={cartIssue}
          orderingOpen={orderingOpen}
          open={isOrderDialogOpen}
          menu={checkoutMenu}
          cartItems={cartItems}
          totalPrice={totalPrice}
          pendingPayload={pendingOrder?.payload}
          onClose={() => {
            setCheckoutOpen(false);
            setCartOpen(true);
          }}
          onExited={restoreCartFocus}
          onSubmit={handleSubmitOrder}
        />
      )}
    </>
  );
}

interface CustomerPageContext {
  orderingOpen: boolean;
  selectedMenu: DailyMenu | undefined;
  menusForNavigation: DailyMenu[];
  isLoadingMenus: boolean;
  menuLoadError: string | null;
  selectedMenuIndex: number;
  setSelectedMenuIndex: Dispatch<SetStateAction<number>>;
  basePrice: number;
  cartItems: CartItem[];
  handleAddToCart: (
    dish: Dish,
    selections: DishSelections,
    visibility: DishSelectionVisibility,
  ) => void;
}

export function CustomerHomePage() {
  const { selectedMenu, isLoadingMenus, basePrice, orderingOpen } =
    useOutletContext<CustomerPageContext>();
  return (
    <CustomerHero
      orderingOpen={orderingOpen}
      basePrice={!isLoadingMenus && selectedMenu ? basePrice : undefined}
      dishes={selectedMenu?.dishes}
      isLoading={isLoadingMenus}
    />
  );
}

export function CustomerMenuPage() {
  const {
    selectedMenu,
    menusForNavigation,
    isLoadingMenus,
    menuLoadError,
    selectedMenuIndex,
    setSelectedMenuIndex,
    basePrice,
    cartItems,
    handleAddToCart,
    orderingOpen,
  } = useOutletContext<CustomerPageContext>();
  const menuGrid = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const grid = menuGrid.current;
    if (!grid) return;
    const headings = [
      ...grid.querySelectorAll<HTMLElement>('[data-menu-heading="standard"]'),
    ];
    const alignHeadings = () => {
      const height = Math.max(
        0,
        ...headings.map((heading) => heading.getBoundingClientRect().height),
      );
      grid.style.setProperty("--menu-heading-height", `${height}px`);
    };
    const observer = new ResizeObserver(alignHeadings);
    headings.forEach((heading) => observer.observe(heading));
    alignHeadings();
    return () => observer.disconnect();
  }, [selectedMenu, isLoadingMenus, menuLoadError]);
  const canGoBack = selectedMenuIndex > 0;
  const canGoForward = selectedMenuIndex < menusForNavigation.length - 1;
  const hasSpecialPrices = selectedMenu?.dishes.some(
    (dish) => dish.price !== basePrice,
  );
  return (
    <Box
      component="section"
      id="menu-del-dia"
      aria-labelledby="menu-title"
      tabIndex={-1}
      sx={{
        "&:focus": { outline: "none" },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.dark",
          outlineOffset: 6,
          borderRadius: 2,
        },
      }}
    >
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
          id="menu-title"
          tabIndex={-1}
          sx={{
            fontSize: { xs: "1.7rem", sm: "2.1rem" },
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 1.2,
            mt: 0.5,
            mb: 1.5,
            outline: "none",
          }}
        >
          Elige tu almuerzo de hoy
        </Typography>
        {!isLoadingMenus && selectedMenu && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Ensalada surtida · Pan fresco del día · Postre del día
            </Typography>
            {hasSpecialPrices && (
              <Typography variant="caption" color="text.secondary">
                Los platos con precio especial lo indican junto a Agregar.
              </Typography>
            )}
            <Box
              component="aside"
              aria-label="Información sobre el menú"
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.25,
                mt: 2,
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                bgcolor: "rgba(216,27,96,0.05)",
              }}
            >
              <InfoOutlinedIcon
                fontSize="small"
                sx={{ color: "primary.dark", mt: 0.2, flexShrink: 0 }}
              />
              <Box>
                <Typography variant="body2" fontWeight={700} color="primary.dark">
                  Acompañamientos y porciones fijos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No realizamos cambios de acompañamientos ni compensamos uno por
                  una mayor cantidad de otro.
                </Typography>
              </Box>
            </Box>
          </Box>
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
                bgcolor: canGoForward ? "rgba(216,27,96,0.08)" : "transparent",
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

      {isLoadingMenus && <MenuLoadingScreen />}

      {!isLoadingMenus && menuLoadError && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography color="error" fontWeight={600}>
            {menuLoadError}
          </Typography>
        </Box>
      )}

      {!isLoadingMenus && !menuLoadError && selectedMenu && (
        <Box
          ref={menuGrid}
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
            },
            gap: { xs: 2, sm: 2.5 },
            alignItems: "stretch",
          }}
        >
          {selectedMenu.dishes.map((dish) => (
            <DishCard
              key={dish.id}
              orderingOpen={orderingOpen}
              dish={dish}
              basePrice={basePrice}
              onAddToCart={handleAddToCart}
              remainingSharedStock={getRemainingDishStock(cartItems, dish)}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
