// src/pages/LoginPage.tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export default function LoginPage() {
  const { login, role } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post<{ access_token: string }>(
        `${BASE_URL}/auth/login`,
        { username, password },
        { timeout: 10000 },
      );
      login(res.data.access_token);

      // Decode role from the new token and redirect accordingly
      const payload = res.data.access_token.split(".")[1];
      const decoded = JSON.parse(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
      ) as { role?: string };
      navigate(decoded.role === "kitchen" ? "/cocina" : "/admin");
    } catch {
      setError("Usuario o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  // If already authenticated, redirect immediately
  if (role) {
    navigate(role === "kitchen" ? "/cocina" : "/admin", { replace: true });
    return null;
  }

  return (
    <Container maxWidth="xs" sx={{ mt: 12 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700} textAlign="center" mb={3}>
          Acceso
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          display="flex"
          flexDirection="column"
          gap={2}
        >
          <TextField
            label="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            fullWidth
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            fullWidth
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 1 }}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Ingresar"
            )}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
