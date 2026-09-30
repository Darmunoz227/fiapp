import { Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import { CajaRepository } from './caja.repository';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class ProveedoresRepository {
  private mockProveedores: any[] = JSON.parse(localStorage.getItem('mockProveedores') || '[]');
  private mockAbonos: any[] = JSON.parse(localStorage.getItem('mockAbonosProv') || '[]');

  constructor(
    private dbService: DatabaseService,
    private cajaRepo: CajaRepository
  ) {}

  private guardarMock() {
    localStorage.setItem('mockProveedores', JSON.stringify(this.mockProveedores));
    localStorage.setItem('mockAbonosProv', JSON.stringify(this.mockAbonos));
  }

  async obtenerProveedores(): Promise<any[]> {
    if (Capacitor.getPlatform() === 'web') return this.mockProveedores;
    return [];
  }

  async crearProveedor(nombre: string, telefono: string): Promise<void> {
    const nuevo = { id: Date.now().toString(), nombre, telefono, saldo_pendiente: 0 };
    if (Capacitor.getPlatform() === 'web') {
      this.mockProveedores.push(nuevo);
      this.guardarMock();
    }
  }

  // --- NUEVO: EDITAR Y ELIMINAR (CRUD) ---
  async actualizarProveedor(id: string, nombre: string, telefono: string): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      const idx = this.mockProveedores.findIndex(p => p.id === id);
      if (idx !== -1) {
        this.mockProveedores[idx].nombre = nombre;
        this.mockProveedores[idx].telefono = telefono;
        this.guardarMock();
      }
    }
  }

  async eliminarProveedor(id: string): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      this.mockProveedores = this.mockProveedores.filter(p => p.id !== id);
      this.guardarMock();
    }
  }
  // ---------------------------------------

  async agregarDeuda(proveedorId: string, monto: number): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      const idx = this.mockProveedores.findIndex(p => p.id === proveedorId);
      if (idx !== -1) {
        this.mockProveedores[idx].saldo_pendiente += monto;
        this.guardarMock();
      }
    }
  }

  async registrarAbono(proveedorId: string, monto: number, metodoPago: 'EFECTIVO' | 'TRANSFERENCIA'): Promise<void> {
    const id = Date.now().toString();
    const fecha = new Date().toISOString();

    if (Capacitor.getPlatform() === 'web') {
      const idx = this.mockProveedores.findIndex(p => p.id === proveedorId);
      if (idx !== -1) {
        this.mockProveedores[idx].saldo_pendiente -= monto;
        this.mockAbonos.push({ id, proveedor_id: proveedorId, monto, metodo_pago: metodoPago, fecha });
        this.guardarMock();
      }
    }

    if (metodoPago === 'EFECTIVO') {
      const prov = this.mockProveedores.find(p => p.id === proveedorId);
      const nombre = prov ? prov.nombre : 'Proveedor';
      await this.cajaRepo.registrarMovimientoCaja('EGRESO', 'Pago Proveedores', monto, `Abono a ${nombre}`);
    }
  }
}
