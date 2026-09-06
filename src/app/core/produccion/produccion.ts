import { Produccion } from '../models/produccion.model';
import { ProduccionItem } from '../models/produccion-item.model';
import { MovimInventario } from '../models/movim-inventario.model';
import { Producto } from '../models/producto.model';

export interface LineaProduccion {
  cantidad: number;
  costoUnitario: number;
}

export interface CarritoProduccion {
  [productoId: string]: LineaProduccion;
}

export interface ProduccionArmada {
  produccion: Produccion;
  items: ProduccionItem[];
  movimientos: MovimInventario[];
}

function lineaValida(linea: LineaProduccion): boolean {
  return (
    Number.isFinite(linea.cantidad) && linea.cantidad > 0 &&
    Number.isFinite(linea.costoUnitario) && linea.costoUnitario >= 0
  );
}

export function construirProduccion(
  carrito: CarritoProduccion,
  fecha: number,
  generarId: () => string,
): ProduccionArmada {
  const produccionId = generarId();
  const items: ProduccionItem[] = [];
  const movimientos: MovimInventario[] = [];

  for (const productoId of Object.keys(carrito)) {
    const linea = carrito[productoId];
    if (!linea || !lineaValida(linea)) {
      continue;
    }

    items.push({
      id: generarId(),
      produccion_id: produccionId,
      producto_id: productoId,
      cantidad: linea.cantidad,
      costo_unitario_declarado: linea.costoUnitario,
    });

    movimientos.push({
      id: generarId(),
      producto_id: productoId,
      tipo: 'PRODUCCION',
      cantidad: linea.cantidad,
      costo_unitario: linea.costoUnitario,
      fecha,
    });
  }

  return { produccion: { id: produccionId, fecha }, items, movimientos };
}

export function filtrarProductosDeProduccion(productos: Producto[]): Producto[] {
  return productos.filter((producto) => !!producto.modo_produccion);
}

export function calcularCostoTotalProduccion(carrito: CarritoProduccion): number {
  let total = 0;

  for (const productoId of Object.keys(carrito)) {
    const linea = carrito[productoId];
    if (!linea || !lineaValida(linea)) {
      continue;
    }
    total += linea.cantidad * linea.costoUnitario;
  }

  return total;
}

export function calcularCostoSugerido(costosFijosMensuales: number, unidadesEstimadas: number): number {
  if (!Number.isFinite(costosFijosMensuales) || costosFijosMensuales < 0) {
    return 0;
  }
  if (!Number.isFinite(unidadesEstimadas) || unidadesEstimadas <= 0) {
    return 0;
  }
  return costosFijosMensuales / unidadesEstimadas;
}
