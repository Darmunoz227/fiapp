import { validarRespaldo } from './respaldo-validator';
import { SCHEMA_VERSION } from '../database/schema-version';

describe('validarRespaldo', () => {
  const tablas = { clientes: [], transacciones: [], productos: [], movim_inventario: [], ventas: [], venta_items: [], producciones: [], produccion_items: [] };
  const valido = { schema_version: SCHEMA_VERSION, exported_at: '2026-08-06T00:00:00.000Z', data: tablas };

  it('acepta un respaldo bien formado', () => {
    const r = validarRespaldo(valido);
    expect(r.valido).toBe(true);
  });

  it('rechaza si schema_version no coincide', () => {
    const r = validarRespaldo({ ...valido, schema_version: SCHEMA_VERSION + 1 });
    expect(r.valido).toBe(false);
    expect(r.motivo).toBe('VERSION_INCOMPATIBLE');
  });

  it('rechaza si falta la clave data', () => {
    const r = validarRespaldo({ schema_version: SCHEMA_VERSION, exported_at: 'x' });
    expect(r.valido).toBe(false);
    expect(r.motivo).toBe('SIN_DATA');
  });

  it('rellena vacia una tabla ausente en vez de rechazar (Feature 031)', () => {
    const sinVentas = { ...tablas };
    delete (sinVentas as Record<string, unknown>)['ventas'];
    const r = validarRespaldo({ ...valido, data: sinVentas });
    expect(r.valido).toBe(true);
    expect(r.data?.ventas).toEqual([]);
    expect(r.data?.clientes).toEqual([]);
  });

  it('rellena vacia producciones si el archivo no la trae', () => {
    const sinProducciones = { ...tablas };
    delete (sinProducciones as Record<string, unknown>)['producciones'];
    const r = validarRespaldo({ ...valido, data: sinProducciones });
    expect(r.valido).toBe(true);
    expect(r.data?.producciones).toEqual([]);
  });

  it('rellena vacia produccion_items si el archivo no la trae', () => {
    const sinItems = { ...tablas };
    delete (sinItems as Record<string, unknown>)['produccion_items'];
    const r = validarRespaldo({ ...valido, data: sinItems });
    expect(r.valido).toBe(true);
    expect(r.data?.produccion_items).toEqual([]);
  });

  it('acepta un respaldo v7 y rellena vacias las tablas de produccion', () => {
    const v7 = { ...tablas } as Record<string, unknown>;
    delete v7['producciones'];
    delete v7['produccion_items'];
    const r = validarRespaldo({ schema_version: 7, exported_at: 'x', data: v7 });
    expect(r.valido).toBe(true);
    expect(r.data?.producciones).toEqual([]);
    expect(r.data?.produccion_items).toEqual([]);
  });

  it('rechaza una version mayor a la actual', () => {
    const r = validarRespaldo({ ...valido, schema_version: SCHEMA_VERSION + 1 });
    expect(r.valido).toBe(false);
    expect(r.motivo).toBe('VERSION_INCOMPATIBLE');
  });

  it('rechaza una version anterior al piso soportado (menor a 7)', () => {
    const r = validarRespaldo({ ...valido, schema_version: 6 });
    expect(r.valido).toBe(false);
    expect(r.motivo).toBe('VERSION_INCOMPATIBLE');
  });

  it('rechaza si una tabla no es arreglo', () => {
    const r = validarRespaldo({ ...valido, data: { ...tablas, productos: 'nope' } });
    expect(r.valido).toBe(false);
    expect(r.motivo).toBe('TABLA_INVALIDA');
  });

  it('rechaza null o cualquier cosa que no sea objeto', () => {
    expect(validarRespaldo(null).motivo).toBe('SIN_DATA');
    expect(validarRespaldo('texto').motivo).toBe('SIN_DATA');
  });
});
