import { TipoPago } from './venta.model';
import { VentaItem } from './venta-item.model';

export interface VentaBase {
  id: string;
  tipo_pago: TipoPago;
  monto_contado: number;
  monto_fiado: number;
  cliente_id: string | null;
  fecha: number;
  created_at: number | null;
  updated_at: number | null;
  deleted_at: number | null;
  store_id: string | null;
  created_by: string | null;
}

export interface VentaConItems {
  venta: VentaBase;
  items: VentaItem[];
}