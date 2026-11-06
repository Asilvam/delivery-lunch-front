import hipocalorico from '../../assets/dishes/hipocalorico.png';
import cerdoFideos from '../../assets/dishes/cerdo-mongoliano-fideos.png';
import porotos from '../../assets/dishes/porotos-con-riendas.png';
import cerdoArroz from '../../assets/dishes/cerdo-mongoliano-arroz.png';
import polloArroz from '../../assets/dishes/pollo-asado-arroz-papas.png';
import polloFideos from '../../assets/dishes/pollo-asado-fideos.png';

const dishImages: Record<string, string> = {
  'hipo': hipocalorico,
  'hipocalorico': hipocalorico,
  'cerdo mongoliano con fideos': cerdoFideos,
  'porotos con riendas': porotos,
  'cerdo mongoliano con arroz': cerdoArroz,
  'pollo asado con arroz y papas fritas': polloArroz,
  'pollo asado con fideos con salsa o crema': polloFideos,
};

export function getLocalDishImage(name: string): string | undefined {
  return dishImages[name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ')];
}
