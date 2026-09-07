import { FrecuenciaGasto } from '../models/gasto-recurrente.model';

const FACTOR_MENSUAL: Record<FrecuenciaGasto, number> = {
  DIARIO: 30,
  SEMANAL: 52 / 12,
  QUINCENAL: 2,
  MENSUAL: 1,
  ANUAL: 1 / 12,
};

export function normalizarAMensual(valor: number, frecuencia: FrecuenciaGasto): number {
  if (!Number.isFinite(valor) || valor < 0) {
    return 0;
  }
  const factor = FACTOR_MENSUAL[frecuencia];
  if (factor === undefined) {
    return 0;
  }
  return valor * factor;
}
