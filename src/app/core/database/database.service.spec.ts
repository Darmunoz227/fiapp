import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';

import { DatabaseService } from './database.service';
import { Cliente } from '../models/cliente.model';
import { Transaccion } from '../models/transaccion.model';

describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DatabaseService],
    });

    service = TestBed.inject(DatabaseService);
    spyOn(Capacitor, 'getPlatform').and.returnValue('web');
  });

  function crearClienteParcial(overrides: Partial<Cliente> = {}): Cliente {
    return {
      id: overrides.id ?? 'cliente-1',
      nombre: overrides.nombre ?? 'Cliente 1',
      telefono: overrides.telefono ?? '3001234567',
      habeas_data_flag: overrides.habeas_data_flag ?? true,
      fecha_creacion: overrides.fecha_creacion ?? Date.now(),
      deleted_at: overrides.deleted_at ?? null,
      created_at: overrides.created_at ?? null,
      updated_at: overrides.updated_at ?? null,
      store_id: overrides.store_id ?? null,
      created_by: overrides.created_by ?? null,
    };
  }

  function crearTransaccionParcial(overrides: Partial<Transaccion> = {}): Transaccion {
    return {
      id: overrides.id ?? 'transaccion-1',
      cliente_id: overrides.cliente_id ?? 'cliente-1',
      tipo: overrides.tipo ?? 'fiado',
      monto: overrides.monto ?? 100,
      concepto: overrides.concepto ?? 'Fiado inicial',
      fecha: overrides.fecha ?? Date.now(),
      deleted_at: overrides.deleted_at ?? null,
      created_at: overrides.created_at ?? null,
      updated_at: overrides.updated_at ?? null,
      store_id: overrides.store_id ?? null,
      created_by: overrides.created_by ?? null,
    };
  }

  it('softDeleteCliente hides the client from obtenerClientes but keeps the deleted_at mark internally', async () => {
    const cliente = crearClienteParcial({ id: 'cliente-1' });
    await service.crearCliente(cliente);

    await service.softDeleteCliente('cliente-1');

    const clientesVisibles = await service.obtenerClientes();
    expect(clientesVisibles.length).toBe(0);

    const mockClientes = (service as any).mockWebClientes as Cliente[];
    expect(mockClientes.length).toBe(1);
    expect(mockClientes[0].id).toBe('cliente-1');
    expect(mockClientes[0].deleted_at).not.toBeNull();
  });

  it('restoreCliente brings a soft-deleted client back into obtenerClientes', async () => {
    const cliente = crearClienteParcial({ id: 'cliente-1' });
    await service.crearCliente(cliente);
    await service.softDeleteCliente('cliente-1');

    await service.restoreCliente('cliente-1');

    const clientesVisibles = await service.obtenerClientes();
    expect(clientesVisibles.length).toBe(1);
    expect(clientesVisibles[0].id).toBe('cliente-1');
    expect(clientesVisibles[0].deleted_at ?? null).toBeNull();
  });

  it('contarClientes excludes soft-deleted clients', async () => {
    await service.crearCliente(crearClienteParcial({ id: 'cliente-1' }));
    await service.crearCliente(crearClienteParcial({ id: 'cliente-2' }));
    await service.crearCliente(crearClienteParcial({ id: 'cliente-3' }));

    await service.softDeleteCliente('cliente-2');

    await expectAsync(service.contarClientes()).toBeResolvedTo(2);
  });

  it('obtenerClientePorId returns null for a soft-deleted client', async () => {
    await service.crearCliente(crearClienteParcial({ id: 'cliente-1' }));
    await service.softDeleteCliente('cliente-1');

    await expectAsync(service.obtenerClientePorId('cliente-1')).toBeResolvedTo(null);
  });

  it('softDeleteTransaccion excludes the transaction from obtenerTransaccionesPorCliente', async () => {
    await service.crearCliente(crearClienteParcial({ id: 'cliente-1' }));
    await service.crearTransaccion(crearTransaccionParcial({ id: 'transaccion-1', cliente_id: 'cliente-1' }));

    await service.softDeleteTransaccion('transaccion-1');

    const transaccionesVisibles = await service.obtenerTransaccionesPorCliente('cliente-1');
    expect(transaccionesVisibles.length).toBe(0);

    const mockTransacciones = (service as any).mockWebTransacciones as Transaccion[];
    expect(mockTransacciones.length).toBe(1);
    expect(mockTransacciones[0].id).toBe('transaccion-1');
    expect(mockTransacciones[0].deleted_at).not.toBeNull();
  });

  it('restoreTransaccion brings a soft-deleted transaction back into obtenerTransaccionesPorCliente', async () => {
    await service.crearCliente(crearClienteParcial({ id: 'cliente-1' }));
    await service.crearTransaccion(crearTransaccionParcial({ id: 'transaccion-1', cliente_id: 'cliente-1' }));
    await service.softDeleteTransaccion('transaccion-1');

    await service.restoreTransaccion('transaccion-1');

    const transaccionesVisibles = await service.obtenerTransaccionesPorCliente('cliente-1');
    expect(transaccionesVisibles.length).toBe(1);
    expect(transaccionesVisibles[0].id).toBe('transaccion-1');
    expect(transaccionesVisibles[0].deleted_at ?? null).toBeNull();
  });
});
