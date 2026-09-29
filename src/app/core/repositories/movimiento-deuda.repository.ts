import { Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';

@Injectable({
  providedIn: 'root'
})
export class MovimientoDeudaRepository {
  constructor(private dbService: DatabaseService) {}

  // Adaptador universal para aislar la capa de base de datos
  private async ejecutar(sql: string, params: any[] = []): Promise<any> {
    const svc = this.dbService as any;
    const db = svc.db || svc.database || svc.sqliteObject;
    
    // Busca dinamicamente el metodo de ejecucion real
    if (typeof svc.ejecutarSQL === 'function') return await svc.ejecutarSQL(sql, params);
    if (typeof svc.executeSql === 'function') return await svc.executeSql(sql, params);
    if (db && typeof db.executeSql === 'function') return await db.executeSql(sql, params);
    if (db && typeof db.query === 'function') return await db.query(sql, params);
    if (db && typeof db.run === 'function') return await db.run(sql, params);
    
    throw new Error('Metodo de ejecucion SQL no encontrado en DatabaseService');
  }

  async obtenerMovimientos(proveedorId: string): Promise<any[]> {
    try {
      const sql = 'SELECT * FROM movimientos_deuda WHERE proveedor_id = ? ORDER BY fecha DESC';
      const res = await this.ejecutar(sql, [proveedorId]);
      
      // Adaptador para soportar SQLite nativo (Cordova/Capacitor) y Web
      if (res?.rows && typeof res.rows.item === 'function') {
        const items = [];
        for(let i = 0; i < res.rows.length; i++) {
          items.push(res.rows.item(i));
        }
        return items;
      }
      return res?.values || res?.rows || res || [];
    } catch (e) {
      console.error('Error leyendo historial', e);
      return [];
    }
  }

  async registrarAbono(proveedorId: string, monto: number, notas: string = ''): Promise<void> {
    const id = Date.now().toString() + '-' + Math.floor(Math.random() * 1000);
    const fecha = new Date().toISOString();
    const tipo = 'ABONO';

    const sqlInsert = `INSERT INTO movimientos_deuda (id, proveedor_id, tipo, monto, fecha, notas) VALUES (?, ?, ?, ?, ?, ?)`;
    const sqlUpdate = `UPDATE proveedores SET saldo_deuda = COALESCE(saldo_deuda, 0) - ? WHERE id = ?`;

    try {
      // Ejecucion secuencial segura (sin BEGIN TRANSACTION que suele fallar en emuladores web)
      await this.ejecutar(sqlInsert, [id, proveedorId, tipo, monto, fecha, notas]);
      await this.ejecutar(sqlUpdate, [monto, proveedorId]);
    } catch (error) {
      console.error('Error registrando abono:', error);
      throw error;
    }
  }
}
