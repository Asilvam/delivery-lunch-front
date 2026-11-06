import { Box, CircularProgress, Typography } from "@mui/material";

export function MenuLoadingScreen() {
  return (
    <Box
      role="status"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 180,
        gap: 2,
      }}
    >
      <CircularProgress color="primary" size={28} aria-hidden="true" />
      <Typography variant="body2" color="text.secondary">
        Preparando tu menú…
      </Typography>
    </Box>
  );
}
