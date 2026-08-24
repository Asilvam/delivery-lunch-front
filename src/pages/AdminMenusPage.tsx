import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PublishIcon from "@mui/icons-material/Publish";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import TodayIcon from "@mui/icons-material/Today";
import axios from "axios";
import Swal from "sweetalert2";
import AdminNavigation from "../components/admin/AdminNavigation";
import MenuEditorDialog from "../components/admin/MenuEditorDialog";
import { useAuth } from "../hooks/useAuth";
import {
  archiveAdminMenu,
  copyAdminMenu,
  createAdminMenu,
  deleteAdminMenu,
  fetchAdminMenus,
  publishAdminMenu,
  updateAdminMenu,
} from "../data/services/adminMenuApi.service";
import type {
  AdminMenu,
  AdminMenuInput,
  AdminMenuStatus,
} from "../types/adminMenu";

interface EditorState {
  date: string;
  menu?: AdminMenu;
}

const STATUS_CONFIG: Record<
  AdminMenuStatus,
  { label: string; color: "default" | "success" | "warning" }
> = {
  draft: { label: "Borrador", color: "warning" },
  published: { label: "Publicado", color: "success" },
  archived: { label: "Archivado", color: "default" },
};

const todayIso = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" });

const parseIsoDate = (value: string) => new Date(`${value}T12:00:00`);

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (value: string, days: number) => {
  const date = parseIsoDate(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
};

const startOfWeek = (value: string) => {
  const date = parseIsoDate(value);
  const daysFromMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysFromMonday);
  return toIsoDate(date);
};

const formatDay = (value: string) =>
  parseIsoDate(value).toLocaleDateString("es-CL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

const apiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? "No se pudo completar la operación.";
  }
  return "No se pudo completar la operación.";
};

export default function AdminMenusPage() {
  const { token } = useAuth();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayIso()));
  const [menus, setMenus] = useState<AdminMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  const weekEnd = weekDays[6];
  const menuByDate = useMemo(
    () => new Map(menus.map((menu) => [menu.fecha, menu])),
    [menus],
  );
  const defaultCreateDate =
    weekDays.find((date) => !menuByDate.has(date)) ?? addDays(weekEnd, 1);

  const loadMenus = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setMenus(await fetchAdminMenus(token, weekStart, weekEnd));
    } catch (loadError) {
      setError(apiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [token, weekEnd, weekStart]);

  useEffect(() => {
    void loadMenus();
  }, [loadMenus]);

  const upsertMenu = (updated: AdminMenu) => {
    setMenus((current) => {
      const exists = current.some((menu) => menu._id === updated._id);
      return exists
        ? current.map((menu) => (menu._id === updated._id ? updated : menu))
        : [...current, updated].sort((a, b) => a.fecha.localeCompare(b.fecha));
    });
  };

  const handleSave = async (input: AdminMenuInput) => {
    if (!token) return;
    if (!editor?.menu && menus.some((menu) => menu.fecha === input.fecha)) {
      throw new Error("Ya existe un menú para esa fecha.");
    }

    try {
      const saved = editor?.menu
        ? await updateAdminMenu(token, editor.menu._id, {
            ensalada: input.ensalada,
            pan: input.pan,
            postre: input.postre,
            status: input.status,
            platos: input.platos,
          })
        : await createAdminMenu(token, input);
      upsertMenu(saved);
      setEditor(null);
      await Swal.fire({
        icon: "success",
        title: editor?.menu ? "Cambios guardados" : "Borrador creado",
        text: editor?.menu
          ? "El menú se actualizó correctamente."
          : "Revísalo y publícalo cuando esté listo.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (saveError) {
      throw new Error(apiErrorMessage(saveError));
    }
  };

  const handlePublish = async (menu: AdminMenu) => {
    if (!token) return;
    const result = await Swal.fire({
      title: "¿Publicar este menú?",
      text: "Quedará visible para los clientes en la fecha seleccionada.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Publicar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d81b60",
    });
    if (!result.isConfirmed) return;

    setActionId(menu._id);
    try {
      upsertMenu(await publishAdminMenu(token, menu._id));
    } catch (publishError) {
      setError(apiErrorMessage(publishError));
    } finally {
      setActionId(null);
    }
  };

  const handleArchive = async (menu: AdminMenu) => {
    if (!token) return;
    const result = await Swal.fire({
      title: "¿Archivar menú?",
      text: "Dejará de estar visible para los clientes.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Archivar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    setActionId(menu._id);
    try {
      upsertMenu(await archiveAdminMenu(token, menu._id));
    } catch (archiveError) {
      setError(apiErrorMessage(archiveError));
    } finally {
      setActionId(null);
    }
  };

  const handleCopy = async (menu: AdminMenu) => {
    if (!token) return;
    const result = await Swal.fire({
      title: "Duplicar menú",
      input: "date",
      inputLabel: "Fecha del nuevo menú",
      inputValue: addDays(menu.fecha, 1),
      showCancelButton: true,
      confirmButtonText: "Duplicar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => (!value ? "Selecciona una fecha" : undefined),
    });
    if (!result.isConfirmed || !result.value) return;

    setActionId(menu._id);
    try {
      const copied = await copyAdminMenu(token, menu._id, result.value as string);
      if (copied.fecha >= weekStart && copied.fecha <= weekEnd) upsertMenu(copied);
      await Swal.fire({
        icon: "success",
        title: "Menú duplicado",
        text: `Se creó un borrador para el ${copied.fecha}.`,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (copyError) {
      setError(apiErrorMessage(copyError));
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (menu: AdminMenu) => {
    if (!token) return;
    const result = await Swal.fire({
      title: "¿Eliminar borrador?",
      text: "Se eliminarán también todos sus platos. Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d32f2f",
    });
    if (!result.isConfirmed) return;

    setActionId(menu._id);
    try {
      await deleteAdminMenu(token, menu._id);
      setMenus((current) => current.filter((item) => item._id !== menu._id));
    } catch (deleteError) {
      setError(apiErrorMessage(deleteError));
    } finally {
      setActionId(null);
    }
  };

  return (
    <>
      <AdminNavigation />
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          gap={2}
          mb={3}
        >
          <Box flexGrow={1}>
            <Typography variant="h4" fontWeight={800}>
              Menús
            </Typography>
            <Typography color="text.secondary">
              Prepara, revisa y publica la oferta de cada día.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setEditor({ date: defaultCreateDate })}
            size="large"
          >
            Crear menú
          </Button>
        </Box>

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              py: "12px !important",
            }}
          >
            <Tooltip title="Semana anterior">
              <IconButton onClick={() => setWeekStart(addDays(weekStart, -7))}>
                <ChevronLeftIcon />
              </IconButton>
            </Tooltip>
            <Box textAlign="center">
              <Typography fontWeight={800} textTransform="capitalize">
                {formatDay(weekStart)} — {formatDay(weekEnd)}
              </Typography>
              <Button
                size="small"
                startIcon={<TodayIcon />}
                onClick={() => setWeekStart(startOfWeek(todayIso()))}
              >
                Semana actual
              </Button>
            </Box>
            <Tooltip title="Semana siguiente">
              <IconButton onClick={() => setWeekStart(addDays(weekStart, 7))}>
                <ChevronRightIcon />
              </IconButton>
            </Tooltip>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {weekDays.map((date) => {
              const menu = menuByDate.get(date);
              if (!menu) {
                return (
                  <Grid key={date} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <Card
                      variant="outlined"
                      sx={{ height: "100%", borderStyle: "dashed", bgcolor: "rgba(255,255,255,.55)" }}
                    >
                      <CardContent sx={{ minHeight: 180, display: "grid", placeItems: "center" }}>
                        <Box textAlign="center">
                          <Typography fontWeight={800} textTransform="capitalize">
                            {formatDay(date)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" mb={2}>
                            Sin menú programado
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => setEditor({ date })}
                          >
                            Crear
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              }

              const status = menu.status ?? "published";
              const statusConfig = STATUS_CONFIG[status];
              const stock = menu.platos.reduce((sum, dish) => sum + dish.stock, 0);
              const busy = actionId === menu._id;

              return (
                <Grid key={date} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      borderColor: status === "published" ? "success.light" : "divider",
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box display="flex" justifyContent="space-between" gap={1} mb={2}>
                        <Box>
                          <Typography fontWeight={800} textTransform="capitalize">
                            {formatDay(date)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {date}
                          </Typography>
                        </Box>
                        <Chip
                          label={statusConfig.label}
                          color={statusConfig.color}
                          size="small"
                        />
                      </Box>
                      <Stack spacing={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <RestaurantMenuIcon color="primary" fontSize="small" />
                          <Typography variant="body2" fontWeight={700}>
                            {menu.platos.length} {menu.platos.length === 1 ? "plato" : "platos"}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Stock total: {stock}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {menu.platos.map((dish) => dish.nombre).join(" · ")}
                        </Typography>
                      </Stack>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2, flexWrap: "wrap", gap: 0.5 }}>
                      <Button
                        size="small"
                        startIcon={<EditOutlinedIcon />}
                        onClick={() => setEditor({ date, menu })}
                        disabled={busy}
                      >
                        Editar
                      </Button>
                      <Tooltip title="Duplicar en otra fecha">
                        <IconButton
                          size="small"
                          onClick={() => void handleCopy(menu)}
                          disabled={busy}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {status === "published" ? (
                        <Tooltip title="Archivar y ocultar a clientes">
                          <IconButton
                            size="small"
                            onClick={() => void handleArchive(menu)}
                            disabled={busy}
                          >
                            <ArchiveOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Button
                          size="small"
                          startIcon={<PublishIcon />}
                          onClick={() => void handlePublish(menu)}
                          disabled={busy}
                        >
                          Publicar
                        </Button>
                      )}
                      {status === "draft" && (
                        <Tooltip title="Eliminar definitivamente">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => void handleDelete(menu)}
                            disabled={busy}
                            sx={{ ml: "auto" }}
                          >
                            {busy ? <CircularProgress size={18} /> : <DeleteOutlineIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      {editor && token && (
        <MenuEditorDialog
          key={editor.menu?._id ?? editor.date}
          token={token}
          menu={editor.menu}
          initialDate={editor.date}
          onClose={() => setEditor(null)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
