import { useId, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import type {
  Dish,
  DishSelectionVisibility,
  DishSelections,
} from "../types/menu";
import { MENU_DESSERT, MENU_PRICE, MENU_SALAD } from "../domain/menu/menuOffer";
import styles from "./DishCard.module.css";

interface Props {
  dish: Dish;
  basePrice?: number;
  onAddToCart: (
    dish: Dish,
    selections: DishSelections,
    visibility: DishSelectionVisibility,
  ) => void;
  remainingSharedStock?: number;
}

const TITLES: Record<string, [string, string]> = {
  "Pollo asado con arroz y papas fritas": [
    "Pollo asado",
    "Con arroz y papas fritas",
  ],
  "Pollo asado con fideos con salsa o crema": [
    "Pollo asado con fideos",
    "Salsa o crema del día",
  ],
  "Cerdo mongoliano con arroz": ["Cerdo mongoliano", "Acompañado de arroz"],
  "Cerdo mongoliano con fideos": ["Cerdo mongoliano", "Acompañado de fideos"],
};

export function DishCard({
  dish,
  basePrice = MENU_PRICE,
  onAddToCart,
  remainingSharedStock,
}: Props) {
  const proteinId = useId();
  const [protein, setProtein] = useState("");
  const isHipo = dish.isHipo === true;
  const options = dish.proteinOptions ?? [];
  const stock = remainingSharedStock ?? dish.stock;
  const soldOut = dish.stock === 0;
  const cartLimit = !soldOut && stock === 0;
  const needsProtein = isHipo && !options.includes(protein);
  const disabled = soldOut || cartLimit || needsProtein;
  const [title, subtitle] = isHipo
    ? ["Menú hipocalórico", ""]
    : (TITLES[dish.name] ?? [dish.name, ""]);
  const imageFallback =
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop";

  return (
    <Card className={styles.card} component="article" aria-label={title}>
      <Box className={styles.imageWrapper}>
        <Box className={styles.badgeGroup}>
          {isHipo && (
            <Chip
              label="Hipocalórico"
              size="small"
              className={`${styles.badgeBase} ${styles.badgeHipo}`}
            />
          )}
          {soldOut ? (
            <Chip
              label="Agotado"
              size="small"
              className={`${styles.badgeBase} ${styles.badgeSoldOut}`}
            />
          ) : cartLimit ? (
            <Chip
              label="Todo el stock está en tu pedido"
              size="small"
              className={`${styles.badgeBase} ${styles.badgeNoCupo}`}
            />
          ) : (
            typeof stock === "number" &&
            stock > 0 &&
            stock <= 5 && (
              <Chip
                label={`Últimas ${stock} ${stock === 1 ? "porción" : "porciones"}`}
                size="small"
                className={`${styles.badgeBase} ${styles.badgeLowStock}`}
              />
            )
          )}
        </Box>
        <CardMedia
          component="img"
          height="180"
          image={dish.imageUrl || imageFallback}
          alt={dish.name}
          loading="lazy"
          className={styles.dishImage}
          onError={(event) => {
            const image = event.currentTarget;
            if (image.src !== imageFallback) {
              image.onerror = null;
              image.src = imageFallback;
            }
          }}
        />
      </Box>
      <CardContent className={styles.cardContent}>
        <Box className={styles.dishHeading}>
          <Typography component="h2" variant="h6" className={styles.dishName}>
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              className={styles.dishSubtitle}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {isHipo && (
          <FormControl
            fullWidth
            sx={{ width: "100%", minWidth: 0 }}
            size="small"
            required
            disabled={soldOut || cartLimit || options.length === 0}
            className={styles.proteinControl}
          >
            <InputLabel shrink id={`${proteinId}-label`}>
              Proteína
            </InputLabel>
            <Select
              labelId={`${proteinId}-label`}
              id={proteinId}
              value={options.includes(protein) ? protein : ""}
              label="Proteína"
              fullWidth
              displayEmpty
              notched
              renderValue={(value) => value || "Selecciona una proteína"}
              onChange={(event) => setProtein(event.target.value)}
            >
              {options.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            {options.length === 0 && (
              <FormHelperText>
                Sin proteínas disponibles por el momento.
              </FormHelperText>
            )}
          </FormControl>
        )}
      </CardContent>
      <CardActions disableSpacing className={styles.cardActions}>
        {dish.price !== basePrice && (
          <Typography
            color="primary.main"
            className={styles.priceText}
            aria-label={`Precio especial: $${dish.price.toLocaleString("es-CL")}`}
          >
            ${dish.price.toLocaleString("es-CL")}
          </Typography>
        )}
        <Button
          variant="contained"
          startIcon={<AddShoppingCartIcon />}
          disabled={disabled}
          aria-label={disabled ? undefined : `Agregar ${dish.name} al pedido`}
          className={styles.addButton}
          onClick={() =>
            onAddToCart(
              dish,
              {
                ...(isHipo ? { protein } : {}),
                salad: MENU_SALAD,
                dessert: MENU_DESSERT,
              },
              { protein: isHipo, salad: false, dessert: false },
            )
          }
        >
          {soldOut
            ? "Agotado"
            : cartLimit
              ? "Stock máximo en tu pedido"
              : needsProtein
                ? "Elige tu proteína"
                : "Agregar"}
        </Button>
      </CardActions>
    </Card>
  );
}
