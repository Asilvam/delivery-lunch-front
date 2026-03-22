// src/components/DishCard.tsx
import { Card, CardContent, CardMedia, Typography, Button, CardActions, Chip, Box, CardHeader } from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import type {Dish} from '../types/menu';

interface DishCardProps {
    dish: Dish;
    dailyIncludes: { salad: string; bread: string; dessert: string };
    onAddToCart: (dish: Dish) => void; // NUEVO: Función para agregar al carrito
}

export const DishCard = ({ dish, dailyIncludes, onAddToCart }: DishCardProps) => {
    const defaultImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop';

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 4, boxShadow: '0 4px 20px rgba(216, 27, 96, 0.15)', overflow: 'hidden' }}>
            <CardHeader
                title={<Typography variant="h6" fontWeight="bold" sx={{ minHeight: 64, color: 'primary.dark' }}>{dish.name}</Typography>}
                sx={{ pb: 1, pt: 2, px: 2 }}
            />
            <CardMedia
                component="img"
                height="200"
                image={dish.imageUrl || defaultImage}
                alt={dish.name}
                onError={(event) => {
                    const imageElement = event.currentTarget;
                    if (imageElement.src !== defaultImage) {
                        imageElement.onerror = null;
                        imageElement.src = defaultImage;
                    }
                }}
            />

            <CardContent sx={{ flexGrow: 1, pt: 2, px: 2 }}>
                {dish.hasSides !== false && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                        <Chip label={`🥗 ${dailyIncludes.salad}`} size="small" variant="outlined" color="secondary" sx={{ fontWeight: 500 }} />
                        <Chip label={`🥖 ${dailyIncludes.bread}`} size="small" variant="outlined" color="secondary" sx={{ fontWeight: 500 }} />
                        <Chip label={`🍮 ${dailyIncludes.dessert}`} size="small" variant="outlined" color="secondary" sx={{ fontWeight: 500 }} />
                    </Box>
                )}

                {dish.options && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {dish.options.map((opt, index) => (
                            <Chip key={index} label={opt} size="small" variant="filled" sx={{ bgcolor: 'grey.100' }} />
                        ))}
                    </Box>
                )}
            </CardContent>

            <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2.5, pt: 0 }}>
                <Typography variant="h5" color="primary.main" fontWeight="bold">
                    ${dish.price.toLocaleString('es-CL')}
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddShoppingCartIcon />}
                    color="primary"
                    onClick={() => onAddToCart(dish)} // NUEVO: Dispara la función al hacer clic
                    sx={{ borderRadius: 5, px: 3, py: 1, textTransform: 'none', fontSize: '1rem', fontWeight: 'bold' }}
                >
                    Agregar
                </Button>
            </CardActions>
        </Card>
    );
};