import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { HeroDishCarousel } from "./HeroDishCarousel";
import {
  DEFAULT_HERO_IMAGE,
  getHeroDishImage,
} from "../data/mappers/heroImages";
afterEach(cleanup);
it("uses a fixed Cloudinary brand photo when no menu is published", () => {
  render(<HeroDishCarousel dishes={[]} isLoading={false} />);
  expect(
    screen
      .getByRole("img", { name: "Sabores Angelicales" })
      .getAttribute("src"),
  ).toBe(getHeroDishImage(DEFAULT_HERO_IMAGE)!.large);
  expect(screen.queryByText(/Las fotografías aparecerán/)).toBeNull();
});
it("continues using the photographs from the actual menu when available", () => {
  const source =
    "https://res.cloudinary.com/dsbpineil/image/upload/v123/today.png";
  render(
    <HeroDishCarousel
      dishes={[
        { id: "today", name: "Plato de hoy", price: 5500, imageUrl: source },
      ]}
      isLoading={false}
    />,
  );
  expect(
    screen.getByRole("img", { name: "Plato de hoy" }).getAttribute("src"),
  ).toBe(getHeroDishImage(source)!.large);
  expect(screen.queryByRole("img", { name: "Sabores Angelicales" })).toBeNull();
});
