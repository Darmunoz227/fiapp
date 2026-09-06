import { SCHEMA_VERSION } from "../database/schema-version";
import { RespaldoData } from "../models/respaldo.model";

export type MotivoRechazo = "SIN_DATA" | "VERSION_INCOMPATIBLE" | "TABLA_FALTANTE" | "TABLA_INVALIDA";

export interface ResultadoValidacion {
  valido: boolean;
  motivo?: MotivoRechazo;
  data?: RespaldoData;
}

const TABLAS = ["clientes", "transacciones", "productos", "movim_inventario", "ventas", "venta_items", "producciones", "produccion_items"];

export function validarRespaldo(entrada: unknown): ResultadoValidacion {
  if (entrada === null || typeof entrada !== "object") {
    return { valido: false, motivo: "SIN_DATA" };
  }

  const raiz = entrada as Record<string, unknown>;

  if (raiz["data"] === null || typeof raiz["data"] !== "object") {
    return { valido: false, motivo: "SIN_DATA" };
  }

  if (raiz["schema_version"] !== SCHEMA_VERSION) {
    return { valido: false, motivo: "VERSION_INCOMPATIBLE" };
  }

  const data = raiz["data"] as Record<string, unknown>;

  for (const tabla of TABLAS) {
    if (!(tabla in data)) {
      return { valido: false, motivo: "TABLA_FALTANTE" };
    }
    if (!Array.isArray(data[tabla])) {
      return { valido: false, motivo: "TABLA_INVALIDA" };
    }
  }

  return { valido: true, data: data as unknown as RespaldoData };
}
