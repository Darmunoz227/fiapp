import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ImportadorCsvPage } from "./importador-csv.page";
import { CsvParserService } from "../../../core/inventario/csv-parser.service";
import { DatabaseService } from "../../../core/database/database.service";
import { ToastController } from "@ionic/angular";

describe("ImportadorCsvPage", () => {
  let component: ImportadorCsvPage;
  let fixture: ComponentFixture<ImportadorCsvPage>;
  let mockCsvService: any;
  let mockDbService: any;
  let mockToastCtrl: any;

  beforeEach(async () => {
    mockCsvService = { parsear: jasmine.createSpy("parsear").and.returnValue({ validos: [{nombre: "P1"}], errores: [] }) };
    mockDbService = { importarProductosCSV: jasmine.createSpy("importarProductosCSV").and.resolveTo() };
    mockToastCtrl = { create: jasmine.createSpy("create").and.resolveTo({ present: jasmine.createSpy("present").and.resolveTo() }) };

    await TestBed.configureTestingModule({
      imports: [ImportadorCsvPage],
      providers: [
        { provide: CsvParserService, useValue: mockCsvService },
        { provide: DatabaseService, useValue: mockDbService },
        { provide: ToastController, useValue: mockToastCtrl }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ImportadorCsvPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("debe cambiar a VISTA_PREVIA y asignar resultado al procesar un texto CSV", async () => {
    await component.procesarTextoCSV("Nombre,Precio\nPrueba,100");
    
    expect(mockCsvService.parsear).toHaveBeenCalled();
    expect(component.estado).toBe("VISTA_PREVIA");
    expect(component.resultado).not.toBeNull();
  });

  it("debe llamar a la BD y resetear estado a INICIO al importar exitosamente", async () => {
    component.estado = "VISTA_PREVIA";
    // Guardamos la referencia ANTES de que el componente la borre
    const mockValidos: any = [{ nombre: "P1", precio: 100, cantidad_actual: 0, costo_unitario: 0, stock_minimo: 0 }];
    component.resultado = { validos: mockValidos, errores: [] };
    
    await component.importar();
    
    expect(mockDbService.importarProductosCSV).toHaveBeenCalledWith(mockValidos);
    expect(component.estado).toBe("INICIO");
    expect(component.resultado).toBeNull();
  });
});
