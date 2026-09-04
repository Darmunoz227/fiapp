export interface Produccion {
  id: string;
  fecha: number;
  nota?: string | null;
  created_at?: number | null;
  updated_at?: number | null;
  deleted_at?: number | null;
  store_id?: string | null;
  created_by?: string | null;
}
