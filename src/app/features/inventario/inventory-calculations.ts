import { MovimInventario } from '../../core/models/movim-inventario.model';

export function esStockBajo(stockDerivado: number, minimoStock: number): boolean {
  return stockDerivado <= minimoStock;
}

export function calcularStockDerivado(movimientos: MovimInventario[]): number {
  return movimientos.reduce((stock, movimiento) => {
    if (movimiento.deleted_at != null) {
      return stock;
    }

    if (movimiento.tipo === 'COMPRA' || movimiento.tipo === 'PRODUCCION') {
      return stock + movimiento.cantidad;
    }

    if (movimiento.tipo === 'VENTA' || movimiento.tipo === 'MERMA') {
      return stock - movimiento.cantidad;
    }

    if (movimiento.tipo === 'AJUSTE') {
      return stock + calcularDeltaAjuste(movimiento);
    }

    return stock;
  }, 0);
}

export function gramosAKilogramos(gramos: number): number {
  return gramos / 1000;
}

export function kilogramosAGramos(kilogramos: number): number {
  return Math.round(kilogramos * 1000);
}

export function calcularCostoPromedioPonderado(
  stockAnterior: number,
  costoAnterior: number,
  cantidadComprada: number,
  costoUnitarioCompra: number,
): number {
  const denominador = stockAnterior + cantidadComprada;
  if (denominador === 0) {
    return costoUnitarioCompra;
  }

  return ((stockAnterior * costoAnterior) + (cantidadComprada * costoUnitarioCompra)) / denominador;
}

function calcularDeltaAjuste(movimiento: MovimInventario): number {
  if (typeof movimiento.diferencia_calculada === 'number') {
    return movimiento.diferencia_calculada;
  }

  if (typeof movimiento.cantidad_fisica === 'number' && typeof movimiento.stock_calculado_anterior === 'number') {
    return movimiento.cantidad_fisica - movimiento.stock_calculado_anterior;
  }

  return 0;
}
export interface LineaValorInventario {
  stock_derivado: number;
  costo_promedio: number;
}

export function calcularValorTotalInventario(lineas: LineaValorInventario[]): number {
  return lineas.reduce((total, linea) => total + linea.stock_derivado * linea.costo_promedio, 0);
}

export function resolverCostoPromedio(
  tipo: MovimInventario['tipo'],
  costoPromedioActual: number,
  stockDerivado: number,
  cantidad: number,
  costoUnitario: number | null,
): number {
  if (tipo === 'AJUSTE') {
    if (costoUnitario != null && costoUnitario > 0) {
      return costoUnitario;
    }
    return costoPromedioActual;
  }

  if (tipo === 'COMPRA' || tipo === 'PRODUCCION') {
    return calcularCostoPromedioPonderado(
      stockDerivado,
      costoPromedioActual,
      cantidad,
      costoUnitario ?? 0,
    );
  }

  return costoPromedioActual;
}

export function etiquetaCantidadPorTipo(tipo: MovimInventario['tipo']): string {
  if (tipo === 'COMPRA') {
    return '¿Cuántas unidades entraron?';
  }
  if (tipo === 'MERMA') {
    return '¿Cuántas unidades se perdieron?';
  }
  if (tipo === 'VENTA') {
    return '¿Cuántas unidades vendiste?';
  }
  return 'Cantidad';
}

export function describirStockResultante(
  tipo: MovimInventario['tipo'],
  stockActual: number,
  cantidad: number | null,
): string {
  if (cantidad == null || Number.isNaN(cantidad) || cantidad <= 0) {
    return '';
  }

  if (tipo === 'COMPRA' || tipo === 'PRODUCCION') {
    return `Se suman a las ${stockActual} que ya tienes → quedarán ${stockActual + cantidad}`;
  }

  if (tipo === 'MERMA' || tipo === 'VENTA') {
    return `Se restan de las ${stockActual} que ya tienes → quedarán ${stockActual - cantidad}`;
  }

  return '';
}

export type EstadoStock = 'AGOTADO' | 'POR_AGOTARSE' | 'SIN_MINIMO' | 'OK';

export function resolverEstadoStock(stockDerivado: number, minimoStock: number): EstadoStock {
  if (stockDerivado <= 0) {
    return 'AGOTADO';
  }
  if (minimoStock > 0 && stockDerivado <= minimoStock) {
    return 'POR_AGOTARSE';
  }
  if (minimoStock <= 0) {
    return 'SIN_MINIMO';
  }
  return 'OK';
}

export function sugerirMinimoStock(cantidadInicial: number): number {
  if (!Number.isFinite(cantidadInicial) || cantidadInicial <= 0) {
    return 0;
  }
  return Math.max(1, Math.floor(cantidadInicial * 0.25));
}
