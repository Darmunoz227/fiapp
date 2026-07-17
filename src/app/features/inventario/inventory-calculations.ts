import { MovimInventario } from '../../core/models/movim-inventario.model';

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

function calcularDeltaAjuste(movimiento: MovimInventario): number {
  if (typeof movimiento.diferencia_calculada === 'number') {
    return movimiento.diferencia_calculada;
  }

  if (typeof movimiento.cantidad_fisica === 'number' && typeof movimiento.stock_calculado_anterior === 'number') {
    return movimiento.cantidad_fisica - movimiento.stock_calculado_anterior;
  }

  return 0;
}