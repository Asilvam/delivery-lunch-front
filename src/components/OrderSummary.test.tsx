import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { OrderSummary } from "./OrderSummary";
afterEach(cleanup);
it("explains quantities and protein without repeating accompaniments in each row", () => {
  render(
    <OrderSummary
      items={[
        {
          key: "h",
          name: "Menú hipocalórico",
          protein: "Atún",
          quantity: 2,
          price: 5500,
        },
        { key: "p", name: "Porotos con riendas", quantity: 1, price: 5500 },
      ]}
      total={16500}
    />,
  );
  expect(screen.getByText("Tu pedido · 3 menús")).toBeDefined();
  expect(screen.getByText("2 × Menú hipocalórico")).toBeDefined();
  expect(screen.queryByText("1 × $5.500")).toBeNull();
  expect(screen.getByText("Proteína: Atún")).toBeDefined();
  expect(screen.getByText("$11.000")).toBeDefined();
  expect(screen.getByText("$16.500")).toBeDefined();
  expect(screen.queryByText(/Incluye por menú:/)).toBeNull();
});
