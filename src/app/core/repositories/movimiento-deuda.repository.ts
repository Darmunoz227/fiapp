import { Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class MovimientoDeudaRepository {
  // Arreglo en memoria para soportar pruebas en navegador web (ng serve)
  private mockWebMovimientos: any[] = [];

  constructor(private dbService: DatabaseService) {}

  async obtenerMovimientos(proveedorId: string): Promise<any[]> {
    // 1. MODO WEB (Navegador)
    if (Capacitor.getPlatform() === 'web') {
      return this.mockWebMovimientos
        .filter(m => m.proveedor_id === proveedorId)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }

    // 2. MODO NATIVO (iOS / Android)
    try {
      const sql = 'SELECT * FROM movimientos_deuda WHERE proveedor_id = ? ORDER BY fecha DESC';
      const svc = this.dbService as any;
      if (typeof svc.ejecutarRun === 'function') {
        const res = await svc.ejecutarRun(sql, [proveedorId]);
        if (res && res.values) return res.values;
        if (Array.isArray(res)) return res;
        if (res?.rows) {
          const items = [];
          for (let i = 0; i < res.rows.length; i++) items.push(res.rows.item(i));
          return items;
        }
      }
      return [];
    } catch (e) {
      console.error('Error leyendo historial', e);
      return [];
    }
  }

  async registrarMovimiento(proveedorId: string, tipo: 'ABONO' | 'CARGO', monto: number, notas: string = ''): Promise<void> {
    const id = Date.now().toString() + '-' + Math.floor(Math.random() * 1000);
    const fecha = new Date().toISOString();

    // 1. MODO WEB (Navegador)
    if (Capacitor.getPlatform() === 'web') {
      // Guardar el movimiento en memoria
      this.mockWebMovimientos.push({ id, proveedor_id: proveedorId, tipo, monto, fecha, notas });
      
      // Actualizar el saldo directamente en el mock del DatabaseService
      const svc = this.dbService as any;
      if (svc.mockWebProveedores) {
        const index = svc.mockWebProveedores.findIndex((p: any) => p.id === proveedorId);
        if (index >= 0) {
          const deudaActual = svc.mockWebProveedores[index].saldo_deuda || 0;
          svc.mockWebProveedores[index].saldo_deuda = tipo === 'CARGO' 
            ? deudaActual + monto 
            : deudaActual - monto;
        }
      }
      return; // Salimos sin ejecutar SQL
    }

    // 2. MODO NATIVO (iOS / Android)
    const sqlInsert = `INSERT INTO movimientos_deuda (id, proveedor_id, tipo, monto, fecha, notas) VALUES (?, ?, ?, ?, ?, ?)`;
    const operador = tipo === 'CARGO' ? '+' : '-';
    const sqlUpdate = `UPDATE proveedores SET saldo_deuda = COALESCE(saldo_deuda, 0) ${operador} ? WHERE id = ?`;

    try {
      const svc = this.dbService as any;
      // Asegurar que el plugin este iniciado
      if (!svc.isInitialized && typeof svc.initializePlugin === 'function') {
        await svc.initializePlugin();
      }
      
      if (typeof svc.ejecutarRun === 'function') {
        await svc.ejecutarRun(sqlInsert, [id, proveedorId, tipo, monto, fecha, notas]);
        await svc.ejecutarRun(sqlUpdate, [monto, proveedorId]);
      } else {
        throw new Error('No se pudo acceder a ejecutarRun en entorno nativo');
      }
    } catch (error) {
      console.error('Error registrando movimiento nativo:', error);
      throw error;
    }
  }
}
