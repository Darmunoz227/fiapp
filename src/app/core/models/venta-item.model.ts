export interface VentaItem {
  id: string;
  venta_id: string;
  producto_id: string;
  cantidad: number;
  precio_venta: number;
  costo_unitario: number;
  ganancia: number;
  created_at: number | null;
  updated_at: number | null;
  deleted_at: number | null;
  store_id: string | null;
  created_by: string | null;
}