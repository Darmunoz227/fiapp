import { TestBed } from '@angular/core/testing';
import { CsvParserService } from './csv-parser.service';

describe('CsvParserService', () => {
  let service: CsvParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CsvParserService);
  });

  it('debe parsear un producto valido correctamente', () => {
    const csv = "Nombre;Precio;Cantidad_Actual;Costo_Unitario;Stock_Minimo\nCamiseta Puma;45000;10;20000;5";
    const resultado = service.parsear(csv);
    
    expect(resultado.validos.length).toBe(1);
    expect(resultado.errores.length).toBe(0);
    expect(resultado.validos[0]).toEqual({
      nombre: "Camiseta Puma",
      precio: 45000,
      cantidad_actual: 10,
      costo_unitario: 20000,
      stock_minimo: 5
    });
  });

  it('debe reportar error si falta el nombre', () => {
    const csv = "Nombre;Precio;Cantidad_Actual;Costo_Unitario;Stock_Minimo\n;45000;10;20000;5";
    const resultado = service.parsear(csv);
    
    expect(resultado.validos.length).toBe(0);
    expect(resultado.errores.length).toBe(1);
    expect(resultado.errores[0]).toContain("Fila 2: El nombre es obligatorio");
  });

  it('debe asumir 0 en valores numericos vacios o con texto', () => {
    const csv = "Nombre;Precio;Cantidad_Actual;Costo_Unitario;Stock_Minimo\nBuzo Nike;;;texto;";
    const resultado = service.parsear(csv);
    
    expect(resultado.validos.length).toBe(1);
    expect(resultado.validos[0]).toEqual({
      nombre: "Buzo Nike",
      precio: 0,
      cantidad_actual: 0,
      costo_unitario: 0,
      stock_minimo: 0
    });
  });
});
