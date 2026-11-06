import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import MenuCompositionEditor from "./MenuCompositionEditor";
import type { LibraryDish } from "../../../data/services/dishLibraryApi.service";
vi.mock("../../../utils/notifications", () => ({
  appAlert: { fire: vi.fn() },
  staffToast: { fire: vi.fn() },
}));
const library: LibraryDish[] = [
  {
    _id: "chicken",
    clave: "chicken",
    nombre: "Pollo asado",
    categoria: "Pollo",
    descripcion: "",
    imagenUrl: "https://res.cloudinary.com/demo/image/upload/v1/pollo.png",
    imagenPublicId: "pollo",
    esHipo: false,
    opciones: [],
    activo: true,
    notaInterna: "",
  },
  {
    _id: "hipo",
    clave: "hipo",
    nombre: "Menú hipocalórico",
    categoria: "Hipocalórico",
    descripcion: "",
    imagenUrl: "https://res.cloudinary.com/demo/image/upload/v1/hipo.png",
    imagenPublicId: "hipo",
    esHipo: true,
    opciones: ["Atún", "Pollo"],
    activo: true,
    notaInterna: "",
  },
];
const setup = () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(
    <MenuCompositionEditor
      date="2030-11-06"
      menu={null}
      library={library}
      previous={[]}
      token="test"
      saving={false}
      onSave={save}
      onDirtyChange={vi.fn()}
      onOpenLibrary={vi.fn()}
    />,
  );
  return save;
};
afterEach(cleanup);
it("inherits the daily price when special is empty and sends an explicit override only when entered", () => {
  const save = setup();
  fireEvent.click(
    screen.getByRole("checkbox", { name: "Seleccionar Pollo asado" }),
  );
  expect(screen.getByRole("button", { name: "Publicar menú" })).toHaveProperty(
    "disabled",
    true,
  );
  fireEvent.change(screen.getByLabelText("Porciones de Pollo asado"), {
    target: { value: "12" },
  });
  expect(
    screen.queryByRole("combobox", { name: "Proteínas de este día" }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Publicar menú" }));
  expect(save.mock.calls[0][0].platos).toEqual([
    {
      catalogoId: "chicken",
      stock: 12,
      precioEspecial: null,
      opcionesProteina: [],
    },
  ]);
  fireEvent.change(screen.getByLabelText("Precio especial de Pollo asado"), {
    target: { value: "5900" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Publicar menú" }));
  expect(save.mock.calls[1][0].platos[0].precioEspecial).toBe(5900);
});
it("allows an incomplete draft but requires daily proteins before publishing a hypocaloric dish", () => {
  const save = setup();
  fireEvent.click(
    screen.getByRole("checkbox", { name: "Seleccionar Menú hipocalórico" }),
  );
  fireEvent.change(screen.getByLabelText("Porciones de Menú hipocalórico"), {
    target: { value: "5" },
  });
  expect(screen.getByRole("button", { name: "Publicar menú" })).toHaveProperty(
    "disabled",
    true,
  );
  fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
  expect(save.mock.calls[0][0].estado).toBe("borrador");
  fireEvent.mouseDown(
    screen.getByRole("combobox", { name: "Proteínas de este día" }),
  );
  fireEvent.click(screen.getByRole("option", { name: "Atún" }));
  expect(
    screen.getByRole("button", { name: "Publicar menú", hidden: true }),
  ).toHaveProperty("disabled", false);
});
