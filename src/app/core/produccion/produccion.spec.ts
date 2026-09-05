import { construirProduccion, CarritoProduccion } from './produccion';

describe('construirProduccion', () => {
  let n = 0;
  const generarId = () => 'id-' + ++n;

  beforeEach(() => { n = 0; });

  it('crea una linea por producto con su propio costo declarado, sin prorrateo', () => {
    const carrito: CarritoProduccion = {
      'prod-a': { cantidad: 20, costoUnitario: 800 },
      'prod-b': { cantidad: 5, costoUnitario: 1500 },
    };

    const armada = construirProduccion(carrito, 1700000000000, generarId);

    expect(armada.items.length).toBe(2);
    const a = armada.items.find((i) => i.producto_id === 'prod-a');
    const b = armada.items.find((i) => i.producto_id === 'prod-b');
    expect(a?.cantidad).toBe(20);
    expect(a?.costo_unitario_declarado).toBe(800);
    expect(b?.cantidad).toBe(5);
    expect(b?.costo_unitario_declarado).toBe(1500);
  });

  it('descarta la linea con costo invalido y conserva las validas', () => {
    const armada = construirProduccion({
      'prod-a': { cantidad: 10, costoUnitario: 500 },
      'prod-malo': { cantidad: 10, costoUnitario: -1 },
    }, 1700000000000, generarId);

    expect(armada.items.length).toBe(1);
    expect(armada.items[0].producto_id).toBe('prod-a');
  });

  it('descarta la linea con cantidad cero o negativa', () => {
    const armada = construirProduccion({
      'prod-a': { cantidad: 0, costoUnitario: 500 },
      'prod-b': { cantidad: -3, costoUnitario: 500 },
    }, 1700000000000, generarId);

    expect(armada.items.length).toBe(0);
    expect(armada.movimientos.length).toBe(0);
  });

  it('genera un movimiento PRODUCCION por linea con el costo declarado', () => {
    const armada = construirProduccion({
      'prod-a': { cantidad: 20, costoUnitario: 800 },
      'prod-b': { cantidad: 5, costoUnitario: 1500 },
    }, 1700000000000, generarId);

    expect(armada.movimientos.length).toBe(2);
    for (const m of armada.movimientos) {
      expect(m.tipo).toBe('PRODUCCION');
      expect(m.fecha).toBe(1700000000000);
    }
    const a = armada.movimientos.find((m) => m.producto_id === 'prod-a');
    expect(a?.costo_unitario).toBe(800);
    expect(a?.cantidad).toBe(20);
  });

  it('todas las lineas comparten la misma cabecera de produccion', () => {
    const armada = construirProduccion({
      'prod-a': { cantidad: 2, costoUnitario: 100 },
      'prod-b': { cantidad: 3, costoUnitario: 200 },
    }, 1700000000000, generarId);

    expect(armada.items[0].produccion_id).toBe(armada.produccion.id);
    expect(armada.items[1].produccion_id).toBe(armada.produccion.id);
  });
});
