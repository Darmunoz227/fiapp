import { Respaldo, RespaldoData } from '../models/respaldo.model';
import { SCHEMA_VERSION } from '../database/schema-version';

export function construirRespaldo(data: RespaldoData, exportadoEn: string): Respaldo {
  return {
    schema_version: SCHEMA_VERSION,
    exported_at: exportadoEn,
    data: {
      clientes: data.clientes,
      transacciones: data.transacciones,
      productos: data.productos,
      movim_inventario: data.movim_inventario,
      ventas: data.ventas,
      venta_items: data.venta_items,
    },
  };
}
