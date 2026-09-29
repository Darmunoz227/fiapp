import { TestBed } from '@angular/core/testing';
import { DatabaseService } from '../database/database.service';
import { MovimientoDeudaRepository } from './movimiento-deuda.repository';

describe('MovimientoDeudaRepository', () => {
  let repository: MovimientoDeudaRepository;
  let dbSpy: jasmine.SpyObj<DatabaseService>;

  beforeEach(() => {
    // Espiamos el DatabaseService para verificar qué sentencias SQL se ejecutan
    const spy = jasmine.createSpyObj('DatabaseService', ['run', 'query']);
    TestBed.configureTestingModule({
      providers: [
        MovimientoDeudaRepository,
        { provide: DatabaseService, useValue: spy }
      ]
    });
    repository = TestBed.inject(MovimientoDeudaRepository);
    dbSpy = TestBed.inject(DatabaseService) as jasmine.SpyObj<DatabaseService>;
  });

  it('deberia crearse', () => {
    expect(repository).toBeTruthy();
  });

  it('deberia registrar un abono actualizando el saldo y guardando el movimiento', async () => {
    // Arrange
    const proveedorId = 'prov-123';
    const montoAbono = 50000;
    dbSpy.run.and.returnValue(Promise.resolve({ changes: 1 } as any));

    // Act
    try {
        await repository.registrarAbono(proveedorId, montoAbono, 'Abono parcial');
    } catch (e) {
        // Capturamos el error intencional del esqueleto para evaluar las llamadas a BD
    }

    // Assert
    expect(dbSpy.run).toHaveBeenCalled();
    const llamadas = dbSpy.run.calls.allArgs();
    
    // Verificamos que exista una insercion del movimiento y una actualizacion del saldo
    const huboInsert = llamadas.some(args => args[0].toLowerCase().includes('insert into movimientos_deuda'));
    const huboUpdate = llamadas.some(args => args[0].toLowerCase().includes('update proveedores set saldo_deuda'));
    
    expect(huboInsert).withContext('Falta el INSERT del movimiento').toBeTrue();
    expect(huboUpdate).withContext('Falta el UPDATE del saldo del proveedor').toBeTrue();
  });
});
