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

export interface PuntoEquilibrio {
  calculable: boolean;
  ventaNecesariaMensual: number;
  ventaNecesariaDiaria: number;
}

export function calcularMargenPromedio(totalVendido: number, gananciaTotal: number): number {
  if (!Number.isFinite(totalVendido) || totalVendido <= 0) {
    return 0;
  }
  if (!Number.isFinite(gananciaTotal) || gananciaTotal < 0) {
    return 0;
  }
  return gananciaTotal / totalVendido;
}

const NO_CALCULABLE: PuntoEquilibrio = {
  calculable: false,
  ventaNecesariaMensual: 0,
  ventaNecesariaDiaria: 0,
};

export function calcularPuntoEquilibrio(fijosMensuales: number, margen: number): PuntoEquilibrio {
  // Sin margen real no hay respuesta honesta: decir "necesitas vender 0"
  // seria tecnicamente correcto e inutil. Se informa que aun no se puede.
  if (!Number.isFinite(fijosMensuales) || fijosMensuales <= 0) {
    return NO_CALCULABLE;
  }
  if (!Number.isFinite(margen) || margen <= 0) {
    return NO_CALCULABLE;
  }

  const mensual = fijosMensuales / margen;

  return {
    calculable: true,
    ventaNecesariaMensual: mensual,
    ventaNecesariaDiaria: mensual / 30,
  };
}
