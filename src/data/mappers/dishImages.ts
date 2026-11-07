// Cloudinary compatibility for menus published before the dish library.
const dishImages: Record<string, string> = {
  "pollo asado con arroz y papas fritas":
    "https://res.cloudinary.com/dsbpineil/image/upload/v1794003979/delivery-lunch/biblioteca/pollo-asado-arroz-papas-fritas-7be5b8760d4b.png",
  "pollo asado con fideos con salsa o crema":
    "https://res.cloudinary.com/dsbpineil/image/upload/v1794003981/delivery-lunch/biblioteca/pollo-asado-fideos-c3af6fde4fa3.png",
  "cerdo mongoliano con arroz":
    "https://res.cloudinary.com/dsbpineil/image/upload/v1794003981/delivery-lunch/biblioteca/cerdo-mongoliano-arroz-aac3bfcc4cf8.png",
  "cerdo mongoliano con fideos":
    "https://res.cloudinary.com/dsbpineil/image/upload/v1794003982/delivery-lunch/biblioteca/cerdo-mongoliano-fideos-5a39896645e3.png",
  "porotos con riendas":
    "https://res.cloudinary.com/dsbpineil/image/upload/v1794003983/delivery-lunch/biblioteca/porotos-con-riendas-f424526f4013.png",
  "menu hipocalorico":
    "https://res.cloudinary.com/dsbpineil/image/upload/v1794003988/delivery-lunch/biblioteca/menu-hipocalorico-ddc396ae1e79.png",
  hipo: "https://res.cloudinary.com/dsbpineil/image/upload/v1794003988/delivery-lunch/biblioteca/menu-hipocalorico-ddc396ae1e79.png",
  hipocalorico:
    "https://res.cloudinary.com/dsbpineil/image/upload/v1794003988/delivery-lunch/biblioteca/menu-hipocalorico-ddc396ae1e79.png",
};

export function getLegacyCloudinaryDishImage(name: string): string | undefined {
  return dishImages[
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
  ];
}
