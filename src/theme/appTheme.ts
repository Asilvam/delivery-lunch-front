import { createTheme } from "@mui/material";
import { brandColors as colors } from "./brandColors";

export const appTheme = createTheme({
  palette: {
    primary: {
      main: colors.raspberry,
      light: colors.rose,
      dark: colors.raspberryDark,
      contrastText: "#fff",
    },
    secondary: {
      main: "#f48fb1",
      light: colors.blush,
      dark: "#bf5f82",
      contrastText: "#000",
    },
    success: { main: colors.success },
    warning: { main: colors.warning },
    error: { main: colors.error },
    info: { main: colors.info },
    divider: colors.border,
    background: { default: colors.background, paper: colors.surface },
    text: { primary: colors.ink, secondary: colors.muted },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: { fontWeight: 800, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontWeight: 700 },
    body1: { fontSize: "0.95rem" },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ":root": {
          "--text": colors.muted,
          "--text-h": colors.ink,
          "--bg": colors.background,
          "--accent": colors.raspberry,
        },
        body: { backgroundColor: colors.background },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255,255,255,0.96)",
          color: colors.ink,
          borderBottom: `1px solid ${colors.border}`,
          boxShadow: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          boxShadow: "0 2px 12px rgba(88,25,53,0.05)",
          transition: "box-shadow 160ms ease",
          "&:hover": { boxShadow: "0 5px 18px rgba(88,25,53,0.09)" },
        },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiAlert: {
      defaultProps: { closeText: "Cerrar aviso" },
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: colors.blush,
          color: colors.ink,
          fontWeight: 700,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 10,
          minHeight: 44,
          "&:focus-visible": {
            outline: `3px solid ${colors.raspberryDark}`,
            outlineOffset: 3,
          },
        },
        containedPrimary: {
          boxShadow: "0 4px 14px rgba(216,27,96,0.18)",
          "&:hover": {
            backgroundColor: colors.raspberryDark,
            boxShadow: "0 6px 18px rgba(216,27,96,0.24)",
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: colors.surface,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.border },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: colors.muted,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 500 } },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRadius: "20px 0 0 20px" },
      },
    },
  },
});
