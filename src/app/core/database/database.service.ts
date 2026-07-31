import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Cliente } from '../models/cliente.model';
import { MovimInventario } from '../models/movim-inventario.model';
import { ResumenInventario } from '../models/resumen-inventario.model';
import { Producto } from '../models/producto.model';
import { Transaccion } from '../models/transaccion.model'; 
import { Venta } from '../models/venta.model';
import { calcularCostoPromedioPonderado, calcularStockDerivado, esStockBajo } from '../../features/inventario/inventory-calculations';
import { calcularTotalVenta } from '../../features/ventas/ventas-calculations';

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
  private readonly SCHEMA_VERSION = 4;
  private mockWebClientes: Cliente[] = [];
  private mockWebTransacciones: Transaccion[] = [];
  private mockWebProductos: Producto[] = [];
  private mockWebMovimInventario: MovimInventario[] = [];
  private mockWebVentas: Venta[] = [];

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

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS ventas (
        id TEXT PRIMARY KEY NOT NULL,
        producto_id TEXT NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_venta REAL NOT NULL,
        costo_unitario REAL NOT NULL,
        ganancia REAL NOT NULL,
        tipo_pago TEXT NOT NULL,
        cliente_id TEXT DEFAULT NULL,
        fecha INTEGER NOT NULL,
        created_at INTEGER DEFAULT NULL,
        updated_at INTEGER DEFAULT NULL,
        deleted_at INTEGER DEFAULT NULL,
        store_id TEXT DEFAULT NULL,
        created_by TEXT DEFAULT NULL,
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      );
    `);

    await this.db.execute(`
      CREATE INDEX IF NOT EXISTS ventas_producto_id_idx
      ON ventas(producto_id);
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

  async crearMovimiento(movimiento: MovimInventario): Promise<void> {
    return this.ejecutarEnTransaccion(() => this.crearMovimientoInterno(movimiento));
  }

  private async crearMovimientoInterno(movimiento: MovimInventario): Promise<void> {
    const movimientosExistentes = await this.obtenerMovimientosPorProducto(movimiento.producto_id);
    const stockDerivado = calcularStockDerivado(movimientosExistentes);

    if ((movimiento.tipo === 'VENTA' || movimiento.tipo === 'MERMA') && movimiento.cantidad > stockDerivado) {
      throw new Error('Stock insuficiente para registrar el movimiento');
    }

    if (movimiento.tipo === 'COMPRA') {
      const producto = await this.obtenerProductoPorIdInterno(movimiento.producto_id);
      if (producto == null) {
        throw new Error('Producto no encontrado');
      }

      const costoPromedio = calcularCostoPromedioPonderado(
        stockDerivado,
        producto.costo_promedio,
        movimiento.cantidad,
        movimiento.costo_unitario,
      );

      await this.actualizarCostoPromedioProducto(movimiento.producto_id, costoPromedio);
    }

    if (Capacitor.getPlatform() === 'web') {
      this.mockWebMovimInventario.push({ ...movimiento, deleted_at: movimiento.deleted_at ?? null });
      return;
    }

    if (!this.isInitialized) await this.initializePlugin();
    const sql = `
      INSERT INTO movim_inventario (
        id, producto_id, tipo, cantidad, costo_unitario, motivo, fecha,
        actor_id, stock_calculado_anterior, cantidad_fisica, diferencia_calculada,
        created_at, updated_at, deleted_at, store_id, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      movimiento.id,
      movimiento.producto_id,
      movimiento.tipo,
      movimiento.cantidad,
      movimiento.costo_unitario,
      movimiento.motivo ?? null,
      movimiento.fecha,
      movimiento.actor_id ?? null,
      movimiento.stock_calculado_anterior ?? null,
      movimiento.cantidad_fisica ?? null,
      movimiento.diferencia_calculada ?? null,
      movimiento.created_at ?? null,
      movimiento.updated_at ?? null,
      movimiento.deleted_at ?? null,
      movimiento.store_id ?? null,
      movimiento.created_by ?? null,
    ];
    await this.db.run(sql, values);
  }

  private async ejecutarEnTransaccion<T>(operacion: () => Promise<T>): Promise<T> {
    if (Capacitor.getPlatform() === 'web') {
      const snapVentas = [...this.mockWebVentas];
      const snapMovim = [...this.mockWebMovimInventario];
      const snapTransacciones = [...this.mockWebTransacciones];
      const snapProductos = [...this.mockWebProductos];

      try {
        return await operacion();
      } catch (error) {
        this.mockWebVentas = snapVentas;
        this.mockWebMovimInventario = snapMovim;
        this.mockWebTransacciones = snapTransacciones;
        this.mockWebProductos = snapProductos;
        throw error;
      }
    }

    if (!this.isInitialized) await this.initializePlugin();
    await this.db.beginTransaction();

    try {
      const resultado = await operacion();
      await this.db.commitTransaction();
      return resultado;
    } catch (error) {
      await this.db.rollbackTransaction();
      throw error;
    }
  }

  private async insertVenta(venta: Venta): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      this.mockWebVentas.push({ ...venta, deleted_at: venta.deleted_at ?? null });
      return;
    }

    if (!this.isInitialized) await this.initializePlugin();
    const sql = `
      INSERT INTO ventas (
        id, producto_id, cantidad, precio_venta, costo_unitario, ganancia,
        tipo_pago, cliente_id, fecha, created_at, updated_at, deleted_at, store_id, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      venta.id,
      venta.producto_id,
      venta.cantidad,
      venta.precio_venta,
      venta.costo_unitario,
      venta.ganancia,
      venta.tipo_pago,
      venta.cliente_id ?? null,
      venta.fecha,
      venta.created_at ?? null,
      venta.updated_at ?? null,
      venta.deleted_at ?? null,
      venta.store_id ?? null,
      venta.created_by ?? null,
    ];
    await this.db.run(sql, values);
  }

  async registrarVenta(venta: Venta, movimiento: MovimInventario, transaccionFiado?: Transaccion): Promise<void> {
    this.validarMontosVenta(venta);
    return this.ejecutarEnTransaccion(async () => {
      await this.crearMovimientoInterno(movimiento);
      await this.insertVenta(venta);
      if (venta.monto_fiado > 0 && transaccionFiado) {
        await this.crearTransaccion(transaccionFiado);
      }
    });
  }

  async obtenerVentas(): Promise<Venta[]> {
    if (Capacitor.getPlatform() === 'web') {
      return this.filtrarActivos(this.mockWebVentas) as Venta[];
    }

    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'SELECT * FROM ventas WHERE deleted_at IS NULL ORDER BY fecha DESC';
    const res = await this.db.query(sql);
    return res.values as Venta[] || [];
  }

  async obtenerMovimientosPorProducto(productoId: string): Promise<MovimInventario[]> {
    if (Capacitor.getPlatform() === 'web') {
      return this.filtrarActivos(this.mockWebMovimInventario)
        .filter((movimiento) => movimiento.producto_id === productoId)
        .sort((a, b) => a.fecha - b.fecha) as MovimInventario[];
    }

    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'SELECT * FROM movim_inventario WHERE producto_id = ? AND deleted_at IS NULL ORDER BY fecha';
    const res = await this.db.query(sql, [productoId]);
    return res.values as MovimInventario[] || [];
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

  async obtenerResumenInventario(): Promise<ResumenInventario[]> {
    const productos = await this.obtenerProductos();

    const resumenes = await Promise.all(productos.map(async (producto) => {
      const movimientos = await this.obtenerMovimientosPorProducto(producto.id);
      const stockDerivado = calcularStockDerivado(movimientos);

      return {
        producto_id: producto.id,
        stock_derivado: stockDerivado,
        costo_promedio: producto.costo_promedio,
        stock_bajo: esStockBajo(stockDerivado, producto.minimo_stock),
      };
    }));

    return resumenes;
  }

  async softDeleteMovimiento(id: string): Promise<void> {
    const movimiento = await this.obtenerMovimientoPorIdInterno(id);
    if (movimiento != null && movimiento.tipo === 'COMPRA') {
      throw new Error('Las COMPRAS se corrigen con un AJUSTE');
    }

    if (Capacitor.getPlatform() === 'web') {
      this.mockWebMovimInventario = this.mockWebMovimInventario.map((movimientoActual) => (
        movimientoActual.id === id ? { ...movimientoActual, deleted_at: Date.now() } : movimientoActual
      ));
      return;
    }

    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'UPDATE movim_inventario SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL';
    await this.db.run(sql, [Date.now(), id]);
  }

  async restoreMovimiento(id: string): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      this.mockWebMovimInventario = this.mockWebMovimInventario.map((movimientoActual) => (
        movimientoActual.id === id ? { ...movimientoActual, deleted_at: null } : movimientoActual
      ));
      return;
    }

    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'UPDATE movim_inventario SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL';
    await this.db.run(sql, [id]);
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

  private async obtenerMovimientoPorIdInterno(id: string): Promise<MovimInventario | null> {
    if (Capacitor.getPlatform() === 'web') {
      return this.mockWebMovimInventario.find((movimiento) => movimiento.id === id) || null;
    }

    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'SELECT * FROM movim_inventario WHERE id = ?';
    const res = await this.db.query(sql, [id]);
    return res.values && res.values.length > 0 ? res.values[0] as MovimInventario : null;
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

  private async obtenerProductoPorIdInterno(id: string): Promise<Producto | null> {
    if (Capacitor.getPlatform() === 'web') {
      return this.filtrarActivos(this.mockWebProductos).find((producto) => producto.id === id) || null;
    }

    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'SELECT * FROM productos WHERE id = ? AND deleted_at IS NULL';
    const res = await this.db.query(sql, [id]);
    return res.values && res.values.length > 0 ? res.values[0] as Producto : null;
  }

  private async actualizarCostoPromedioProducto(id: string, costoPromedio: number): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      this.mockWebProductos = this.mockWebProductos.map((producto) => (
        producto.id === id ? { ...producto, costo_promedio: costoPromedio } : producto
      ));
      return;
    }

    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'UPDATE productos SET costo_promedio = ? WHERE id = ? AND deleted_at IS NULL';
    await this.db.run(sql, [costoPromedio, id]);
  }

  private validarMontosVenta(venta: Venta): void {
    const contado = venta.monto_contado;
    const fiado = venta.monto_fiado;

    if (contado == null || fiado == null || Number.isNaN(contado) || Number.isNaN(fiado)) {
      throw new Error("Los montos de la venta son obligatorios");
    }

    if (contado < 0 || fiado < 0) {
      throw new Error("Los montos de la venta no pueden ser negativos");
    }

    const total = calcularTotalVenta(venta.precio_venta, venta.cantidad);
    if (Math.abs((contado + fiado) - total) >= 0.01) {
      throw new Error("Los montos no coinciden con el total de la venta");
    }

    if (fiado > 0 && !venta.cliente_id) {
      throw new Error("Debes seleccionar un cliente para el saldo fiado");
    }
  }
}
