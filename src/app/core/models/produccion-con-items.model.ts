import { Produccion } from './produccion.model';
import { ProduccionItem } from './produccion-item.model';

export interface ProduccionConItems {
  produccion: Produccion;
  items: ProduccionItem[];
}
