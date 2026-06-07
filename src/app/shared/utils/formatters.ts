const MESES_CORTOS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function parseCurrencyInput(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.trunc(value) : 0;
  }

  const normalized = value.replace(/[^0-9-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

export function formatCurrencyCOP(value: string | number | null | undefined): string {
  const numericValue = parseCurrencyInput(value);
  return numericValue.toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

export function formatFiadoConcept(date: Date): string {
  const day = date.getDate();
  const month = MESES_CORTOS_ES[date.getMonth()] ?? '';
  return `Fiado del ${day} de ${month}`;
}

export function formatTransactionDate(timestamp: number): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp));
}
