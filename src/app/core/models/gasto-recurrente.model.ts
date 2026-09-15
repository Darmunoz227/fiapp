import { TipoGasto } from './gasto.model';

export type FrecuenciaGasto = 'DIARIO' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'ANUAL';

export interface GastoRecurrente {
  id: string;
  categoria: string;
  valor_estimado: number;
  tipo_gasto: TipoGasto;
  frecuencia: FrecuenciaGasto;
  activo: boolean;
  created_at?: number | null;
  updated_at?: number | null;
  deleted_at?: number | null;
  store_id?: string | null;
  created_by?: string | null;
}
