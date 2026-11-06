import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { staffToast } from "../../../utils/notifications";
import {
  libraryError,
  saveLibraryDish,
  uploadDishPhoto,
  type LibraryDish,
  type LibraryDishInput,
} from "../../../data/services/dishLibraryApi.service";
import { cloudinaryImage } from "../../../shared/utils/images/cloudinary";
import { useMountedRef } from "../../../hooks/useMountedRef";

export default function LibraryDishEditor({
  dish,
  token,
  onClose,
  onSaved,
}: {
  dish?: LibraryDish;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const mounted = useMountedRef();
  const [input, setInput] = useState<LibraryDishInput>(() =>
    dish
      ? {
          nombre: dish.nombre,
          descripcion: dish.descripcion ?? "",
          categoria: dish.categoria,
          imagenUrl: dish.imagenUrl,
          imagenPublicId: dish.imagenPublicId,
          esHipo: dish.esHipo,
          opciones: dish.opciones,
          activo: dish.activo,
          notaInterna: dish.notaInterna ?? "",
        }
      : {
          nombre: "",
          descripcion: "",
          categoria: "",
          imagenUrl: "",
          imagenPublicId: "",
          esHipo: false,
          opciones: [],
          activo: true,
          notaInterna: "",
        },
  );
  const [proteins, setProteins] = useState(dish?.opciones.join(", ") ?? "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const change = (patch: Partial<LibraryDishInput>) => {
    setDirty(true);
    setInput((current) => ({ ...current, ...patch }));
  };
  const close = async () => {
    if (busy || uploading) return;
    onClose();
  };
  const upload = async (file?: File) => {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      void staffToast.fire({
        icon: "error",
        title: "Usa PNG, JPG o WebP de hasta 10 MB",
      });
      return;
    }
    setUploading(true);
    try {
      const result = await uploadDishPhoto(token, file);
      if (mounted.current)
        change({ imagenUrl: result.url, imagenPublicId: result.public_id });
    } catch (error) {
      if (mounted.current)
        void staffToast.fire({
          icon: "error",
          title: libraryError(error, "No pudimos subir la fotografía"),
        });
    } finally {
      if (mounted.current) setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };
  const options = proteins
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const valid =
    input.nombre.trim() &&
    input.categoria.trim() &&
    input.imagenUrl &&
    (!input.esHipo ||
      (options.length > 0 && new Set(options).size === options.length));
  const save = async () => {
    if (!valid || busy || uploading) return;
    setBusy(true);
    try {
      await saveLibraryDish(
        token,
        { ...input, opciones: input.esHipo ? options : [] },
        dish?._id,
      );
      if (mounted.current) {
        setDirty(false);
        onSaved();
      }
    } catch (error) {
      if (mounted.current)
        void staffToast.fire({
          icon: "error",
          title: libraryError(error, "No pudimos guardar el plato"),
        });
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <Dialog
      open
      onClose={(_, reason) => {
        if (!dirty || reason !== "backdropClick") void close();
      }}
      fullWidth
      maxWidth="sm"
      aria-labelledby="library-editor-title"
    >
      <DialogTitle id="library-editor-title">
        {dish ? "Editar plato" : "Nuevo plato"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Nombre completo del plato"
            value={input.nombre}
            onChange={(e) => change({ nombre: e.target.value })}
            required
            disabled={busy}
            slotProps={{ htmlInput: { maxLength: 160 } }}
          />
          <TextField
            label="Descripción breve"
            value={input.descripcion}
            onChange={(e) => change({ descripcion: e.target.value })}
            disabled={busy}
            multiline
            maxRows={3}
            slotProps={{ htmlInput: { maxLength: 300 } }}
          />
          <TextField
            label="Categoría"
            value={input.categoria}
            onChange={(e) => change({ categoria: e.target.value })}
            required
            disabled={busy}
            helperText="Por ejemplo: Pollo, Cerdo, Legumbres o Pastas."
            slotProps={{ htmlInput: { maxLength: 60 } }}
          />
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              p: 2,
            }}
          >
            {input.imagenUrl && (
              <Box
                component="img"
                src={cloudinaryImage(input.imagenUrl, 480)}
                alt={input.nombre || "Fotografía del plato"}
                sx={{
                  width: "100%",
                  height: 190,
                  objectFit: "cover",
                  borderRadius: 1,
                  mb: 1,
                }}
              />
            )}
            <input
              ref={fileInput}
              hidden
              type="file"
              accept="image/png,image/jpeg,image/webp"
              aria-label="Archivo de fotografía del plato"
              onChange={(e) => void upload(e.target.files?.[0])}
            />
            <Button
              variant="outlined"
              disabled={busy || uploading}
              onClick={() => fileInput.current?.click()}
              startIcon={uploading ? <CircularProgress size={16} /> : undefined}
            >
              {uploading
                ? "Subiendo fotografía…"
                : input.imagenUrl
                  ? "Cambiar fotografía"
                  : "Subir fotografía"}
            </Button>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mt: 1 }}
            >
              La fotografía se guarda en Cloudinary y se reutiliza al publicar
              el plato.
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={input.esHipo}
                disabled={busy}
                onChange={(e) => change({ esHipo: e.target.checked })}
              />
            }
            label="Menú hipocalórico con proteína a elección"
          />
          {input.esHipo && (
            <>
              <TextField
                label="Proteínas disponibles"
                value={proteins}
                disabled={busy}
                onChange={(e) => {
                  setDirty(true);
                  setProteins(e.target.value);
                }}
                helperText="Sepáralas por comas. Al crear el menú elegirás cuáles ofrecer ese día."
              />
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {options.map((p, i) => (
                  <Chip key={i} label={p} size="small" />
                ))}
              </Box>
            </>
          )}
          <TextField
            label="Nota interna"
            value={input.notaInterna}
            onChange={(e) => change({ notaInterna: e.target.value })}
            disabled={busy}
            helperText="Solo la ve el administrador."
            multiline
            maxRows={3}
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button disabled={busy || uploading} onClick={() => void close()}>
          {dirty ? "Descartar cambios" : "Cancelar"}
        </Button>
        <Button
          variant="contained"
          disabled={!valid || busy || uploading}
          onClick={() => void save()}
        >
          {busy ? "Guardando…" : "Guardar plato"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
