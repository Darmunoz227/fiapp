import { Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class CajaRepository {
  // Mock en memoria para pruebas en Web (ng serve)
  private mockWebCajas: any[] = JSON.parse(localStorage.getItem('mockWebCajas') || '[]');
  private mockWebMovimientos: any[] = JSON.parse(localStorage.getItem('mockWebMovimientos') || '[]');

  private guardarMockWeb() {
    localStorage.setItem('mockWebCajas', JSON.stringify(this.mockWebCajas));
    localStorage.setItem('mockWebMovimientos', JSON.stringify(this.mockWebMovimientos));
  }

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

  async registrarMovimientoCaja(tipo: 'INGRESO' | 'EGRESO', categoria: string, monto: number, descripcion: string = ''): Promise<void> {
    const sesion = await this.obtenerSesionAbierta();
    if (!sesion) return;

    const id = Date.now().toString();
    const fecha = new Date().toISOString();

    if (Capacitor.getPlatform() === 'web') {
      this.mockWebMovimientos.push({ id, sesion_id: sesion.id, tipo, categoria, monto, descripcion, fecha });
      this.guardarMockWeb();
      console.log(`[Web Mock] Movimiento: ${tipo} ${monto}`);
      return;
    }

    const sql = `INSERT INTO movimientos_caja (id, sesion_id, tipo, categoria, monto, descripcion, fecha) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const db = this.getDbInstance();
    try {
      if (db && typeof db.executeSql === 'function') {
        await db.executeSql(sql, [id, sesion.id, tipo, categoria, monto, descripcion, fecha]);
      } else if (db && typeof db.query === 'function') {
        await db.query(sql, [id, sesion.id, tipo, categoria, monto, descripcion, fecha]);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async obtenerMovimientosPorSesion(sesionId: string): Promise<any[]> {
    if (Capacitor.getPlatform() === 'web') return this.mockWebMovimientos.filter(m => m.sesion_id === sesionId);
    const db = this.getDbInstance();
    try {
      const res = await db.query('SELECT * FROM movimientos_caja WHERE sesion_id = ? ORDER BY fecha DESC', [sesionId]);
      return res.values ?? [];
    } catch (e) { console.error(e); return []; }
  }

  async cerrarCaja(sesionId: string, saldoEsperado: number, saldoFisico: number, diferencia: number, nota: string): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      const idx = this.mockWebCajas.findIndex(c => c.id === sesionId);
      if (idx !== -1) {
        this.mockWebCajas[idx] = { ...this.mockWebCajas[idx], estado: 'CERRADA', fecha_cierre: new Date().toISOString(), saldo_esperado: saldoEsperado, saldo_fisico: saldoFisico, diferencia, nota_cierre: nota };
        this.guardarMockWeb();
      }
      return;
    }
    const fecha = new Date().toISOString();
    const db = this.getDbInstance();
    const sql = `UPDATE sesiones_caja SET estado = 'CERRADA', fecha_cierre = ?, saldo_esperado = ?, saldo_fisico = ?, diferencia = ?, nota_cierre = ? WHERE id = ?`;
    try {
      if (db.executeSql) {
        await db.executeSql(sql, [fecha, saldoEsperado, saldoFisico, diferencia, nota, sesionId]);
      } else {
        await db.query(sql, [fecha, saldoEsperado, saldoFisico, diferencia, nota, sesionId]);
      }
    } catch (e) { console.error(e); throw e; }
  }

  async obtenerHistorialCajas(): Promise<any[]> {
    if (Capacitor.getPlatform() === 'web') {
      return this.mockWebCajas.filter(c => c.estado === 'CERRADA').sort((a, b) => b.fecha_cierre > a.fecha_cierre ? 1 : -1);
    }
    const db = this.getDbInstance();
    try {
      const sql = "SELECT * FROM sesiones_caja WHERE estado = 'CERRADA' ORDER BY fecha_cierre DESC LIMIT 30";
      const res = await db.query(sql, []);
      return res.values ?? [];
    } catch (e) { console.error(e); return []; }
  }
}