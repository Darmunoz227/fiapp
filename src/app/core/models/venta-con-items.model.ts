import { Venta } from './venta.model';
import { VentaItem } from './venta-item.model';

export interface VentaConItems {
  venta: Venta;
  items: VentaItem[];
}