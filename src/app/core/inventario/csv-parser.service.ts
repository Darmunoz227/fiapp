import { Injectable } from "@angular/core";

export interface ProductoCsv {
  nombre: string;
  precio: number;
  cantidad_actual: number;
  costo_unitario: number;
  stock_minimo: number;
}

export interface ResultadoCsv {
  validos: ProductoCsv[];
  errores: string[];
}

@Injectable({ providedIn: "root" })
export class CsvParserService {
  parsear(csvTexto: string): ResultadoCsv {
    const validos: ProductoCsv[] = [];
    const errores: string[] = [];

    if (!csvTexto) return { validos, errores };

    const lineas = csvTexto.split(/\r?\n/);
    if (lineas.length < 2) return { validos, errores };

    for (let i = 1; i < lineas.length; i++) {
      const linea = lineas[i].trim();
      if (!linea) continue;

      const columnas = linea.split(",");
      const nombre = (columnas[0] || "").trim();

      if (!nombre) {
        errores.push(`Fila ${i + 1}: El nombre es obligatorio`);
        continue;
      }

      validos.push({
        nombre,
        precio: this.parsearNumero(columnas[1]),
        cantidad_actual: this.parsearNumero(columnas[2]),
        costo_unitario: this.parsearNumero(columnas[3]),
        stock_minimo: this.parsearNumero(columnas[4])
      });
    }

    return { validos, errores };
  }

  private parsearNumero(valor: string | undefined): number {
    if (!valor) return 0;
    const num = parseFloat(valor.trim());
    return isNaN(num) ? 0 : Math.max(0, num);
  }
}
