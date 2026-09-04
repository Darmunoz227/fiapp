export type TipoVenta = 'UNIDAD' | 'PESO';

export interface Producto {
  id: string;
  nombre: string;
  precio_venta: number;
  tipo_venta: TipoVenta;
  minimo_stock: number;
  costo_promedio: number;
  modo_produccion?: boolean;
  created_at?: number | null;
  updated_at?: number | null;
  deleted_at?: number | null;
  store_id?: string | null;
  created_by?: string | null;
}
