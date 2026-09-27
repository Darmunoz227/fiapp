import { esStockBajo, calcularValorTotalInventario, LineaValorInventario, calcularStockDerivado , resolverCostoPromedio, etiquetaCantidadPorTipo, describirStockResultante, resolverEstadoStock, sugerirMinimoStock} from './inventory-calculations';

describe('inventory-calculations', () => {
  describe('esStockBajo', () => {
    it('returns false when stock is above minimum', () => {
      expect(esStockBajo(10, 5)).toBeFalse();
    });

    it('returns true when stock is exactly at the minimum', () => {
      expect(esStockBajo(5, 5)).toBeTrue();
    });

    it('returns true when stock is below minimum', () => {
      expect(esStockBajo(3, 5)).toBeTrue();
    });

    it('returns true when both stock and minimum are zero', () => {
      expect(esStockBajo(0, 0)).toBeTrue();
    });
  });
});
describe('calcularValorTotalInventario', () => {
  it('inventario vacio devuelve 0', () => {
    expect(calcularValorTotalInventario([])).toBe(0);
  });

  it('suma stock por costo de varias lineas', () => {
    const lineas: LineaValorInventario[] = [
      { stock_derivado: 10, costo_promedio: 5000 },
      { stock_derivado: 3, costo_promedio: 2000 },
    ];
    expect(calcularValorTotalInventario(lineas)).toBe(56000);
  });

  it('linea con stock > 0 y costo 0 aporta 0 y no rompe la suma', () => {
    const lineas: LineaValorInventario[] = [
      { stock_derivado: 10, costo_promedio: 5000 },
      { stock_derivado: 4, costo_promedio: 0 },
    ];
    const total = calcularValorTotalInventario(lineas);
    expect(total).toBe(50000);
    expect(Number.isNaN(total)).toBe(false);
  });

  it('linea con stock 0 y costo > 0 aporta 0', () => {
    const lineas: LineaValorInventario[] = [
      { stock_derivado: 0, costo_promedio: 9000 },
    ];
    expect(calcularValorTotalInventario(lineas)).toBe(0);
  });
});

describe('calcularStockDerivado - PRODUCCION', () => {
  function movProduccion(cantidad: number): any {
    return {
      id: 'm1',
      producto_id: 'p1',
      tipo: 'PRODUCCION',
      cantidad,
      costo_unitario: 800,
      motivo: null,
      fecha: Date.now(),
      actor_id: null,
      stock_calculado_anterior: null,
      cantidad_fisica: null,
      diferencia_calculada: null,
      deleted_at: null,
    };
  }

  it('PRODUCCION suma cantidad al stock, igual que COMPRA', () => {
    const movimientos = [movProduccion(50)];
    expect(calcularStockDerivado(movimientos)).toBe(50);
  });

  it('PRODUCCION se acumula con otros movimientos existentes', () => {
    const compra: any = { ...movProduccion(10), tipo: 'COMPRA' };
    const produccion = movProduccion(20);
    expect(calcularStockDerivado([compra, produccion])).toBe(30);
  });
});


describe('resolverCostoPromedio - Feature 037', () => {
  it('AC-04: un AJUSTE con costo REEMPLAZA el costo promedio, no lo pondera', () => {
    const resultado = resolverCostoPromedio('AJUSTE', 3500, 10, 10, 4000);
    expect(resultado).toBe(4000);
  });

  it('AC-03: un AJUSTE sin costo (null) NO toca el costo promedio', () => {
    const resultado = resolverCostoPromedio('AJUSTE', 3500, 10, 10, null);
    expect(resultado).toBe(3500);
  });

  it('AC-03: un AJUSTE con costo 0 se trata como vacio y NO toca el costo', () => {
    const resultado = resolverCostoPromedio('AJUSTE', 3500, 10, 10, 0);
    expect(resultado).toBe(3500);
  });

  it('AC-05 REGRESION: una COMPRA sigue ponderando igual que hoy', () => {
    const resultado = resolverCostoPromedio('COMPRA', 3500, 10, 20, 3700);
    expect(resultado).toBeCloseTo(3633.33, 2);
  });
});


describe('etiquetas y nota viva del modal - Feature 037', () => {
  it('AC-06: la etiqueta de cantidad nombra lo que de verdad ocurre', () => {
    expect(etiquetaCantidadPorTipo('COMPRA')).toBe('¿Cuántas unidades entraron?');
    expect(etiquetaCantidadPorTipo('MERMA')).toBe('¿Cuántas unidades se perdieron?');
    expect(etiquetaCantidadPorTipo('VENTA')).toBe('¿Cuántas unidades vendiste?');
  });

  it('AC-06: la COMPRA dice que SUMA y calcula el stock resultante', () => {
    expect(describirStockResultante('COMPRA', 10, 20)).toBe('Se suman a las 10 que ya tienes → quedarán 30');
  });

  it('AC-06: la MERMA dice que RESTA y calcula el stock resultante', () => {
    expect(describirStockResultante('MERMA', 10, 3)).toBe('Se restan de las 10 que ya tienes → quedarán 7');
  });

  it('AC-06: sin cantidad escrita no muestra nota', () => {
    expect(describirStockResultante('COMPRA', 10, null)).toBe('');
  });
});

describe('resolverEstadoStock - Feature 038', () => {
  it('AC-01: sin existencias y sin minimo es AGOTADO, no SIN_MINIMO', () => {
    expect(resolverEstadoStock(0, 0)).toBe('AGOTADO');
  });

  it('AC-02: sin existencias gana sobre el minimo definido', () => {
    expect(resolverEstadoStock(0, 5)).toBe('AGOTADO');
  });

  it('AC-03: por debajo del minimo avisa ANTES de agotarse', () => {
    expect(resolverEstadoStock(2, 3)).toBe('POR_AGOTARSE');
  });

  it('AC-04: el limite INCLUYE, igual que esStockBajo hoy', () => {
    expect(resolverEstadoStock(3, 3)).toBe('POR_AGOTARSE');
  });

  it('AC-05: con existencias y sin minimo no hay alarma, hay invitacion', () => {
    expect(resolverEstadoStock(12, 0)).toBe('SIN_MINIMO');
  });

  it('AC-06: por encima del minimo no muestra nada', () => {
    expect(resolverEstadoStock(12, 3)).toBe('OK');
  });
});

describe('sugerirMinimoStock - Feature 038', () => {
  it('AC-07: sugiere el 25% redondeado hacia abajo, con piso de 1', () => {
    expect(sugerirMinimoStock(20)).toBe(5);
    expect(sugerirMinimoStock(10)).toBe(2);
    expect(sugerirMinimoStock(4)).toBe(1);
    expect(sugerirMinimoStock(1)).toBe(1);
  });

  it('AC-07: sin cantidad no sugiere nada', () => {
    expect(sugerirMinimoStock(0)).toBe(0);
  });
});
