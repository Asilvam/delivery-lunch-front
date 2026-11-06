import original0 from "../../assets/dishes/pollo-asado-arroz-papas.png";
import small0 from "../../assets/hero/almuerzo-quintero-640.jpg";
import large0 from "../../assets/hero/almuerzo-quintero-1120.jpg";
import original1 from "../../assets/dishes/pollo-asado-fideos.png";
import small1 from "../../assets/hero/pollo-asado-fideos-640.jpg";
import large1 from "../../assets/hero/pollo-asado-fideos-1120.jpg";
import original2 from "../../assets/dishes/cerdo-mongoliano-arroz.png";
import small2 from "../../assets/hero/cerdo-mongoliano-arroz-640.jpg";
import large2 from "../../assets/hero/cerdo-mongoliano-arroz-1120.jpg";
import original3 from "../../assets/dishes/cerdo-mongoliano-fideos.png";
import small3 from "../../assets/hero/cerdo-mongoliano-fideos-640.jpg";
import large3 from "../../assets/hero/cerdo-mongoliano-fideos-1120.jpg";
import original4 from "../../assets/dishes/porotos-con-riendas.png";
import small4 from "../../assets/hero/porotos-con-riendas-640.jpg";
import large4 from "../../assets/hero/porotos-con-riendas-1120.jpg";
import original5 from "../../assets/dishes/hipocalorico.png";
import small5 from "../../assets/hero/hipocalorico-640.jpg";
import large5 from "../../assets/hero/hipocalorico-1120.jpg";

const optimizedImages: Record<string, { small: string; large: string }> = {
  [original0]: { small: small0, large: large0 },
  [original1]: { small: small1, large: large1 },
  [original2]: { small: small2, large: large2 },
  [original3]: { small: small3, large: large3 },
  [original4]: { small: small4, large: large4 },
  [original5]: { small: small5, large: large5 },
};

/** Mantiene las fotos remotas y optimiza las imágenes locales conocidas. */
export function getHeroDishImage(source: string) {
  return optimizedImages[source];
}
