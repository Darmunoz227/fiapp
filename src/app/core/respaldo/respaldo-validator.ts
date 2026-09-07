import { SCHEMA_VERSION } from "../database/schema-version";
import { RespaldoData, RespaldoConfig } from "../models/respaldo.model";

export type MotivoRechazo = "SIN_DATA" | "VERSION_INCOMPATIBLE" | "TABLA_FALTANTE" | "TABLA_INVALIDA";

export interface ResultadoValidacion {
  valido: boolean;
  motivo?: MotivoRechazo;
  data?: RespaldoData;
  config?: RespaldoConfig;
}

const SCHEMA_VERSION_MINIMA_SOPORTADA = 7;

const TABLAS = ["clientes", "transacciones", "productos", "movim_inventario", "ventas", "venta_items", "producciones", "produccion_items", "gastos", "gastos_recurrentes"];

export function validarRespaldo(entrada: unknown): ResultadoValidacion {
  if (entrada === null || typeof entrada !== "object") {
    return { valido: false, motivo: "SIN_DATA" };
  }

  const raiz = entrada as Record<string, unknown>;

  if (raiz["data"] === null || typeof raiz["data"] !== "object") {
    return { valido: false, motivo: "SIN_DATA" };
  }

  const version = raiz["schema_version"];
  if (typeof version !== "number" || version < SCHEMA_VERSION_MINIMA_SOPORTADA || version > SCHEMA_VERSION) {
    return { valido: false, motivo: "VERSION_INCOMPATIBLE" };
  }

  const data = raiz["data"] as Record<string, unknown>;

  const completo: Record<string, unknown> = { ...data };

  for (const tabla of TABLAS) {
    if (!(tabla in completo)) {
      completo[tabla] = [];
      continue;
    }
    if (!Array.isArray(completo[tabla])) {
      return { valido: false, motivo: "TABLA_INVALIDA" };
    }
  }

  const configCruda = raiz["config"];
  const config =
    configCruda !== null && typeof configCruda === "object" && !Array.isArray(configCruda)
      ? (configCruda as unknown as RespaldoConfig)
      : undefined;

  return { valido: true, data: completo as unknown as RespaldoData, config };
}
