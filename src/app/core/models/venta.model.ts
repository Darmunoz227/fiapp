export type TipoPago = 'CONTADO' | 'FIADO' | 'MIXTO';

export interface Venta {
  id: string;
  tipo_pago: TipoPago;
  monto_contado: number | null;
  monto_fiado: number | null;
  cliente_id?: string | null;
  fecha: number;
  created_at?: number | null;
  updated_at?: number | null;
  deleted_at?: number | null;
  store_id?: string | null;
  created_by?: string | null;
}
