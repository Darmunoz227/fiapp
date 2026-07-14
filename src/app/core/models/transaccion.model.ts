export type TipoTransaccion = 'fiado' | 'abono';

export interface Transaccion {
  id: string;
  cliente_id: string; 
  tipo: TipoTransaccion; 
  monto: number; 
  concepto: string; 
  fecha: number; 
  created_at?: number | null;
  updated_at?: number | null;
  deleted_at?: number | null;
  store_id?: string | null;
  created_by?: string | null;
}

