import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Cliente } from '../models/cliente.model';
import { Transaccion } from '../models/transaccion.model'; 

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db!: SQLiteDBConnection;
  private isInitialized = false;

  private mockWebClientes: Cliente[] = [];
  private mockWebTransacciones: Transaccion[] = []; 

  constructor() {}

  async initializePlugin(): Promise<boolean> {
    try {
      if (Capacitor.getPlatform() === 'web') {
        this.isInitialized = true;
        return true; 
      }
      const dbName = 'fiapp_db';
      this.db = await this.sqlite.createConnection(dbName, false, 'no-encryption', 1, false);
      await this.db.open();
      await this.crearTablas();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error inicializando la base de datos:', error);
      return false;
    }
  }

  private async crearTablas(): Promise<void> {
    const createTablesSQL = 'CREATE TABLE IF NOT EXISTS clientes (id TEXT PRIMARY KEY NOT NULL, nombre TEXT NOT NULL, telefono TEXT NOT NULL, habeas_data_flag INTEGER NOT NULL, fecha_creacion INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS transacciones (id TEXT PRIMARY KEY NOT NULL, cliente_id TEXT NOT NULL, tipo TEXT NOT NULL, monto REAL NOT NULL, concepto TEXT, fecha INTEGER NOT NULL, FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE); CREATE INDEX IF NOT EXISTS transacciones_cliente_id_idx ON transacciones(cliente_id);';
    await this.db.execute(createTablesSQL);
  }

  async crearCliente(cliente: Cliente): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      this.mockWebClientes.push(cliente);
      return; 
    }
    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'INSERT INTO clientes (id, nombre, telefono, habeas_data_flag, fecha_creacion) VALUES (?, ?, ?, ?, ?)';
    const values = [cliente.id, cliente.nombre, cliente.telefono, cliente.habeas_data_flag ? 1 : 0, cliente.fecha_creacion];
    await this.db.run(sql, values);
  }

  async obtenerClientes(): Promise<Cliente[]> {
    if (Capacitor.getPlatform() === 'web') return this.mockWebClientes;
    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'SELECT * FROM clientes ORDER BY fecha_creacion DESC';
    const res = await this.db.query(sql);
    return res.values as Cliente[] || [];
  }

  async obtenerClientePorId(id: string): Promise<Cliente | null> {
    if (Capacitor.getPlatform() === 'web') return this.mockWebClientes.find(c => c.id === id) || null;
    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'SELECT * FROM clientes WHERE id = ?';
    const res = await this.db.query(sql, [id]);
    return res.values && res.values.length > 0 ? res.values[0] as Cliente : null;
  }

  async crearTransaccion(transaccion: Transaccion): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      this.mockWebTransacciones.push(transaccion);
      return;
    }
    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'INSERT INTO transacciones (id, cliente_id, tipo, monto, concepto, fecha) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [transaccion.id, transaccion.cliente_id, transaccion.tipo, transaccion.monto, transaccion.concepto || '', transaccion.fecha];
    await this.db.run(sql, values);
  }

  async obtenerTransaccionesPorCliente(clienteId: string): Promise<Transaccion[]> {
    if (Capacitor.getPlatform() === 'web') {
      return this.mockWebTransacciones.filter(t => t.cliente_id === clienteId).sort((a, b) => b.fecha - a.fecha);
    }
    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'SELECT * FROM transacciones WHERE cliente_id = ? ORDER BY fecha DESC';
    const res = await this.db.query(sql, [clienteId]);
    return res.values as Transaccion[] || [];
  }

  // --- NUEVAS FUNCIONES DE ELIMINACIÓN ---

  async eliminarCliente(id: string): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      // En la web, lo borramos de la memoria temporal (y sus transacciones también)
      this.mockWebClientes = this.mockWebClientes.filter(c => c.id !== id);
      this.mockWebTransacciones = this.mockWebTransacciones.filter(t => t.cliente_id !== id);
      return;
    }
    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'DELETE FROM clientes WHERE id = ?';
    await this.db.run(sql, [id]);
  }

  async eliminarTransaccion(id: string): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      this.mockWebTransacciones = this.mockWebTransacciones.filter(t => t.id !== id);
      return;
    }
    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'DELETE FROM transacciones WHERE id = ?';
    await this.db.run(sql, [id]);
  }
}