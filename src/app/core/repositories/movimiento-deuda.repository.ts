import { Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';

@Injectable({
  providedIn: 'root'
})
export class MovimientoDeudaRepository {
  constructor(private dbService: DatabaseService) {}

  
  async obtenerMovimientos(proveedorId: string): Promise<any[]> {
    const db = (this.dbService as any).db || this.dbService;
    const sql = 'SELECT * FROM movimientos_deuda WHERE proveedor_id = ? ORDER BY fecha DESC';
    try {
      const res = await db.query(sql, [proveedorId]);
      return res?.values || [];
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
    const valuesInsert = [id, proveedorId, tipo, monto, fecha, notas];

    // COALESCE asegura que si saldo_deuda es nulo, lo trate como 0 antes de restar
    const sqlUpdate = `UPDATE proveedores SET saldo_deuda = COALESCE(saldo_deuda, 0) - ? WHERE id = ?`;
    const valuesUpdate = [monto, proveedorId];

    // Obtenemos la conexion a SQLite (soportando tanto produccion como el mock del test)
    const db = (this.dbService as any).db || this.dbService;

    try {
      await db.run('BEGIN TRANSACTION');
      await db.run(sqlInsert, valuesInsert);
      await db.run(sqlUpdate, valuesUpdate);
      await db.run('COMMIT');
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }
}
