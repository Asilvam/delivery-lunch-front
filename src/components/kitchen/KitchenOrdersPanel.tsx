// src/components/kitchen/KitchenOrdersPanel.tsx
import { useState } from "react";
import { Box, Chip, Collapse, IconButton, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from "@mui/material";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import WifiIcon from "@mui/icons-material/Wifi";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import KitchenOrderCard from "./KitchenOrderCard";
import { OrderStatus, type Order } from "../../types/order";
import DownloadIcon from '@mui/icons-material/Download';

interface Props {
  orders: Order[];
  connected: boolean;
  error: string | null;
  onStatusChange: (id: string, estado: OrderStatus) => Promise<void>;
  isAdmin: boolean;
}

export default function KitchenOrdersPanel({
  orders,
  connected,
  error,
  onStatusChange,
  isAdmin,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const active = orders.filter(
    (o) =>
      o.estado !== OrderStatus.ENTREGADO && o.estado !== OrderStatus.CANCELADO,
  );
  // Utilidad para formatear fechas como dd/MM HH:mm en hora Chile continental
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    // Usar toLocaleString con zona horaria de Chile continental
    const opts: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Santiago',
    };
    // El formato es 22/04, 10:45
    const str = d.toLocaleString('es-CL', opts);
    // Reemplazar coma por espacio para obtener '22/04 10:45'
    return str.replace(',', '');
  };

  // Solo mostrar completados/cancelados del día actual (Chile continental)
  // Obtener fecha de hoy en Chile continental en formato YYYY-MM-DD
  const nowChile = new Date().toLocaleString('en-CA', { timeZone: 'America/Santiago' });
  const todayChile = nowChile.split(' ')[0];
  const isTodayChile = (dateStr: string) => {
    if (!dateStr) return false;
    // Obtener fecha en Chile continental del dateStr
    const d = new Date(dateStr);
    const dChile = d.toLocaleString('en-CA', { timeZone: 'America/Santiago' }).split(' ')[0];
    return dChile === todayChile;
  };
  const done = orders.filter(
    (o) =>
      (o.estado === OrderStatus.ENTREGADO || o.estado === OrderStatus.CANCELADO) &&
      isTodayChile(o.updatedAt)
  );

  // Generar filas: una por cada plato
  const doneRows = done.flatMap((order) =>
    order.items.map((item) => ({ order, item }))
  );

  // CSV export
  const handleExportCSV = () => {
    const header = [
      'Cliente', 'Estado', 'Creado', 'Aceptado', 'Entregado/Cancelado', 'Plato', 'Cantidad', 'Selecciones', 'Precio Unitario', 'Total Item'
    ];
    const rows = doneRows.map(({ order, item }) => [
      order.cliente,
      order.estado,
      formatDate(order.createdAt),
      formatDate(order.aceptadoEn),
      formatDate(order.entregadoEn || order.canceladoEn || order.updatedAt),
      item.nombre,
      item.cantidad,
      Object.entries(item.selecciones || {}).map(([k, v]) => `${k}: ${v}`).join('; '),
      item.precio,
      item.precio * item.cantidad
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Nombre: Report-day-DDMMAA.csv usando fecha Chile continental
    const nowChile = new Date().toLocaleString('en-CA', { timeZone: 'America/Santiago' });
    const [yyyy, mm, dd] = nowChile.split(' ')[0].split('-');
    a.download = `Report-day-${dd}${mm}${yyyy.slice(-2)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      {/* Connection status */}
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        {connected ? (
          <Chip
            icon={<WifiIcon />}
            label="Conectado"
            color="success"
            size="small"
          />
        ) : (
          <Chip
            icon={<WifiOffIcon />}
            label="Reconectando…"
            color="default"
            size="small"
          />
        )}
        {error && (
          <Typography variant="caption" color="error">
            {error}
          </Typography>
        )}
      </Box>

      {active.length === 0 && done.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography color="text.secondary" fontWeight={500}>
            Sin comandas activas
          </Typography>
        </Box>
      ) : (
        <>
          {active.length > 0 && (
            <Box mb={4}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                color="text.secondary"
                mb={1.5}
                textTransform="uppercase"
                letterSpacing={1}
              >
                En curso ({active.length})
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                {active.map((order) => (
                  <KitchenOrderCard
                    key={order._id}
                    order={order}
                    onStatusChange={onStatusChange}
                    isAdmin={isAdmin}
                  />
                ))}
              </Box>
            </Box>
          )}

          {doneRows.length > 0 && (
            <Box>
              {/* Collapsible header */}
              <Box
                display="flex"
                alignItems="center"
                sx={{ cursor: "pointer", userSelect: "none" }}
                onClick={() => setCollapsed((c) => !c)}
                mb={collapsed ? 0 : 1.5}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  color="text.secondary"
                  textTransform="uppercase"
                  letterSpacing={1}
                  flexGrow={1}
                >
                  Completados ({doneRows.length})
                </Typography>
                <IconButton size="small" tabIndex={-1}>
                  {collapsed ? (
                    <ExpandMoreIcon fontSize="small" />
                  ) : (
                    <ExpandLessIcon fontSize="small" />
                  )}
                </IconButton>
              </Box>

              <Collapse in={!collapsed}>
                <Box mb={2}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportCSV}
                    disabled={doneRows.length === 0}
                  >
                    Exportar CSV
                  </Button>
                </Box>
                <TableContainer
                  component={Paper}
                  sx={{
                    width: '100%',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  <Table size="small" stickyHeader sx={{ minWidth: 900 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', width: 110 }}>Creado</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', width: 110 }}>Aceptado</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', width: 150 }}>
                            <Box component="span" sx={{ display: 'inline-block', lineHeight: 1 }}>
                              Entregado/
                              <br />
                              Cancel.
                            </Box>
                          </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Plato</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Cantidad</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Selecciones</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Precio Unitario</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Item</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {doneRows.map(({ order, item }, idx) => (
                        <TableRow key={order._id + '-' + item.platoId + '-' + idx}>
                          <TableCell>{order.cliente}</TableCell>
                          <TableCell>{order.estado}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(order.createdAt)}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(order.aceptadoEn)}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(order.entregadoEn || order.canceladoEn || order.updatedAt)}</TableCell>
                          <TableCell>{item.nombre}</TableCell>
                          <TableCell align="right">{item.cantidad}</TableCell>
                          <TableCell>{Object.entries(item.selecciones || {}).map(([k, v]) => `${k}: ${v}`).join('; ')}</TableCell>
                          <TableCell align="right">${item.precio.toLocaleString('es-CL')}</TableCell>
                          <TableCell align="right">${(item.precio * item.cantidad).toLocaleString('es-CL')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
