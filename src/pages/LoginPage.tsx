import { PageLayout, BrandHeader } from "../components/layout/PageLayout";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import loginPhoto from "../assets/dishes/pollo-asado-arroz-papas.png";
import { brandColors as colors } from "../theme/brandColors";
// src/pages/LoginPage.tsx
import { useState, useRef, type FormEvent } from "react";
import {
  useNavigate,
  useLocation,
  Navigate,
  Link as RouterLink,
} from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export default function LoginPage() {
  const { login, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expired, setExpired] = useState(
    () => sessionStorage.getItem("staff-session-expired") === "1",
  );
  const destination = (userRole: string) => {
    const from = location.state?.from as string | undefined;
    const allowed =
      userRole === "admin" ? ["/admin", "/admin/menus", "/dashboard", "/cocina"] : ["/cocina"];
    return from && allowed.includes(from.split("?")[0])
      ? from
      : userRole === "kitchen"
        ? "/cocina"
        : "/admin";
  };

  const submitting = useRef(false);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    if (!username.trim() || !password) {
      setError("Completa tu usuario y contraseña.");
      return;
    }
    submitting.current = true;
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post<{ access_token: string }>(
        `${BASE_URL}/auth/login`,
        { username: username.trim(), password },
        { timeout: 10000 },
      );
      login(res.data.access_token);

      // Decode role from the new token and redirect accordingly
      const payload = res.data.access_token.split(".")[1];
      const decoded = JSON.parse(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
      ) as { role?: string };
      sessionStorage.removeItem("staff-session-expired");
      navigate(destination(decoded.role || "admin"), { replace: true });
    } catch (error) {
      setError(
        axios.isAxiosError(error) && error.response?.status === 401
          ? "Usuario o contraseña incorrectos"
          : "No pudimos conectar con el servidor. Intenta nuevamente.",
      );
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  // If already authenticated, redirect immediately
  if (role) {
    return <Navigate to={destination(role)} replace />;
  }

  return (
    <PageLayout
      header={
        <BrandHeader
          right={
            <Button
              component={RouterLink}
              to="/"
              startIcon={<ArrowBackRoundedIcon />}
              color="inherit"
              size="small"
            >
              Menú del día
            </Button>
          }
        />
      }
    >
      <Box
        sx={{ display: "flex", justifyContent: "center", py: { xs: 0, md: 2 } }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 940,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "0.95fr 1.05fr" },
            overflow: "hidden",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 8px 30px rgba(88,25,53,0.08)",
          }}
        >
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              flexDirection: "column",
              justifyContent: "flex-end",
              position: "relative",
              isolation: "isolate",
              minHeight: 480,
              p: 4,
              color: "white",
              backgroundColor: colors.raspberryDark,
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                zIndex: -2,
                backgroundImage: `url(${loginPhoto})`,
                backgroundSize: "cover",
                backgroundPosition: "48% center",
              },
              "&::after": {
                content: '""',
                position: "absolute",
                inset: 0,
                zIndex: -1,
                background:
                  "linear-gradient(180deg, rgba(26,10,46,0.04) 15%, rgba(26,10,46,0.85) 100%)",
              },
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 4,
                bgcolor: colors.rose,
                borderRadius: 4,
                mb: 2.5,
              }}
            />
            <Typography
              component="p"
              sx={{
                fontSize: "2.6rem",
                fontWeight: 800,
                lineHeight: 1.12,
                letterSpacing: "-0.04em",
                mb: 2,
              }}
            >
              Cada pedido,
              <br />
              bien atendido.
            </Typography>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.85)",
                maxWidth: 310,
                lineHeight: 1.7,
              }}
            >
              El cariño está en cada plato.
              <br />
              El orden comienza contigo.
            </Typography>
          </Box>

          <Box
            sx={{
              p: { xs: 3, sm: 5, md: 6 },
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                display: "grid",
                placeItems: "center",
                bgcolor: "secondary.light",
                color: "primary.dark",
                borderRadius: 3,
                mb: 3,
              }}
            >
              <LockOutlinedIcon />
            </Box>
            <Typography
              variant="overline"
              color="primary.dark"
              sx={{ fontWeight: 700, letterSpacing: "0.12em" }}
            >
              ACCESO DEL EQUIPO
            </Typography>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: "1.8rem", md: "2.1rem" },
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1.2,
                mt: 0.5,
                mb: 1.5,
              }}
            >
              Qué bueno verte.
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3, lineHeight: 1.7 }}
            >
              Ingresa para gestionar los pedidos o continuar en cocina.
            </Typography>

            {expired && (
              <Alert
                severity="info"
                closeText="Cerrar aviso"
                onClose={() => {
                  sessionStorage.removeItem("staff-session-expired");
                  setExpired(false);
                }}
                sx={{ mb: 2 }}
              >
                Tu sesión venció. Ingresa nuevamente para continuar.
              </Alert>
            )}
            {error && (
              <Alert severity="error" role="alert" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              aria-busy={loading}
              sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
            >
              <TextField
                label="Usuario"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                autoComplete="username"
                required
                fullWidth
                autoFocus
                disabled={loading}
                slotProps={{
                  htmlInput: { autoCapitalize: "none", spellCheck: false },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineRoundedIcon
                          sx={{ fontSize: 20, color: "text.secondary" }}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                autoComplete="current-password"
                required
                fullWidth
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon
                          sx={{ fontSize: 20, color: "text.secondary" }}
                        />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={
                            showPassword
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                          aria-pressed={showPassword}
                          disabled={loading}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setShowPassword((current) => !current)}
                          edge="end"
                          sx={{ minWidth: 44, minHeight: 44 }}
                        >
                          {showPassword ? (
                            <VisibilityOffOutlinedIcon fontSize="small" />
                          ) : (
                            <VisibilityOutlinedIcon fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                fullWidth
                endIcon={loading ? undefined : <ArrowForwardRoundedIcon />}
                sx={{ minHeight: 52, mt: 0.5 }}
              >
                {loading ? (
                  <>
                    <CircularProgress
                      size={18}
                      color="inherit"
                      sx={{ mr: 1 }}
                    />
                    Ingresando…
                  </>
                ) : (
                  "Entrar a mi panel"
                )}
              </Button>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 3, textAlign: "center", lineHeight: 1.7 }}
            >
              Administración y cocina, cada equipo en su espacio.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </PageLayout>
  );
}
