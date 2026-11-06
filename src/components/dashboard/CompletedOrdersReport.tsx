import { useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { useMountedRef } from "../../hooks/useMountedRef";
import { staffToast } from "../../utils/notifications";
import { OrderStatus, type Order } from "../../types/order";

const money = (value: number) => `$${value.toLocaleString("es-CL")}`;
const formatDate = (value?: string) => {
  if (!value || Number.isNaN(Date.parse(value))) return "—";
  return new Date(value).toLocaleString("es-CL", {
    timeZone: "America/Santiago",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};
const finishedAt = (order: Order) =>
  (order.estado === OrderStatus.CANCELADO
    ? order.canceladoEn
    : order.entregadoEn) || order.updatedAt;
const Status = ({ order }: { order: Order }) => (
  <Chip
    size="small"
    label={order.estado === OrderStatus.CANCELADO ? "Cancelado" : "Entregado"}
    color={order.estado === OrderStatus.CANCELADO ? "error" : "success"}
    variant="outlined"
  />
);
const Items = ({ order }: { order: Order }) => (
  <Box sx={{ display: "grid", gap: 1 }}>
    {order.items.map((item, index) => (
      <Box key={`${item.platoId}-${index}`}>
        <Typography variant="body2" fontWeight={600}>
          {item.cantidad}× {item.nombre}
        </Typography>
        {item.selecciones?.proteina && (
          <Typography variant="caption" color="text.secondary">
            Proteína: {item.selecciones.proteina} ·{" "}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          {money(item.precio)} por menú
        </Typography>
      </Box>
    ))}
  </Box>
);

export default function CompletedOrdersReport({
  orders,
  startDate,
  endDate,
  loading,
}: {
  orders: Order[];
  startDate: string;
  endDate: string;
  loading: boolean;
}) {
  const [exporting, setExporting] = useState(false);
  const exportInProgress = useRef(false);
  const mounted = useMountedRef();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const mobile = useMediaQuery(useTheme().breakpoints.down("sm"));
  const completed = orders.filter(
    (order) =>
      order.estado === OrderStatus.ENTREGADO ||
      order.estado === OrderStatus.CANCELADO,
  );
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(completed.length / rowsPerPage) - 1),
  );
  const visible = completed.slice(
    currentPage * rowsPerPage,
    (currentPage + 1) * rowsPerPage,
  );
  const exportExcel = async () => {
    if (loading || exportInProgress.current || !completed.length) return;
    exportInProgress.current = true;
    setExporting(true);
    try {
      const { createOrdersExcel, downloadOrdersExcel } =
        await import("../../utils/ordersExcel");
      const file = await createOrdersExcel(completed, startDate, endDate);
      if (!mounted.current) return;
      downloadOrdersExcel(file);
      void staffToast.fire({
        icon: "info",
        title: `Descarga solicitada para ${completed.length} ${completed.length === 1 ? "pedido" : "pedidos"}. Si la cancelaste, puedes volver a exportar.`,
      });
    } catch {
      if (mounted.current)
        void staffToast.fire({
          icon: "error",
          title:
            "No pudimos generar el Excel. Intenta nuevamente; los pedidos siguen disponibles.",
        });
    } finally {
      exportInProgress.current = false;
      if (mounted.current) setExporting(false);
    }
  };
  return (
    <Paper
      component="section"
      variant="outlined"
      sx={{ mt: 3, overflow: "hidden", minWidth: 0 }}
      aria-labelledby="completed-orders-title"
      aria-busy={loading}
    >
      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography
            id="completed-orders-title"
            component="h2"
            variant="h6"
            fontWeight={700}
          >
            Pedidos completados ({completed.length})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Entregados y cancelados · recibidos en el período seleccionado.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={
            exporting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <DownloadIcon />
            )
          }
          disabled={loading || exporting || !completed.length}
          onClick={() => void exportExcel()}
        >
          {exporting ? "Preparando Excel…" : "Exportar a Excel"}
        </Button>
      </Box>
      <Divider />
      {!completed.length ? (
        <Typography color="text.secondary" sx={{ p: 3 }}>
          No hay pedidos completados en este período.
        </Typography>
      ) : mobile ? (
        <Box sx={{ px: 2 }}>
          {visible.map((order) => (
            <Box
              key={order._id}
              sx={{
                py: 2,
                "& + &": { borderTop: "1px solid", borderColor: "divider" },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1,
                  mb: 1.5,
                }}
              >
                <Typography
                  fontWeight={700}
                  sx={{ overflowWrap: "anywhere", minWidth: 0 }}
                >
                  {order.cliente}
                </Typography>
                <Status order={order} />
              </Box>
              <Items order={order} />
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 1.5 }}
              >
                Recibido: {formatDate(order.createdAt)}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Cerrado: {formatDate(finishedAt(order))}
              </Typography>
              <Typography
                fontWeight={700}
                color={
                  order.estado === OrderStatus.CANCELADO
                    ? "text.secondary"
                    : "primary.main"
                }
                textAlign="right"
                sx={{ mt: 1 }}
              >
                {money(order.total)}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: 640 }}>
          <Table
            size="small"
            stickyHeader
            aria-label="Historial de pedidos completados"
            sx={{ minWidth: 1000 }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Recibido</TableCell>
                <TableCell>Preparación</TableCell>
                <TableCell>Entregado / Cancelado</TableCell>
                <TableCell>Platos</TableCell>
                <TableCell align="right">Total pedido</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((order) => (
                <TableRow
                  key={order._id}
                  hover
                  sx={{ "& td": { verticalAlign: "top", py: 2 } }}
                >
                  <TableCell sx={{ maxWidth: 180, overflowWrap: "anywhere" }}>
                    {order.cliente}
                  </TableCell>
                  <TableCell>
                    <Status order={order} />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {formatDate(order.aceptadoEn)}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {formatDate(finishedAt(order))}
                  </TableCell>
                  <TableCell sx={{ minWidth: 230 }}>
                    <Items order={order} />
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ whiteSpace: "nowrap", fontWeight: 700 }}
                  >
                    {money(order.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {completed.length > 0 && (
        <TablePagination
          component="div"
          count={completed.length}
          page={currentPage}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, value) => setPage(value)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage={mobile ? "Ver:" : "Pedidos por página:"}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} de ${count}`
          }
          getItemAriaLabel={(type) =>
            type === "next" ? "Página siguiente" : "Página anterior"
          }
        />
      )}
    </Paper>
  );
}
