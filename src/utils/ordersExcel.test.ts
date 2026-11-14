// @vitest-environment node
import { expect, it } from "vitest";
import ExcelJS from "exceljs";
import { buildOrdersWorkbook } from "./ordersExcel";
import type { Order } from "../types/order";
import type { DashboardSummary } from "../data/services/statisticsApi.service";
const date = "2026-11-06";
const order: Order = {
  _id: "000000000000000000000001",
  menuId: "menu",
  fecha: date,
  cliente: "=1+1",
  telefono: "+56900000000",
  total: 17000,
  estado: "entregado",
  validadoPorAdmin: true,
  createdAt: "2026-11-06T02:30:00.000Z",
  updatedAt: "2026-11-06T03:30:00.000Z",
  aceptadoEn: "2026-11-06T02:45:00.000Z",
  entregadoEn: "2026-11-06T03:30:00.000Z",
  items: [
    {
      platoId: "pollo",
      nombre: "Pollo",
      cantidad: 2,
      precio: 5500,
      selecciones: { postre: "Fruta" },
    },
    {
      platoId: "hipo",
      nombre: "Menú hipocalórico",
      cantidad: 1,
      precio: 6000,
      selecciones: { proteina: "Atún", postre: "Fruta" },
    },
  ],
};
it("exports a valid XLSX preserving real prices, quantities, text and Chile time", async () => {
  const workbook = buildOrdersWorkbook([order], date);
  const buffer = await workbook.xlsx.writeBuffer();
  const loaded = new ExcelJS.Workbook();
  await loaded.xlsx.load(buffer);
  expect(loaded.worksheets.map((sheet) => sheet.name)).toEqual([
    "Pedidos",
    "Detalle",
  ]);
  const pedidos = loaded.getWorksheet("Pedidos")!;
  expect(pedidos.getCell("A5").value).toBe(order._id);
  expect(pedidos.getCell("D5").value).toBe("=1+1");
  expect(pedidos.getCell("D5").type).toBe(ExcelJS.ValueType.String);
  expect(pedidos.getCell("E5").value).toBe("+56900000000");
  expect(pedidos.getCell("E5").type).toBe(ExcelJS.ValueType.String);
  expect(pedidos.getCell("C5").text).toContain("05-11-2026");
  expect(pedidos.getCell("C5").text).toContain("23:30:00");
  expect(pedidos.getCell("G5").value).toBe(3);
  expect(pedidos.getCell("H5").value).toBe(17000);
  expect(pedidos.getCell("H6").value).toMatchObject({
    formula: "SUBTOTAL(109,H5:H5)",
    result: 17000,
  });
  expect(pedidos.views[0]).toMatchObject({ state: "frozen", ySplit: 4 });
  expect(pedidos.autoFilter).toBe("A4:N5");
  expect(pedidos.getCell("K5").value).toBe("Sin registrar");
  const detalle = loaded.getWorksheet("Detalle")!;
  expect(detalle.getCell("F6").value).toBe("Atún");
  expect(pedidos.getCell("I5").text).toContain("23:45:00");
  expect(pedidos.getCell("J5").text).toContain("00:30:00");
  expect(detalle.getCell("J6").text).toContain("proteina: Atún");
  expect(detalle.getCell("L6").text).toContain("23:45:00");
  expect(detalle.getCell("H6").value).toBe(6000);
  expect(detalle.getCell("I5").value).toBe(11000);
  expect(detalle.getCell("I6").value).toBe(6000);
  expect(detalle.getCell("I7").value).toMatchObject({ result: 17000 });
});
it("labels cancellation explicitly and does not count the order total once per dish", () => {
  const workbook = buildOrdersWorkbook(
    [
      order,
      {
        ...order,
        _id: "cancelled",
        total: 5500,
        items: [{ ...order.items[0], cantidad: 1 }],
        estado: "cancelado",
      },
    ],
    date,
  );
  const pedidos = workbook.getWorksheet("Pedidos")!;
  expect(pedidos.getCell("F6").value).toBe("Cancelado");
  expect(pedidos.getCell("H7").value).toMatchObject({ result: 22500 });
  expect(pedidos.getCell("A3").text).toContain("incluyen cancelados");
});
it("does not produce an empty export", () =>
  expect(() => buildOrdersWorkbook([], date)).toThrow("No hay pedidos"));

it("keeps ready orders distinct from completed orders and exports the ready timestamp", () => {
  const workbook = buildOrdersWorkbook(
    [{ ...order, estado: "listo", listoEn: "2026-11-06T03:00:00Z" }],
    date,
  );
  const sheet = workbook.getWorksheet("Pedidos")!;
  expect(sheet.getCell("F5").text).toBe("Listo para entregar");
  expect(sheet.getCell("N5").text).toContain("00:00:00");
  expect(sheet.getCell("J5").text).toBe("");
});

it("exports the same metrics summary even with no completed orders, separating sales and collections", async () => {
  const summary: DashboardSummary = {
    pedidosTotales: 4,
    pedidosCompletados: 1,
    pedidosCancelados: 1,
    pedidosPendientes: 1,
    pedidosEnPreparacion: 0,
    pedidosListos: 1,
    menusVendidos: 2,
    ingresosTotales: 11000,
    tasaCompletacion: 25,
    pagos: {
      total: 17000,
      efectivo: 6000,
      transferencia: 11000,
      porCobrar: 5500,
      sinRegistro: 1,
    },
    periodo: { startDate: date, endDate: date },
  };
  const workbook = buildOrdersWorkbook([], date, date, summary);
  const loaded = new ExcelJS.Workbook();
  await loaded.xlsx.load(await workbook.xlsx.writeBuffer());
  const sheet = loaded.getWorksheet("Resumen")!;
  const values = new Map<string, ExcelJS.CellValue>();
  sheet.eachRow((row, i) => {
    if (i > 4) values.set(row.getCell(1).text, row.getCell(2).value);
  });
  expect(values.get("Ventas entregadas")).toBe(11000);
  expect(values.get("Cobros registrados")).toBe(17000);
  expect(values.get("Por cobrar")).toBe(5500);
  expect(values.get("Listos para entregar")).toBe(1);
  expect(sheet.getCell("A3").text).toContain("No cambia pedidos");
});

it("identifies the metrics date range in both workbook sheets", () => {
  const workbook = buildOrdersWorkbook([order], "2026-11-01", date);
  for (const sheet of workbook.worksheets) {
    expect(sheet.getCell("A2").text).toContain("del 01/11/2026 al 06/11/2026");
    expect(sheet.getCell("A2").text).toContain("Métricas");
    expect(sheet.getCell("A2").text).not.toContain("Cocina");
  }
});
