import { cloudinaryImage } from "../../shared/utils/images/cloudinary";

/** Responsive derivatives of the published menu's Cloudinary photograph. */
export function getHeroDishImage(source: string) {
  if (!source.startsWith("https://res.cloudinary.com/")) return undefined;
  return {
    small: cloudinaryImage(source, 640),
    large: cloudinaryImage(source, 1120),
  };
}
