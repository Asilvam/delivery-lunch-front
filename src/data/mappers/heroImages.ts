import { cloudinaryImage } from "../../shared/utils/images/cloudinary";

/** Responsive derivatives of the published menu's Cloudinary photograph. */
export function getHeroDishImage(source: string) {
  if (!source.startsWith("https://res.cloudinary.com/")) return undefined;
  return {
    small: cloudinaryImage(source, 640),
    large: cloudinaryImage(source, 1120),
  };
}

/** Static brand photograph when today's menu has not been published. */
export const DEFAULT_HERO_IMAGE =
  "https://res.cloudinary.com/dsbpineil/image/upload/v1794017542/delivery-lunch/biblioteca/pollo-asado-arroz-papas-fritas-7be5b8760d4b.png";
