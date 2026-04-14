import { createTheme } from '@mui/material';

export const appTheme = createTheme({
  palette: {
    primary: {
      main: '#d81b60',
      light: '#f06292',
      dark: '#9c0f45',
      contrastText: '#fff',
    },
    secondary: {
      main: '#f48fb1',
      light: '#fce4ec',
      dark: '#bf5f82',
      contrastText: '#000',
    },
    background: { default: '#fdf2f8', paper: '#ffffff' },
    text: { primary: '#1a0a2e', secondary: '#6b5b73' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: { fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700 },
    body1: { fontSize: '0.95rem' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 500 } },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRadius: '20px 0 0 20px' },
      },
    },
  },
});
