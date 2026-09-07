export type TipoGasto = 'FIJO' | 'VARIABLE';

export interface Gasto {
  id: string;
  categoria: string;
  valor: number;
  fecha: number;
  observacion?: string | null;
  tipo_gasto: TipoGasto;
  recurrente_id?: string | null;
  created_at?: number | null;
  updated_at?: number | null;
  deleted_at?: number | null;
  store_id?: string | null;
  created_by?: string | null;
}
