import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useCustomerSession } from '../hooks/useCustomerSession';

export function GoogleCustomerAccess({disabled = false}: {disabled?: boolean}) {
  const { session, signIn, signOut } = useCustomerSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (session) return <Alert severity="success" sx={{mb: 2}}>
    Conectado como {session.customer.email}
    <Button size="small" disabled={disabled} onClick={signOut}>Cambiar cuenta</Button>
  </Alert>;
  return <Box sx={{mb: 2}}>
    <Typography sx={{mb: 1}}>Continúa con Google para enviar tu pedido. Tu carrito se conservará.</Typography>
    {error && <Alert severity="error" sx={{mb: 1}}>{error}</Alert>}
    {!clientId ? <Alert severity="warning">El acceso con Google no está configurado. Contacta al local.</Alert> :
      <GoogleOAuthProvider clientId={clientId} onScriptLoadError={() => setError('No pudimos cargar Google. Revisa tu conexión y vuelve a abrir este paso.')}>
        {loading ? <Box role="status"><CircularProgress size={20}/> Verificando tu cuenta…</Box> :
          <GoogleLogin text="continue_with" onError={() => setError('No pudimos iniciar sesión. Puedes reintentarlo sin perder tu pedido.')}
            onSuccess={async response => {
              if (!response.credential) { setError('Google no devolvió una credencial. Intenta nuevamente.'); return; }
              setLoading(true); setError('');
              try { await signIn(response.credential); } catch { setError('No pudimos verificar tu cuenta. Intenta nuevamente; tu pedido sigue guardado.'); }
              finally { setLoading(false); }
            }} />}
      </GoogleOAuthProvider>}
  </Box>;
}
