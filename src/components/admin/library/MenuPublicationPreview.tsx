import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { cloudinaryImage } from "../../../shared/utils/images/cloudinary";

export interface PreviewDish {
  id: string;
  nombre: string;
  descripcion?: string;
  imagenUrl?: string;
  precio: number;
  stock: number;
  esHipo?: boolean;
  opciones?: string[];
}
export default function MenuPublicationPreview({
  fecha,
  precioBase,
  includes,
  dishes,
  onClose,
}: {
  fecha: string;
  precioBase: number;
  includes: string;
  dishes: PreviewDish[];
  onClose: () => void;
}) {
  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="menu-preview-title"
    >
      <DialogTitle id="menu-preview-title">
        Vista previa del menú · {fecha.split("-").reverse().join("/")}
      </DialogTitle>
      <DialogContent dividers>
        <Typography
          variant="h5"
          fontWeight={800}
          color="primary.dark"
          sx={{ mb: 1 }}
        >
          Menú del día · ${precioBase.toLocaleString("es-CL")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {includes}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "1fr 1fr 1fr",
            },
            gap: 2,
          }}
        >
          {dishes.map((dish) => (
            <Card key={dish.id} variant="outlined">
              <CardMedia
                component="img"
                image={
                  dish.imagenUrl
                    ? cloudinaryImage(dish.imagenUrl, 480)
                    : undefined
                }
                height="160"
                alt={dish.nombre}
              />
              <CardContent>
                <Typography fontWeight={700}>{dish.nombre}</Typography>
                {dish.descripcion && (
                  <Typography variant="body2" color="text.secondary">
                    {dish.descripcion}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  {dish.stock} porciones
                </Typography>
                {dish.precio !== precioBase && (
                  <Typography fontWeight={800} color="primary.main">
                    ${dish.precio.toLocaleString("es-CL")}
                  </Typography>
                )}
                {dish.esHipo && (
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}
                  >
                    {dish.opciones?.map((protein) => (
                      <Chip key={protein} label={protein} size="small" />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Volver al menú</Button>
      </DialogActions>
    </Dialog>
  );
}
