import { useMountedRef } from "../hooks/useMountedRef";
import { userToast } from "../utils/notifications";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useCustomerSession } from "../hooks/useCustomerSession";

export function GoogleCustomerAccess({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { session, signIn, signOut } = useCustomerSession();
  const [loading, setLoading] = useState(false);
  const mounted = useMountedRef();
  const verifying = useRef(false);
  const buttonContainer = useRef<HTMLDivElement>(null);
  const [buttonWidth, setButtonWidth] = useState<number>();

  useEffect(() => {
    const container = buttonContainer.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry.contentRect.width);
      if (width > 0) setButtonWidth(Math.min(width, 400));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [session]);

  const reportError = (title: string) => {
    if (mounted.current) void userToast.fire({ icon: "error", title });
  };
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (session)
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          columnGap: 1,
          rowGap: 0.5,
          p: 1.5,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <CheckCircleOutlineIcon color="success" fontSize="small" />
        <Box sx={{ flex: "1 1 160px", minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            Cuenta de Google
          </Typography>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ overflowWrap: "anywhere" }}
          >
            {session.customer.email}
          </Typography>
        </Box>
        <Button
          size="small"
          disabled={disabled}
          onClick={() => {
            signOut();
          }}
        >
          Cambiar cuenta
        </Button>
      </Box>
    );
  return (
    <Box ref={buttonContainer} sx={{ width: "100%", minWidth: 0 }}>
      {!clientId ? (
        <Alert severity="warning">
          El acceso con Google no está configurado. Contacta al local.
        </Alert>
      ) : (
        <GoogleOAuthProvider
          clientId={clientId}
          onScriptLoadError={() =>
            reportError(
              "No pudimos cargar Google. Revisa tu conexión y vuelve a abrir este paso.",
            )
          }
        >
          {loading ? (
            <Box
              role="status"
              sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}
            >
              <CircularProgress size={20} />
              <Typography variant="body2">Verificando tu cuenta…</Typography>
            </Box>
          ) : (
            <GoogleLogin
              text="continue_with"
              size="large"
              width={buttonWidth}
              onError={() =>
                reportError(
                  "No pudimos iniciar sesión. Puedes reintentarlo sin perder tu pedido.",
                )
              }
              onSuccess={async (response) => {
                if (disabled || !mounted.current || verifying.current) return;
                if (!response.credential) {
                  reportError(
                    "Google no devolvió una credencial. Intenta nuevamente.",
                  );
                  return;
                }
                verifying.current = true;
                setLoading(true);
                try {
                  await signIn(response.credential);
                } catch {
                  reportError(
                    "No pudimos verificar tu cuenta. Intenta nuevamente; tu pedido sigue guardado.",
                  );
                } finally {
                  verifying.current = false;
                  if (mounted.current) setLoading(false);
                }
              }}
            />
          )}
        </GoogleOAuthProvider>
      )}
    </Box>
  );
}
