export type TipoTransaccion = 'fiado' | 'abono';

export interface Transaccion {
  id: string;
  cliente_id: string; 
  tipo: TipoTransaccion; 
  monto: number; 
  concepto: string; 
  fecha: number; 
}

