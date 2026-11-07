import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import PublishedMenuEditor from "./PublishedMenuEditor";
import type { LibraryDish } from "../../../data/services/dishLibraryApi.service";
vi.mock("../../../utils/notifications", () => ({
  appAlert: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) },
}));
const library: LibraryDish[] = ["Pollo", "Porotos"].map((name, index) => ({
  _id: `library-${index}`,
  clave: name,
  nombre: name,
  descripcion: "",
  categoria: "Platos",
  imagenUrl: `https://res.cloudinary.com/demo/image/upload/v1/photo-${index}.png`,
  imagenPublicId: `photo-${index}`,
  esHipo: false,
  opciones: [],
  activo: true,
  notaInterna: "",
}));
afterEach(cleanup);
const setup = (hasOrders = false) => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(
    <PublishedMenuEditor
      menu={{
        _id: "menu",
        fecha: "2030-11-06",
        estado: "publicado",
        updatedAt: "2030-11-06T10:00:00Z",
        precioBase: 5500,
        ensalada: [],
        pan: "Pan",
        postre: [],
        platos: [
          {
            _id: "dish",
            catalogoId: "library-0",
            nombre: "Pollo",
            precio: 5500,
            stock: 5,
            tienePedidos: hasOrders,
          },
        ],
      }}
      library={library}
      saving={false}
      onSave={save}
      onDirtyChange={vi.fn()}
      onReload={vi.fn()}
    />,
  );
  return save;
};
it("changes special prices without overwriting live stock, and sends expected stock only when adjusted", () => {
  const save = setup();
  fireEvent.change(screen.getByLabelText("Precio de Pollo"), {
    target: { value: "5900" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
  expect(save.mock.calls[0][0].platos[0]).toMatchObject({
    id: "dish",
    precioEspecial: 5900,
  });
  expect(save.mock.calls[0][0].platos[0].stock).toBeUndefined();
  fireEvent.change(screen.getByLabelText("Stock disponible de Pollo"), {
    target: { value: "0" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
  expect(save.mock.calls[1][0].platos[0]).toMatchObject({
    id: "dish",
    stock: 0,
    expectedStock: 5,
  });
});
it("retires an item and adds another from the library", async () => {
  const save = setup();
  fireEvent.click(screen.getByRole("button", { name: "Retirar del menú" }));
  await waitFor(() => expect(screen.queryByRole("heading", { name: "Pollo" })).toBeNull());
  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
  expect(save.mock.calls[0][0].platos).toEqual([]);
  fireEvent.mouseDown(
    screen.getByRole("combobox", { name: "Agregar plato desde la biblioteca" }),
  );
  fireEvent.click(screen.getByRole("option", { name: "Porotos" }));
  fireEvent.change(screen.getByLabelText("Stock disponible de Porotos"), {
    target: { value: "4" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
  expect(save.mock.calls[1][0].platos[0]).toMatchObject({
    catalogoId: "library-1",
    stock: 4,
    precioEspecial: null,
  });
});

it("marks ordered dishes sold out instead of removing them", async () => {
  const save = setup(true);
  expect(screen.queryByRole("button", { name: "Retirar del menú" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Marcar agotado" }));
  await waitFor(() => expect((screen.getByLabelText("Stock disponible de Pollo") as HTMLInputElement).value).toBe("0"));
  expect(screen.getByRole("heading", { name: "Pollo" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
  expect(save.mock.calls[0][0].platos).toHaveLength(1);
  expect(save.mock.calls[0][0].platos[0]).toMatchObject({ id: "dish", stock: 0, expectedStock: 5 });
});
