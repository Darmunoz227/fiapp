import { calcularTotalFiado, construirConceptoFiado, serializarCatalogo, parsearCatalogo, CatalogoItem, CarritoFiado } from './fiado-productos';

const catalogo: CatalogoItem[] = [
  { id: 'empanada', nombre: 'Empanada', precio: 3000, emoji: '🥟' },
  { id: 'jugo', nombre: 'Jugo', precio: 5000, emoji: '🧃' },
  { id: 'cafe', nombre: 'Café', precio: 2000, emoji: '☕' },
];

describe('calcularTotalFiado', () => {
  it('suma cantidad por precio de cada item', () => {
    const carrito: CarritoFiado = { empanada: 3, jugo: 1 };
    expect(calcularTotalFiado(carrito, catalogo)).toBe(14000);
  });

  it('carrito vacio devuelve 0', () => {
    expect(calcularTotalFiado({}, catalogo)).toBe(0);
  });

  it('ignora items que no existen en el catalogo', () => {
    const carrito: CarritoFiado = { empanada: 2, fantasma: 5 };
    expect(calcularTotalFiado(carrito, catalogo)).toBe(6000);
  });

  it('trata cantidad negativa como 0', () => {
    const carrito: CarritoFiado = { empanada: -3, jugo: 2 };
    expect(calcularTotalFiado(carrito, catalogo)).toBe(10000);
  });

  it('no devuelve NaN con catalogo vacio', () => {
    const carrito: CarritoFiado = { empanada: 3 };
    const total = calcularTotalFiado(carrito, []);
    expect(total).toBe(0);
    expect(Number.isNaN(total)).toBe(false);
  });
});

describe('construirConceptoFiado', () => {
  it('nombra productos y cantidades', () => {
    const carrito: CarritoFiado = { empanada: 3, jugo: 1 };
    expect(construirConceptoFiado(carrito, catalogo)).toBe('3 Empanada, 1 Jugo');
  });

  it('ignora items con cantidad 0', () => {
    const carrito: CarritoFiado = { empanada: 2, jugo: 0 };
    expect(construirConceptoFiado(carrito, catalogo)).toBe('2 Empanada');
  });

  it('carrito vacio devuelve string vacio', () => {
    expect(construirConceptoFiado({}, catalogo)).toBe('');
  });

  it('ignora items que no existen en el catalogo', () => {
    const carrito: CarritoFiado = { empanada: 1, fantasma: 4 };
    expect(construirConceptoFiado(carrito, catalogo)).toBe('1 Empanada');
  });

  it('no incluye undefined ni NaN', () => {
    const carrito: CarritoFiado = { empanada: 2 };
    const texto = construirConceptoFiado(carrito, catalogo);
    expect(texto).not.toContain('undefined');
    expect(texto).not.toContain('NaN');
  });
});

describe('serializarCatalogo y parsearCatalogo', () => {
  const catalogoBase: CatalogoItem[] = [
    { id: 'empanada', nombre: 'Empanada', precio: 3000, emoji: '🥟' },
    { id: 'jugo', nombre: 'Jugo', precio: 5000 },
  ];

  it('round-trip: serializar y luego parsear devuelve el mismo catalogo', () => {
    const json = serializarCatalogo(catalogoBase);
    expect(parsearCatalogo(json)).toEqual(catalogoBase);
  });

  it('parsear null devuelve arreglo vacio', () => {
    expect(parsearCatalogo(null)).toEqual([]);
  });

  it('parsear string vacio devuelve arreglo vacio', () => {
    expect(parsearCatalogo('')).toEqual([]);
  });

  it('parsear JSON invalido devuelve arreglo vacio, no lanza', () => {
    expect(parsearCatalogo('{no es json}')).toEqual([]);
  });

  it('parsear JSON que no es arreglo devuelve arreglo vacio', () => {
    expect(parsearCatalogo('{"id":"x"}')).toEqual([]);
  });

  it('descarta items sin id o precio no numerico', () => {
    const json = JSON.stringify([
      { id: 'ok', nombre: 'Valido', precio: 1000 },
      { nombre: 'Sin id', precio: 500 },
      { id: 'malprecio', nombre: 'Precio texto', precio: 'abc' },
    ]);
    expect(parsearCatalogo(json)).toEqual([{ id: 'ok', nombre: 'Valido', precio: 1000 }]);
  });
});
