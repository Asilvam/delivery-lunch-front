// src/components/DishCard.tsx
import { useMemo, useState } from 'react';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Button,
    CardActions,
    Chip,
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import type { DailyMenuIncludes, Dish, DishSelectionVisibility, DishSelections } from '../types/menu';
import styles from './DishCard.module.css';

interface DishCardProps {
    dish: Dish;
    dailyIncludes: DailyMenuIncludes;
    onAddToCart: (dish: Dish, selections: DishSelections, visibility: DishSelectionVisibility) => void;
    remainingSharedStock?: number;
}

export const DishCard = ({ dish, dailyIncludes, onAddToCart, remainingSharedStock }: DishCardProps) => {
    const defaultImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop';
    const isHipo = dish.isHipo === true;
    const isSoldOut = dish.stock === 0;
    const isCartStockDepleted = typeof remainingSharedStock === 'number' && remainingSharedStock === 0 && !isSoldOut;
    const effectiveStock = typeof remainingSharedStock === 'number' ? remainingSharedStock : dish.stock;
    const isLowStock = typeof effectiveStock === 'number' && effectiveStock > 0 && effectiveStock <= 5;
    const proteinOptions = useMemo(() => dish.proteinOptions ?? [], [dish.proteinOptions]);
    const saladOptions = useMemo(() => dailyIncludes.salad.options, [dailyIncludes.salad.options]);
    const dessertOptions = useMemo(() => dailyIncludes.dessert.options, [dailyIncludes.dessert.options]);

    const [selectedProtein, setSelectedProtein] = useState(() => isHipo ? '' : (proteinOptions[0] ?? ''));
    const [selectedSalad, setSelectedSalad] = useState(() => dailyIncludes.salad.options[0] ?? '');
    const [selectedDessert, setSelectedDessert] = useState(() => dailyIncludes.dessert.options[0] ?? '');

    const visibility: DishSelectionVisibility = {
        protein: proteinOptions.length > 1,
        salad: !isHipo && saladOptions.length > 1,
        dessert: dessertOptions.length > 1,
    };

    const isHipoProteinMissing = isHipo && visibility.protein && !selectedProtein;
    const isActionDisabled = isSoldOut || isCartStockDepleted || isHipoProteinMissing;
    const actionLabel = isSoldOut
        ? 'Agotado'
        : isCartStockDepleted
            ? 'Sin cupo en tu pedido'
            : isHipoProteinMissing
                ? 'Elige tu proteína'
                : 'Agregar al pedido';

    const hasCustomizations = visibility.protein || visibility.salad || visibility.dessert;
    const selectionChips = [
        selectedProtein ? `🍗 ${selectedProtein}` : null,
        isHipo ? null : `🥗 ${selectedSalad}`,
        `🥖 ${dailyIncludes.bread}`,
        `🍮 ${selectedDessert}`,
    ].filter((value): value is string => Boolean(value));

    return (
        <Card className={styles.card}>
            {/* Image with gradient overlay */}
            <Box className={styles.imageWrapper}>
                <Box className={styles.badgeGroup}>
                    {isHipo && (
                        <Chip
                            label="Hipocalórico"
                            size="small"
                            className={`${styles.badgeBase} ${styles.badgeHipo}`}
                        />
                    )}
                    {isSoldOut && (
                        <Chip
                            label="Agotado"
                            size="small"
                            className={`${styles.badgeBase} ${styles.badgeSoldOut}`}
                        />
                    )}
                    {!isSoldOut && isCartStockDepleted && (
                        <Chip
                            label="Sin cupo en tu pedido"
                            size="small"
                            className={`${styles.badgeBase} ${styles.badgeNoCupo}`}
                        />
                    )}
                    {!isSoldOut && !isCartStockDepleted && isLowStock && (
                        <Chip
                            label={`Quedan pocos platos${effectiveStock ? ` (${effectiveStock})` : ''}`}
                            size="small"
                            className={`${styles.badgeBase} ${styles.badgeLowStock}`}
                        />
                    )}
                </Box>

                <CardMedia
                    component="img"
                    height="200"
                    image={dish.imageUrl || defaultImage}
                    alt={dish.name}
                    className={styles.dishImage}
                    onError={(event) => {
                        const imageElement = event.currentTarget;
                        if (imageElement.src !== defaultImage) {
                            imageElement.onerror = null;
                            imageElement.src = defaultImage;
                        }
                    }}
                />

                {/* Gradient overlay */}
                <Box className={styles.imageGradient} />

                {/* Price badge on image */}
                <Box className={styles.priceBadge}>
                    <Typography
                        variant="body1"
                        color="primary.main"
                        className={styles.priceText}
                    >
                        ${dish.price.toLocaleString('es-CL')}
                    </Typography>
                </Box>
            </Box>

            <CardContent className={styles.cardContent}>
                <Typography
                    variant="h6"
                    color="text.primary"
                    className={styles.dishName}
                >
                    {dish.name}
                </Typography>

                <Box className={`${styles.chipsRow} ${hasCustomizations ? styles.chipsRowWithCustomizations : ''}`}>
                    {selectionChips.map((label) => (
                        <Chip
                            key={label}
                            label={label}
                            size="small"
                            className={styles.selectionChip}
                        />
                    ))}
                </Box>

                {hasCustomizations && (
                    <Box className={styles.customizationBox}>
                        <Typography variant="caption" color="primary.dark" className={styles.customizationLabel}>
                            Personaliza tu menú
                        </Typography>

                        {visibility.protein && (
                            <FormControl fullWidth size="small" disabled={isSoldOut}>
                                <InputLabel id={`protein-label-${dish.id}`}>Proteína</InputLabel>
                                <Select
                                    labelId={`protein-label-${dish.id}`}
                                    value={selectedProtein}
                                    label="Proteína"
                                    onChange={(event) => setSelectedProtein(event.target.value)}
                                    className={styles.selectControl}
                                >
                                    {proteinOptions.map((option) => (
                                        <MenuItem key={option} value={option}>{option}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        {visibility.salad && (
                            <FormControl fullWidth size="small" disabled={isSoldOut}>
                                <InputLabel id={`salad-label-${dish.id}`}>Ensalada</InputLabel>
                                <Select
                                    labelId={`salad-label-${dish.id}`}
                                    value={selectedSalad}
                                    label="Ensalada"
                                    onChange={(event) => setSelectedSalad(event.target.value)}
                                    className={styles.selectControl}
                                >
                                    {saladOptions.map((option) => (
                                        <MenuItem key={option} value={option}>{option}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        {visibility.dessert && (
                            <FormControl fullWidth size="small" disabled={isSoldOut}>
                                <InputLabel id={`dessert-label-${dish.id}`}>Postre</InputLabel>
                                <Select
                                    labelId={`dessert-label-${dish.id}`}
                                    value={selectedDessert}
                                    label="Postre"
                                    onChange={(event) => setSelectedDessert(event.target.value)}
                                    className={styles.selectControl}
                                >
                                    {dessertOptions.map((option) => (
                                        <MenuItem key={option} value={option}>{option}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>
                )}
            </CardContent>

            <CardActions className={styles.cardActions}>
                <Button
                    variant="contained"
                    startIcon={<AddShoppingCartIcon />}
                    color="primary"
                    fullWidth
                    disabled={isActionDisabled}
                    onClick={() => onAddToCart(
                        dish,
                        isHipo
                            ? {
                                ...(selectedProtein ? { protein: selectedProtein } : {}),
                                dessert: selectedDessert,
                            }
                            : {
                                ...(selectedProtein ? { protein: selectedProtein } : {}),
                                salad: selectedSalad,
                                dessert: selectedDessert,
                            },
                        visibility,
                    )}
                    className={styles.addButton}
                >
                    {actionLabel}
                </Button>
            </CardActions>
        </Card>
    );
};
