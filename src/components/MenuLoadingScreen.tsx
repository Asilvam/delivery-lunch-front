// src/components/MenuLoadingScreen.tsx
import { Box, CircularProgress, Typography } from '@mui/material';
import logoAs2 from '../assets/logoas_2.png';

const fadeInScale = `
  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.85);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

export function MenuLoadingScreen() {
  return (
    <>
      <style>{fadeInScale}</style>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 3,
        }}
      >
        <Box
          component="img"
          src={logoAs2}
          alt="Logo"
          sx={{
            width: { xs: 160, sm: 200 },
            objectFit: 'contain',
            animation: 'fadeInScale 0.6s ease-out both',
          }}
        />
        <CircularProgress color="primary" size={36} thickness={4} />
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: 500, letterSpacing: 0.3 }}
        >
          Preparando tu menú...
        </Typography>
      </Box>
    </>
  );
}
