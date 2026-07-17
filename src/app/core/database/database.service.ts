import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Cliente } from '../models/cliente.model';
import { MovimInventario } from '../models/movim-inventario.model';
import { Producto } from '../models/producto.model';
import { Transaccion } from '../models/transaccion.model'; 

type RowWithDeletedAt = {
  deleted_at?: number | null;
};

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db!: SQLiteDBConnection;
  private isInitialized = false;

  private readonly DB_NAME = 'fiapp_db';
  private readonly SCHEMA_VERSION = 3;
  private mockWebClientes: Cliente[] = [];
  private mockWebTransacciones: Transaccion[] = [];
  private mockWebProductos: Producto[] = [];
  private mockWebMovimInventario: MovimInventario[] = [];

  async initializePlugin(): Promise<boolean> {
    try {
      if (Capacitor.getPlatform() === 'web') {
        this.isInitialized = true;
        return true;
      }

      this.db = await this.sqlite.createConnection(this.DB_NAME, false, 'no-encryption', 1, false);
      await this.db.open();
      await this.habilitarForeignKeys();
      await this.asegurarEsquema();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error inicializando la base de datos:', error);
      return false;
    }
  }

  private async habilitarForeignKeys(): Promise<void> {
    await this.db.execute('PRAGMA foreign_keys = ON;');
  }

  private async asegurarEsquema(): Promise<void> {
    await this.crearTablasSiFaltan();

    const versionActual = await this.obtenerVersionEsquema();
    if (versionActual < this.SCHEMA_VERSION) {
      await this.migrarEsquemaSiNecesario();
      await this.establecerVersionEsquema(this.SCHEMA_VERSION);
    }
  }

  private async crearTablasSiFaltan(): Promise<void> {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS clientes (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        telefono TEXT NOT NULL,
        habeas_data_flag INTEGER NOT NULL,
        fecha_creacion INTEGER NOT NULL,
        created_at INTEGER DEFAULT NULL,
        updated_at INTEGER DEFAULT NULL,
        deleted_at INTEGER DEFAULT NULL,
        store_id TEXT DEFAULT NULL,
        created_by TEXT DEFAULT NULL
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS transacciones (
        id TEXT PRIMARY KEY NOT NULL,
        cliente_id TEXT NOT NULL,
        tipo TEXT NOT NULL,
        monto REAL NOT NULL,
        concepto TEXT,
        fecha INTEGER NOT NULL,
        created_at INTEGER DEFAULT NULL,
        updated_at INTEGER DEFAULT NULL,
        deleted_at INTEGER DEFAULT NULL,
        store_id TEXT DEFAULT NULL,
        created_by TEXT DEFAULT NULL,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
      );
    `);

    await this.db.execute(`
      CREATE INDEX IF NOT EXISTS transacciones_cliente_id_idx
      ON transacciones(cliente_id);
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS productos (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        precio_venta REAL NOT NULL,
        tipo_venta TEXT NOT NULL,
        minimo_stock INTEGER NOT NULL,
        costo_promedio REAL NOT NULL,
        created_at INTEGER DEFAULT NULL,
        updated_at INTEGER DEFAULT NULL,
        deleted_at INTEGER DEFAULT NULL,
        store_id TEXT DEFAULT NULL,
        created_by TEXT DEFAULT NULL
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS movim_inventario (
        id TEXT PRIMARY KEY NOT NULL,
        producto_id TEXT NOT NULL,
        tipo TEXT NOT NULL,
        cantidad INTEGER NOT NULL,
        costo_unitario REAL NOT NULL,
        motivo TEXT,
        fecha INTEGER NOT NULL,
        actor_id TEXT DEFAULT NULL,
        stock_calculado_anterior INTEGER DEFAULT NULL,
        cantidad_fisica INTEGER DEFAULT NULL,
        diferencia_calculada INTEGER DEFAULT NULL,
        created_at INTEGER DEFAULT NULL,
        updated_at INTEGER DEFAULT NULL,
        deleted_at INTEGER DEFAULT NULL,
        store_id TEXT DEFAULT NULL,
        created_by TEXT DEFAULT NULL,
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      );
    `);

    await this.db.execute(`
      CREATE INDEX IF NOT EXISTS movim_inventario_producto_id_idx
      ON movim_inventario(producto_id);
    `);
  }

  private async migrarEsquemaSiNecesario(): Promise<void> {
    await this.agregarColumnaSiFalta('clientes', 'created_at', 'INTEGER DEFAULT NULL');
    await this.agregarColumnaSiFalta('clientes', 'updated_at', 'INTEGER DEFAULT NULL');
    await this.agregarColumnaSiFalta('clientes', 'deleted_at', 'INTEGER DEFAULT NULL');
    await this.agregarColumnaSiFalta('clientes', 'store_id', 'TEXT DEFAULT NULL');
    await this.agregarColumnaSiFalta('clientes', 'created_by', 'TEXT DEFAULT NULL');

    await this.agregarColumnaSiFalta('transacciones', 'created_at', 'INTEGER DEFAULT NULL');
    await this.agregarColumnaSiFalta('transacciones', 'updated_at', 'INTEGER DEFAULT NULL');
    await this.agregarColumnaSiFalta('transacciones', 'deleted_at', 'INTEGER DEFAULT NULL');
    await this.agregarColumnaSiFalta('transacciones', 'store_id', 'TEXT DEFAULT NULL');
    await this.agregarColumnaSiFalta('transacciones', 'created_by', 'TEXT DEFAULT NULL');
  }

  private async agregarColumnaSiFalta(tabla: string, columna: string, definicion: string): Promise<void> {
    const columnas = await this.obtenerColumnas(tabla);
    if (!columnas.has(columna)) {
      await this.db.execute(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion};`);
    }
  }

  private async obtenerColumnas(tabla: string): Promise<Set<string>> {
    const resultado = await this.db.query(`PRAGMA table_info(${tabla});`);
    const filas = (resultado.values ?? []) as Array<{ name?: string }>;
    return new Set(filas.map((fila) => fila.name).filter((name): name is string => Boolean(name)));
  }

  private async obtenerVersionEsquema(): Promise<number> {
    const resultado = await this.db.query('PRAGMA user_version;');
    const fila = resultado.values?.[0] as { user_version?: number | string } | undefined;
    return Number(fila?.user_version ?? 0);
  }

  private async establecerVersionEsquema(version: number): Promise<void> {
    await this.db.execute(`PRAGMA user_version = ${version};`);
  }

  private filtrarActivos<T extends RowWithDeletedAt>(registros: T[]): T[] {
    return registros.filter((registro) => registro.deleted_at == null);
  }

  async crearCliente(cliente: Cliente): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      this.mockWebClientes.push({ ...cliente, deleted_at: cliente.deleted_at ?? null });
      return;
    }
    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'INSERT INTO clientes (id, nombre, telefono, habeas_data_flag, fecha_creacion) VALUES (?, ?, ?, ?, ?)';
    const values = [cliente.id, cliente.nombre, cliente.telefono, cliente.habeas_data_flag ? 1 : 0, cliente.fecha_creacion];
    await this.db.run(sql, values);
  }

  async obtenerClientes(): Promise<Cliente[]> {
    if (Capacitor.getPlatform() === 'web') return this.filtrarActivos(this.mockWebClientes) as Cliente[];
    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'SELECT * FROM clientes WHERE deleted_at IS NULL ORDER BY fecha_creacion DESC';
    const res = await this.db.query(sql);
    return res.values as Cliente[] || [];
  }

  async contarClientes(): Promise<number> {
    if (Capacitor.getPlatform() === 'web') {
      return this.filtrarActivos(this.mockWebClientes).length;
    }

    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'SELECT COUNT(*) as total FROM clientes WHERE deleted_at IS NULL';
    const res = await this.db.query(sql);
    const total = res.values?.[0] as { total?: number | string } | undefined;
    return Number(total?.total ?? 0);
  }

  async obtenerClientePorId(id: string): Promise<Cliente | null> {
    if (Capacitor.getPlatform() === 'web') return this.mockWebClientes.find((c) => c.id === id && c.deleted_at == null) || null;
    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'SELECT * FROM clientes WHERE id = ? AND deleted_at IS NULL';
    const res = await this.db.query(sql, [id]);
    return res.values && res.values.length > 0 ? res.values[0] as Cliente : null;
  }

  async crearTransaccion(transaccion: Transaccion): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      this.mockWebTransacciones.push({ ...transaccion, deleted_at: transaccion.deleted_at ?? null });
      return;
    }
    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'INSERT INTO transacciones (id, cliente_id, tipo, monto, concepto, fecha) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [transaccion.id, transaccion.cliente_id, transaccion.tipo, transaccion.monto, transaccion.concepto || '', transaccion.fecha];
    await this.db.run(sql, values);
  }

  async crearProducto(producto: Producto): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      this.mockWebProductos.push({ ...producto, deleted_at: producto.deleted_at ?? null });
      return;
    }

    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'INSERT INTO productos (id, nombre, precio_venta, tipo_venta, minimo_stock, costo_promedio) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [producto.id, producto.nombre, producto.precio_venta, producto.tipo_venta, producto.minimo_stock, producto.costo_promedio];
    await this.db.run(sql, values);
  }

  async obtenerTransaccionesPorCliente(clienteId: string): Promise<Transaccion[]> {
    if (Capacitor.getPlatform() === 'web') {
      return this.filtrarActivos(this.mockWebTransacciones)
        .filter((t) => t.cliente_id === clienteId)
        .sort((a, b) => b.fecha - a.fecha) as Transaccion[];
    }
    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'SELECT * FROM transacciones WHERE cliente_id = ? AND deleted_at IS NULL ORDER BY fecha DESC';
    const res = await this.db.query(sql, [clienteId]);
    return res.values as Transaccion[] || [];
  }

  async obtenerProductos(): Promise<Producto[]> {
    if (Capacitor.getPlatform() === 'web') {
      return this.filtrarActivos(this.mockWebProductos) as Producto[];
    }

    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'SELECT * FROM productos WHERE deleted_at IS NULL ORDER BY nombre';
    const res = await this.db.query(sql);
    return res.values as Producto[] || [];
  }

  async softDeleteCliente(id: string): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      this.mockWebClientes = this.mockWebClientes.map((cliente) => (
        cliente.id === id ? { ...cliente, deleted_at: Date.now() } : cliente
      ));
      return;
    }

    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'UPDATE clientes SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL';
    await this.db.run(sql, [Date.now(), id]);
  }

  async restoreCliente(id: string): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      this.mockWebClientes = this.mockWebClientes.map((cliente) => (
        cliente.id === id ? { ...cliente, deleted_at: null } : cliente
      ));
      return;
    }

    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'UPDATE clientes SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL';
    await this.db.run(sql, [id]);
  }

  async softDeleteTransaccion(id: string): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      this.mockWebTransacciones = this.mockWebTransacciones.map((transaccion) => (
        transaccion.id === id ? { ...transaccion, deleted_at: Date.now() } : transaccion
      ));
      return;
    }

    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'UPDATE transacciones SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL';
    await this.db.run(sql, [Date.now(), id]);
  }

  async restoreTransaccion(id: string): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      this.mockWebTransacciones = this.mockWebTransacciones.map((transaccion) => (
        transaccion.id === id ? { ...transaccion, deleted_at: null } : transaccion
      ));
      return;
    }

    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'UPDATE transacciones SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL';
    await this.db.run(sql, [id]);
  }
}