export type TipoMovimientoInventario = 'COMPRA' | 'VENTA' | 'AJUSTE' | 'MERMA' | 'PRODUCCION';

export interface MovimInventario {
  id: string;
  producto_id: string;
  tipo: TipoMovimientoInventario;
  cantidad: number;
  costo_unitario: number;
  motivo?: string | null;
  fecha: number;
  actor_id?: string | null;
  stock_calculado_anterior?: number | null;
  cantidad_fisica?: number | null;
  diferencia_calculada?: number | null;
  created_at?: number | null;
  updated_at?: number | null;
  deleted_at?: number | null;
  store_id?: string | null;
  created_by?: string | null;
}
