export interface ProduccionItem {
  id: string;
  produccion_id: string;
  producto_id: string;
  cantidad: number;
  costo_unitario_declarado: number;
  created_at?: number | null;
  updated_at?: number | null;
  deleted_at?: number | null;
  store_id?: string | null;
  created_by?: string | null;
}
