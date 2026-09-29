import { TestBed } from '@angular/core/testing';
import { DatabaseService } from '../database/database.service';
import { MovimientoDeudaRepository } from './movimiento-deuda.repository';

describe('MovimientoDeudaRepository', () => {
  let repository: MovimientoDeudaRepository;
  let dbSpy: any;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('DatabaseService', ['query', 'ejecutarSQL', 'run']);
    spy.db = jasmine.createSpyObj('SQLiteDB', ['run', 'query']);
    
    TestBed.configureTestingModule({
      providers: [
        MovimientoDeudaRepository,
        { provide: DatabaseService, useValue: spy }
      ]
    });
    repository = TestBed.inject(MovimientoDeudaRepository);
    dbSpy = TestBed.inject(DatabaseService);
  });

  it('deberia crearse', () => {
    expect(repository).toBeTruthy();
  });

  it('deberia registrar un abono actualizando el saldo y guardando el movimiento de forma transaccional', async () => {
    const proveedorId = 'prov-123';
    const montoAbono = 50000;
    
    // Arrange
    if (dbSpy.run) dbSpy.run.and.returnValue(Promise.resolve({ changes: 1 }));
    if (dbSpy.query) dbSpy.query.and.returnValue(Promise.resolve({ changes: 1 }));
    if (dbSpy.db && dbSpy.db.run) dbSpy.db.run.and.returnValue(Promise.resolve({ changes: 1 }));

    // Act (Ahora esperamos éxito total, sin try-catch)
    await repository.registrarAbono(proveedorId, montoAbono, 'Abono parcial');

    // Assert
    const llamadas = (dbSpy.run?.calls.allArgs() || [])
      .concat(dbSpy.query?.calls.allArgs() || [])
      .concat(dbSpy.db?.run?.calls.allArgs() || []);
    
    // Verificamos transaccionalidad y consultas
    const huboInsert = llamadas.some((args: any[]) => args[0] && args[0].toLowerCase().includes('insert into movimientos_deuda'));
    const huboUpdate = llamadas.some((args: any[]) => args[0] && args[0].toLowerCase().includes('update proveedores set saldo_deuda'));
    const huboCommit = llamadas.some((args: any[]) => args[0] && args[0].toUpperCase().includes('COMMIT'));
    
    expect(huboInsert).withContext('Falta el INSERT del movimiento').toBeTrue();
    expect(huboUpdate).withContext('Falta el UPDATE del saldo del proveedor').toBeTrue();
    expect(huboCommit).withContext('Falta el COMMIT de la transaccion').toBeTrue();
  });
});
