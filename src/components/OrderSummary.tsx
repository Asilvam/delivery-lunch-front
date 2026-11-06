import { Box, Divider, Typography } from "@mui/material";

export interface SummaryItem {
  key: string;
  name: string;
  quantity: number;
  price: number;
  protein?: string;
}

export function OrderSummary({
  items,
  total,
}: {
  items: SummaryItem[];
  total: number;
}) {
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <Box
      component="section"
      aria-label="Resumen final del pedido"
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 2,
        bgcolor: "background.default",
      }}
    >
      <Typography
        component="h3"
        variant="subtitle2"
        fontWeight={800}
        sx={{ mb: 1.5 }}
      >
        Tu pedido · {quantity} {quantity === 1 ? "menú" : "menús"}
      </Typography>
      <Box
        component="ul"
        sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gap: 1.5 }}
      >
        {items.map((item) => (
          <Box
            component="li"
            key={item.key}
            sx={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) auto",
              alignItems: "start",
              gap: 1.5,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700}>
                {item.quantity} × {item.name}
              </Typography>
              {item.protein && (
                <Typography
                  variant="caption"
                  color="primary.dark"
                  sx={{ display: "block", mt: 0.25 }}
                >
                  Proteína: {item.protein}
                </Typography>
              )}
            </Box>
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{ whiteSpace: "nowrap" }}
            >
              ${(item.price * item.quantity).toLocaleString("es-CL")}
            </Typography>
          </Box>
        ))}
      </Box>
      <Divider sx={{ my: 1.5 }} />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Typography fontWeight={700}>Total</Typography>
        <Typography fontWeight={800} variant="h6" color="primary.main">
          ${total.toLocaleString("es-CL")}
        </Typography>
      </Box>
    </Box>
  );
}
