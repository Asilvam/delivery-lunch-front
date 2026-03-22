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

interface DishCardProps {
    dish: Dish;
    dailyIncludes: DailyMenuIncludes;
    onAddToCart: (dish: Dish, selections: DishSelections, visibility: DishSelectionVisibility) => void;
}

export const DishCard = ({ dish, dailyIncludes, onAddToCart }: DishCardProps) => {
    const defaultImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop';
    const isHipo = dish.isHipo === true;
    const isSoldOut = dish.stock === 0;
    const isLowStock = typeof dish.stock === 'number' && dish.stock > 0 && dish.stock <= 5;
    const proteinOptions = useMemo(() => dish.proteinOptions ?? [], [dish.proteinOptions]);
    const saladOptions = useMemo(() => dailyIncludes.salad.options, [dailyIncludes.salad.options]);
    const dessertOptions = useMemo(() => dailyIncludes.dessert.options, [dailyIncludes.dessert.options]);

    const [selectedProtein, setSelectedProtein] = useState(() => proteinOptions[0] ?? '');
    const [selectedSalad, setSelectedSalad] = useState(() => dailyIncludes.salad.options[0] ?? '');
    const [selectedDessert, setSelectedDessert] = useState(() => dailyIncludes.dessert.options[0] ?? '');

    const visibility: DishSelectionVisibility = {
        protein: proteinOptions.length > 1,
        salad: !isHipo && saladOptions.length > 1,
        dessert: dessertOptions.length > 1,
    };

    const hasCustomizations = visibility.protein || visibility.salad || visibility.dessert;
    const selectionChips = [
        selectedProtein ? `🍗 ${selectedProtein}` : null,
        isHipo ? null : `🥗 ${selectedSalad}`,
        `🥖 ${dailyIncludes.bread}`,
        `🍮 ${selectedDessert}`,
    ].filter((value): value is string => Boolean(value));

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 4,
                boxShadow: '0 2px 16px rgba(216, 27, 96, 0.10)',
                overflow: 'hidden',
                border: '1px solid rgba(216, 27, 96, 0.08)',
                '&:hover': {
                    boxShadow: '0 12px 40px rgba(216, 27, 96, 0.22)',
                },
            }}
        >
            {/* Image with gradient overlay */}
            <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 2, display: 'grid', gap: 0.75 }}>
                    {isSoldOut && (
                        <Chip
                            label="Agotado"
                            size="small"
                            sx={{
                                bgcolor: 'rgba(183, 28, 28, 0.92)',
                                color: 'common.white',
                                fontWeight: 800,
                                borderRadius: '999px',
                                backdropFilter: 'blur(6px)',
                            }}
                        />
                    )}
                    {!isSoldOut && isLowStock && (
                        <Chip
                            label={`Quedan pocos platos${dish.stock ? ` (${dish.stock})` : ''}`}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(255, 143, 0, 0.92)',
                                color: '#3e2723',
                                fontWeight: 800,
                                borderRadius: '999px',
                                backdropFilter: 'blur(6px)',
                            }}
                        />
                    )}
                </Box>

                <CardMedia
                    component="img"
                    height="200"
                    image={dish.imageUrl || defaultImage}
                    alt={dish.name}
                    sx={{ display: 'block', objectFit: 'cover', transition: 'transform 0.4s ease', '&:hover': { transform: 'scale(1.04)' } }}
                    onError={(event) => {
                        const imageElement = event.currentTarget;
                        if (imageElement.src !== defaultImage) {
                            imageElement.onerror = null;
                            imageElement.src = defaultImage;
                        }
                    }}
                />
                {/* Gradient overlay */}
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '55%',
                        background: 'linear-gradient(to top, rgba(26,10,46,0.55) 0%, transparent 100%)',
                        pointerEvents: 'none',
                    }}
                />
                {/* Price badge on image */}
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 10,
                        right: 12,
                        bgcolor: 'white',
                        borderRadius: 99,
                        px: 1.5,
                        py: 0.4,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                    }}
                >
                    <Typography variant="body1" fontWeight={800} color="primary.main" sx={{ lineHeight: 1.4, fontSize: '1rem' }}>
                        ${dish.price.toLocaleString('es-CL')}
                    </Typography>
                </Box>
            </Box>

            <CardContent sx={{ flexGrow: 1, pt: 2, px: 2.5, pb: 1 }}>
                <Typography
                    variant="h6"
                    fontWeight={700}
                    color="text.primary"
                    sx={{ mb: 1.5, lineHeight: 1.3, fontSize: '1.05rem' }}
                >
                    {dish.name}
                </Typography>

                <Box sx={{ display: 'flex', gap: 0.7, flexWrap: 'wrap', mb: hasCustomizations ? 2 : 0 }}>
                    {selectionChips.map((label) => (
                        <Chip
                            key={label}
                            label={label}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(216,27,96,0.07)',
                                color: 'primary.dark',
                                fontWeight: 500,
                                border: '1px solid rgba(216,27,96,0.15)',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                            }}
                        />
                    ))}
                </Box>

                {hasCustomizations && (
                    <Box
                        sx={{
                            mt: 0.5,
                            display: 'grid',
                            gap: 1,
                            p: 1.5,
                            borderRadius: 3,
                            bgcolor: 'rgba(255,255,255,0.72)',
                            border: '1px solid rgba(216,27,96,0.1)',
                        }}
                    >
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.dark', textAlign: 'left' }}>
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
                                    sx={{ borderRadius: 2.5, bgcolor: 'white' }}
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
                                    sx={{ borderRadius: 2.5, bgcolor: 'white' }}
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
                                    sx={{ borderRadius: 2.5, bgcolor: 'white' }}
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

            <CardActions sx={{ px: 2.5, pb: 2.5, pt: 0.5 }}>
                <Button
                    variant="contained"
                    startIcon={<AddShoppingCartIcon />}
                    color="primary"
                    fullWidth
                    disabled={isSoldOut}
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
                    sx={{
                        borderRadius: 3,
                        py: 1.1,
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #d81b60 0%, #f06292 100%)',
                        boxShadow: '0 4px 14px rgba(216,27,96,0.28)',
                        '&.Mui-disabled': {
                            color: 'rgba(255,255,255,0.85)',
                            background: 'linear-gradient(135deg, #b0b7c3 0%, #9098a5 100%)',
                            boxShadow: 'none',
                        },
                        '&:hover': {
                            background: 'linear-gradient(135deg, #a00037 0%, #d81b60 100%)',
                            boxShadow: '0 6px 20px rgba(216,27,96,0.38)',
                        },
                    }}
                >
                    {isSoldOut ? 'Agotado' : 'Agregar al pedido'}
                </Button>
            </CardActions>
        </Card>
    );
};