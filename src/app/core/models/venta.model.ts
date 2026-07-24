export type TipoPago = 'CONTADO' | 'FIADO';

export interface Venta {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_venta: number;
  costo_unitario: number;
  ganancia: number;
  tipo_pago: TipoPago;
  cliente_id?: string | null;
  fecha: number;
  created_at?: number | null;
  updated_at?: number | null;
  deleted_at?: number | null;
  store_id?: string | null;
  created_by?: string | null;
}
