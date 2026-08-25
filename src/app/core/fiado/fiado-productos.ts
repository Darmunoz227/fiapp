import { CatalogoItem } from '../models/catalogo-item.model';

export { CatalogoItem };

export interface CarritoFiado {
  [productoId: string]: number;
}

function cantidadValida(cantidad: number): number {
  if (!Number.isFinite(cantidad) || cantidad < 0) {
    return 0;
  }
  return Math.floor(cantidad);
}

export function calcularTotalFiado(carrito: CarritoFiado, catalogo: CatalogoItem[]): number {
  let total = 0;
  for (const id of Object.keys(carrito)) {
    const item = catalogo.find((c) => c.id === id);
    if (!item) {
      continue;
    }
    total += cantidadValida(carrito[id]) * item.precio;
  }
  return total;
}

export function construirConceptoFiado(carrito: CarritoFiado, catalogo: CatalogoItem[]): string {
  const partes: string[] = [];
  for (const item of catalogo) {
    const cantidad = cantidadValida(carrito[item.id] ?? 0);
    if (cantidad > 0) {
      partes.push(`${cantidad} ${item.nombre}`);
    }
  }
  return partes.join(', ');
}

export function serializarCatalogo(items: CatalogoItem[]): string {
  return JSON.stringify(items);
}

export function parsearCatalogo(json: string | null): CatalogoItem[] {
  if (!json) {
    return [];
  }
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) {
    return [];
  }
  return data.filter(
    (item): item is CatalogoItem =>
      !!item &&
      typeof item === 'object' &&
      typeof (item as any).id === 'string' &&
      typeof (item as any).nombre === 'string' &&
      typeof (item as any).precio === 'number' &&
      Number.isFinite((item as any).precio),
  );
}
