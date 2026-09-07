import { FrecuenciaGasto, GastoRecurrente } from '../models/gasto-recurrente.model';

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

export function calcularFijosMensuales(recurrentes: GastoRecurrente[]): number {
  let total = 0;

  for (const recurrente of recurrentes) {
    // activo llega como boolean en la rama web y como 1/0 desde SQLite
    // (misma divergencia que modo_produccion, Decision 052): truthiness,
    // nunca === true.
    if (!recurrente || !recurrente.activo) {
      continue;
    }
    if (recurrente.tipo_gasto !== 'FIJO') {
      continue;
    }
    total += normalizarAMensual(recurrente.valor_estimado, recurrente.frecuencia);
  }

  return total;
}
