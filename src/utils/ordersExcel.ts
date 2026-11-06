import ExcelJS from "exceljs";
import type { Order } from "../types/order";

const CLP = '"$"#,##0;[Red]-"$"#,##0';
const createdDate = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});
const formatDate = (value?: string): string => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : createdDate.format(date);
};
const menuDate = (iso: string) => iso.split("-").reverse().join("/");

function createSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  date: string,
  headers: string[],
  widths: number[],
) {
  const sheet = workbook.addWorksheet(name, {
    views: [{ state: "frozen", ySplit: 4 }],
    properties: { defaultRowHeight: 24 },
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });
  sheet.columns = widths.map((width) => ({ width }));
  sheet.mergeCells(1, 1, 1, headers.length);
  const title = sheet.getCell(1, 1);
  title.value = `Sabores Angelicales · ${name}`;
  title.font = {
    name: "Calibri",
    size: 16,
    bold: true,
    color: { argb: "FF9C0F45" },
  };
  sheet.getRow(1).height = 32;
  sheet.mergeCells(2, 1, 2, headers.length);
  sheet.getCell(2, 1).value =
    `Completados y cancelados del ${menuDate(date)} · Cocina`;
  sheet.mergeCells(3, 1, 3, headers.length);
  sheet.getCell(3, 1).value =
    "Importes en CLP. Los totales incluyen cancelados si están presentes. Horarios de Chile.";
  sheet.getCell(3, 1).font = {
    name: "Calibri",
    size: 10,
    color: { argb: "FF6B5B73" },
  };
  const header = sheet.getRow(4);
  header.values = headers;
  header.height = 34;
  header.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD81B60" },
    };
    cell.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.alignment = { vertical: "middle", wrapText: true };
  });
  return sheet;
}
function finishSheet(
  sheet: ExcelJS.Worksheet,
  numericColumns: number[],
  totals: { column: number; value: number }[],
) {
  const lastDataRow = sheet.rowCount;
  sheet.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: lastDataRow, column: sheet.columnCount },
  };
  for (let row = 5; row <= lastDataRow; row++) {
    sheet.getRow(row).eachCell((cell) => {
      cell.font = { name: "Calibri", size: 11, color: { argb: "FF1A0A2E" } };
      cell.alignment = { vertical: "top", wrapText: true };
      if (row % 2 === 1)
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFDF2F8" },
        };
    });
    let lines = 1;
    sheet.getRow(row).eachCell((cell) => {
      if (typeof cell.value === "string") {
        const width = Math.max(1, (sheet.getColumn(cell.col).width ?? 10) - 2);
        lines = Math.max(
          lines,
          cell.value
            .split("\n")
            .reduce(
              (sum, text) => sum + Math.max(1, Math.ceil(text.length / width)),
              0,
            ),
        );
      }
    });
    sheet.getRow(row).height = Math.max(24, lines * 16 + 8);
  }
  numericColumns.forEach((column) => {
    sheet.getColumn(column).numFmt = CLP;
  });
  const totalRow = sheet.addRow(["Total registrado"]);
  totalRow.height = 28;
  totalRow.font = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: "FF9C0F45" },
  };
  for (const { column, value } of totals) {
    const letter = sheet.getColumn(column).letter;
    totalRow.getCell(column).value = {
      formula: `SUBTOTAL(109,${letter}5:${letter}${lastDataRow})`,
      result: value,
    };
  }
  sheet.pageSetup.printTitlesRow = "1:4";
}

export function buildOrdersWorkbook(
  orders: Order[],
  date: string,
): ExcelJS.Workbook {
  if (!orders.length) throw new Error("No hay pedidos para exportar.");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sabores Angelicales";
  workbook.created = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;
  const pedidos = createSheet(
    workbook,
    "Pedidos",
    date,
    [
      "Número de pedido",
      "Fecha del menú",
      "Creado (Chile)",
      "Cliente",
      "Teléfono",
      "Estado",
      "Menús",
      "Total (CLP)",
      "Aceptado (Chile)",
      "Entregado/Cancelado (Chile)",
    ],
    [29, 17, 23, 32, 23, 32, 12, 20, 23, 29],
  );
  const detalle = createSheet(
    workbook,
    "Detalle",
    date,
    [
      "Número de pedido",
      "Fecha del menú",
      "Cliente",
      "Estado",
      "Plato",
      "Proteína",
      "Cantidad",
      "Precio unitario (CLP)",
      "Subtotal (CLP)",
      "Selecciones",
      "Creado (Chile)",
      "Aceptado (Chile)",
      "Entregado/Cancelado (Chile)",
    ],
    [29, 17, 32, 32, 46, 28, 12, 23, 22, 50, 23, 23, 29],
  );
  let quantity = 0,
    detailTotal = 0;
  for (const order of orders) {
    const count = order.items.reduce((sum, item) => sum + item.cantidad, 0);
    quantity += count;
    const state = {
      pendiente: order.validadoPorAdmin
        ? "Aprobado"
        : "Pendiente de aprobación",
      en_preparacion: "En preparación",
      entregado: "Entregado",
      cancelado: "Cancelado",
    }[order.estado];
    const created = formatDate(order.createdAt);
    const accepted = formatDate(order.aceptadoEn);
    const finished = formatDate(
      (order.estado === "cancelado" ? order.canceladoEn : order.entregadoEn) ||
        order.updatedAt,
    );
    pedidos.addRow([
      order._id,
      menuDate(order.fecha),
      created,
      order.cliente,
      order.telefono,
      state,
      count,
      order.total,
      accepted,
      finished,
    ]);
    for (const item of order.items) {
      const subtotal = item.precio * item.cantidad;
      detailTotal += subtotal;
      detalle.addRow([
        order._id,
        menuDate(order.fecha),
        order.cliente,
        state,
        item.nombre,
        item.selecciones?.proteina ?? "",
        item.cantidad,
        item.precio,
        subtotal,
        Object.entries(item.selecciones ?? {})
          .map(([key, value]) => `${key}: ${value}`)
          .join("; "),
        created,
        accepted,
        finished,
      ]);
    }
  }
  // Store text explicitly so phone prefixes, IDs and names never become formulas.
  pedidos.getColumn(1).numFmt = "@";
  pedidos.getColumn(5).numFmt = "@";
  detalle.getColumn(1).numFmt = "@";
  finishSheet(
    pedidos,
    [8],
    [
      { column: 7, value: quantity },
      { column: 8, value: orders.reduce((sum, order) => sum + order.total, 0) },
    ],
  );
  if (detalle.rowCount > 4)
    finishSheet(
      detalle,
      [8, 9],
      [
        { column: 7, value: quantity },
        { column: 9, value: detailTotal },
      ],
    );
  return workbook;
}
export async function createOrdersExcel(
  orders: Order[],
  date: string,
): Promise<{ blob: Blob; filename: string }> {
  const buffer = await buildOrdersWorkbook(orders, date).xlsx.writeBuffer();
  const bytes = new Uint8Array(buffer.byteLength);
  bytes.set(new Uint8Array(buffer));
  return {
    blob: new Blob([bytes.buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename: `Report-day-${date.slice(8, 10)}${date.slice(5, 7)}${date.slice(2, 4)}.xlsx`,
  };
}
export function downloadOrdersExcel(file: {
  blob: Blob;
  filename: string;
}): void {
  const url = URL.createObjectURL(file.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.filename;
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
