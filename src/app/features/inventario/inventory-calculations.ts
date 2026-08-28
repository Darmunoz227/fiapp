import { MovimInventario } from '../../core/models/movim-inventario.model';

export function esStockBajo(stockDerivado: number, minimoStock: number): boolean {
  return stockDerivado <= minimoStock;
}

export function calcularStockDerivado(movimientos: MovimInventario[]): number {
  return movimientos.reduce((stock, movimiento) => {
    if (movimiento.deleted_at != null) {
      return stock;
    }

    if (movimiento.tipo === 'COMPRA') {
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
