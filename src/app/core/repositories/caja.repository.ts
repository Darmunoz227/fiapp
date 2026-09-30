import { Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class CajaRepository {
  // Mock en memoria para pruebas en Web (ng serve)
  private mockWebCajas: any[] = [];

  constructor(private dbService: DatabaseService) {}

  private getDbInstance() {
    const svc = this.dbService as any;
    return svc.db || svc.database || svc.sqliteObject || svc;
  }

  // 1. VERIFICAR SI HAY UNA CAJA ABIERTA
  async obtenerSesionAbierta(): Promise<any> {
    if (Capacitor.getPlatform() === 'web') {
      return this.mockWebCajas.find(c => c.estado === 'ABIERTA') || null;
    }

    try {
      const sql = "SELECT * FROM sesiones_caja WHERE estado = 'ABIERTA' LIMIT 1";
      const db = this.getDbInstance();

      if (db && typeof db.executeSql === 'function') {
        const res = await db.executeSql(sql, []);
        return res?.rows?.length > 0 ? res.rows.item(0) : null;
      } else if (db && typeof db.query === 'function') {
        const res = await db.query(sql, []);
        return res?.values?.length > 0 ? res.values[0] : null;
      }
      return null;
    } catch (e) {
      console.error('Error buscando sesión de caja abierta', e);
      return null;
    }
  }

  // 2. ABRIR UNA NUEVA CAJA
  async abrirCaja(baseInicial: number): Promise<string> {
    const sesionAbierta = await this.obtenerSesionAbierta();
    if (sesionAbierta) throw new Error('Ya existe una sesión de caja abierta.');

    const id = Date.now().toString();
    const fechaApertura = new Date().toISOString();
    const estado = 'ABIERTA';

    if (Capacitor.getPlatform() === 'web') {
      this.mockWebCajas.push({ id, fecha_apertura: fechaApertura, base_inicial: baseInicial, estado });
      return id;
    }

    const sql = `INSERT INTO sesiones_caja (id, fecha_apertura, base_inicial, estado) VALUES (?, ?, ?, ?)`;
    const db = this.getDbInstance();

    try {
      if (db && typeof db.executeSql === 'function') {
        await db.executeSql(sql, [id, fechaApertura, baseInicial, estado]);
      } else if (db && typeof db.query === 'function') {
        await db.query(sql, [id, fechaApertura, baseInicial, estado]);
      } else {
        throw new Error('Motor de base de datos no disponible');
      }
      return id;
    } catch (error) {
      console.error('Error al abrir la caja:', error);
      throw error;
    }
  }
}
