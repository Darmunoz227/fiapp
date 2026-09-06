import { Respaldo, RespaldoData, RespaldoConfig } from '../models/respaldo.model';
import { SCHEMA_VERSION } from '../database/schema-version';

export function construirRespaldo(data: RespaldoData, exportadoEn: string, config?: RespaldoConfig): Respaldo {
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
      producciones: data.producciones,
      produccion_items: data.produccion_items,
    },
    ...(config ? { config } : {}),
  };
}
