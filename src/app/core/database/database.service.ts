import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Cliente } from '../models/cliente.model';
import { MovimInventario } from '../models/movim-inventario.model';
import { ResumenInventario } from '../models/resumen-inventario.model';
import { Producto } from '../models/producto.model';
import { Transaccion } from '../models/transaccion.model'; 
import { VentaConItems } from '../models/venta-con-items.model';
import { VentaItem } from '../models/venta-item.model';
import { Produccion } from '../models/produccion.model';
import { ProduccionItem } from '../models/produccion-item.model';
import { Venta } from '../models/venta.model';
import { RespaldoData } from '../models/respaldo.model';
import { ConteoImportacion } from '../models/conteo-importacion.model';
import { calcularCostoPromedioPonderado, calcularStockDerivado, esStockBajo } from '../../features/inventario/inventory-calculations';
import { calcularTotalVenta } from '../../features/ventas/ventas-calculations';
import { SCHEMA_VERSION } from './schema-version';

type RowWithDeletedAt = {
  deleted_at?: number | null;
};

type LegacyVentaRow = {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_venta: number;
  costo_unitario: number;
  ganancia: number;
  tipo_pago: Venta['tipo_pago'];
  monto_contado: number;
  monto_fiado: number;
  cliente_id: string | null;
  fecha: number;
  created_at: number | null;
  updated_at: number | null;
  deleted_at: number | null;
  store_id: string | null;
  created_by: string | null;
};

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db!: SQLiteDBConnection;
  private isInitialized = false;
  private initializationPromise: Promise<boolean> | null = null;

  private readonly DB_NAME = 'fiapp_db';
  private mockWebClientes: Cliente[] = [];
  private mockWebTransacciones: Transaccion[] = [];
  private mockWebProductos: Producto[] = [];
  private mockWebMovimInventario: MovimInventario[] = [];
  private mockWebVentas: Venta[] = [];
  private mockWebVentaItems: VentaItem[] = [];
  private mockWebProducciones: Produccion[] = [];
  private mockWebProduccionItems: ProduccionItem[] = [];

  async initializePlugin(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        if (Capacitor.getPlatform() === 'web') {
          this.isInitialized = true;
          return true;
        }

        const existeConexion = (await this.sqlite.isConnection(this.DB_NAME, false)).result;
        if (existeConexion) {
          this.db = await this.sqlite.retrieveConnection(this.DB_NAME, false);
        } else {
          this.db = await this.sqlite.createConnection(this.DB_NAME, false, 'no-encryption', 1, false);
        }

        const baseDatosAbierta = (await this.db.isDBOpen()).result;
        if (!baseDatosAbierta) {
          await this.db.open();
        }

        await this.habilitarForeignKeys();
        await this.asegurarEsquema();
        this.isInitialized = true;
        return true;
      } catch (error) {
        console.error('Error inicializando la base de datos:', error);
        throw error;
      } finally {
        this.initializationPromise = null;
      }
    })();

    return this.initializationPromise;
  }

  private async habilitarForeignKeys(): Promise<void> {
    await this.db.execute('PRAGMA foreign_keys = ON;');
  }

  private async asegurarEsquema(): Promise<void> {
    await this.crearTablasSiFaltan();
    await this.migrarEsquemaSiNecesario();

    const versionActual = await this.obtenerVersionEsquema();
    if (versionActual < SCHEMA_VERSION) {
      await this.establecerVersionEsquema(SCHEMA_VERSION);
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
        venta_id TEXT DEFAULT NULL,
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
        tipo_pago TEXT NOT NULL,
        monto_contado REAL DEFAULT NULL,
        monto_fiado REAL DEFAULT NULL,
        cliente_id TEXT DEFAULT NULL,
        fecha INTEGER NOT NULL,
        created_at INTEGER DEFAULT NULL,
        updated_at INTEGER DEFAULT NULL,
        deleted_at INTEGER DEFAULT NULL,
        store_id TEXT DEFAULT NULL,
        created_by TEXT DEFAULT NULL
      );
    `);

    await this.crearIndiceVentasFechaSiFalta();
    await this.crearVentaItemsSiFaltan();
    await this.crearProduccionesSiFaltan();
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
    await this.agregarColumnaSiFalta('transacciones', 'venta_id', 'TEXT DEFAULT NULL');

    await this.agregarColumnaSiFalta('ventas', 'monto_contado', 'REAL DEFAULT NULL');
    await this.agregarColumnaSiFalta('ventas', 'monto_fiado', 'REAL DEFAULT NULL');
    await this.backfillMontosVentas();
    await this.crearVentaItemsSiFaltan();
    await this.reconstruirVentasParaMultiItem();
    await this.agregarColumnaSiFalta('productos', 'modo_produccion', 'INTEGER DEFAULT 0');
    await this.crearProduccionesSiFaltan();
  }

  private async agregarColumnaSiFalta(tabla: string, columna: string, definicion: string): Promise<void> {
    const columnas = await this.obtenerColumnas(tabla);
    if (!columnas.has(columna)) {
      await this.db.execute(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion};`);
    }
  }

  private async crearIndiceVentasFechaSiFalta(dentroDeTx = false): Promise<void> {
    await this.db.execute(`
      CREATE INDEX IF NOT EXISTS ventas_fecha_idx
      ON ventas(fecha);
    `, !dentroDeTx);
  }

  private async crearProduccionesSiFaltan(): Promise<void> {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS producciones (
        id TEXT PRIMARY KEY NOT NULL,
        fecha INTEGER NOT NULL,
        nota TEXT DEFAULT NULL,
        created_at INTEGER DEFAULT NULL,
        updated_at INTEGER DEFAULT NULL,
        deleted_at INTEGER DEFAULT NULL,
        store_id TEXT DEFAULT NULL,
        created_by TEXT DEFAULT NULL
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS produccion_items (
        id TEXT PRIMARY KEY NOT NULL,
        produccion_id TEXT NOT NULL,
        producto_id TEXT NOT NULL,
        cantidad INTEGER NOT NULL,
        costo_unitario_declarado REAL NOT NULL,
        created_at INTEGER DEFAULT NULL,
        updated_at INTEGER DEFAULT NULL,
        deleted_at INTEGER DEFAULT NULL,
        store_id TEXT DEFAULT NULL,
        created_by TEXT DEFAULT NULL,
        FOREIGN KEY (produccion_id) REFERENCES producciones(id),
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      );
    `);

    await this.db.execute(`
      CREATE INDEX IF NOT EXISTS produccion_items_produccion_id_idx
      ON produccion_items(produccion_id);
    `);

    await this.db.execute(`
      CREATE INDEX IF NOT EXISTS produccion_items_producto_id_idx
      ON produccion_items(producto_id);
    `);
  }

  private async crearVentaItemsSiFaltan(): Promise<void> {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS venta_items (
        id TEXT PRIMARY KEY NOT NULL,
        venta_id TEXT NOT NULL,
        producto_id TEXT NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_venta REAL NOT NULL,
        costo_unitario REAL NOT NULL,
        ganancia REAL NOT NULL,
        created_at INTEGER DEFAULT NULL,
        updated_at INTEGER DEFAULT NULL,
        deleted_at INTEGER DEFAULT NULL,
        store_id TEXT DEFAULT NULL,
        created_by TEXT DEFAULT NULL,
        FOREIGN KEY (venta_id) REFERENCES ventas(id),
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      );
    `);

    await this.db.execute(`
      CREATE INDEX IF NOT EXISTS venta_items_venta_id_idx
      ON venta_items(venta_id);
    `);

    await this.db.execute(`
      CREATE INDEX IF NOT EXISTS venta_items_producto_id_idx
      ON venta_items(producto_id);
    `);
  }

  private async reconstruirVentasParaMultiItem(): Promise<void> {
    const columnasVentas = await this.obtenerColumnas('ventas');
    if (!columnasVentas.has('producto_id')) {
      return;
    }

    await this.db.execute('PRAGMA foreign_keys = OFF;', false);

    try {
      await this.db.beginTransaction();

      try {
        await this.db.execute('DROP TABLE IF EXISTS ventas_nueva;', false);
        await this.db.execute(`
          CREATE TABLE ventas_nueva (
            id TEXT PRIMARY KEY NOT NULL,
            tipo_pago TEXT NOT NULL,
            monto_contado REAL DEFAULT NULL,
            monto_fiado REAL DEFAULT NULL,
            cliente_id TEXT DEFAULT NULL,
            fecha INTEGER NOT NULL,
            created_at INTEGER DEFAULT NULL,
            updated_at INTEGER DEFAULT NULL,
            deleted_at INTEGER DEFAULT NULL,
            store_id TEXT DEFAULT NULL,
            created_by TEXT DEFAULT NULL
          );
        `, false);

        const resultadoVentas = await this.db.query(`
          SELECT
            id, tipo_pago, monto_contado, monto_fiado, cliente_id, fecha,
            created_at, updated_at, deleted_at, store_id, created_by,
            producto_id, cantidad, precio_venta, costo_unitario, ganancia
          FROM ventas
          ORDER BY fecha DESC;
        `);
        const ventasLegado: LegacyVentaRow[] = resultadoVentas.values ?? [];

        for (const venta of ventasLegado) {
          await this.ejecutarRun(
            `
              INSERT INTO ventas_nueva (
                id, tipo_pago, monto_contado, monto_fiado, cliente_id, fecha,
                created_at, updated_at, deleted_at, store_id, created_by
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              venta.id,
              venta.tipo_pago,
              venta.monto_contado,
              venta.monto_fiado,
              venta.cliente_id ?? null,
              venta.fecha,
              venta.created_at ?? null,
              venta.updated_at ?? null,
              venta.deleted_at ?? null,
              venta.store_id ?? null,
              venta.created_by ?? null,
            ],
            true,
          );

          await this.ejecutarRun(
            `
              INSERT OR IGNORE INTO venta_items (
                id, venta_id, producto_id, cantidad, precio_venta, costo_unitario, ganancia,
                created_at, updated_at, deleted_at, store_id, created_by
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              venta.id,
              venta.id,
              venta.producto_id,
              venta.cantidad,
              venta.precio_venta,
              venta.costo_unitario,
              venta.ganancia,
              venta.created_at ?? null,
              venta.updated_at ?? null,
              venta.deleted_at ?? null,
              venta.store_id ?? null,
              venta.created_by ?? null,
            ],
            true,
          );
        }

        await this.db.execute('DROP TABLE ventas;', false);
        await this.db.execute('ALTER TABLE ventas_nueva RENAME TO ventas;', false);
        await this.crearIndiceVentasFechaSiFalta(true);

        await this.db.commitTransaction();
      } catch (error) {
        await this.db.rollbackTransaction();
        throw error;
      }

      const chequeoForeignKeys = await this.db.query('PRAGMA foreign_key_check;');
      if ((chequeoForeignKeys.values ?? []).length > 0) {
        throw new Error('La reconstrucción de ventas rompió una restricción foreign key');
      }
    } finally {
      await this.db.execute('PRAGMA foreign_keys = ON;', false);
    }
  }

  private construirVenta(venta: Venta): Venta {
    return {
      id: venta.id,
      tipo_pago: venta.tipo_pago,
      monto_contado: venta.monto_contado,
      monto_fiado: venta.monto_fiado,
      cliente_id: venta.cliente_id ?? null,
      fecha: venta.fecha,
      created_at: venta.created_at ?? null,
      updated_at: venta.updated_at ?? null,
      deleted_at: venta.deleted_at ?? null,
      store_id: venta.store_id ?? null,
      created_by: venta.created_by ?? null,
    };
  }

  private construirVentaConItems(venta: Venta, items: VentaItem[]): VentaConItems {
    return {
      venta: this.construirVenta(venta),
      items,
    };
  }

  private combinarVentasConItems(ventas: Venta[], items: VentaItem[]): VentaConItems[] {
    const itemsPorVenta = new Map<string, VentaItem[]>();

    for (const item of items) {
      const itemsVenta = itemsPorVenta.get(item.venta_id) ?? [];
      itemsVenta.push(item);
      itemsPorVenta.set(item.venta_id, itemsVenta);
    }

    return ventas.map((venta) => this.construirVentaConItems(venta, itemsPorVenta.get(venta.id) ?? []));
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
    const createdAt = cliente.created_at ?? Date.now();

    if (Capacitor.getPlatform() === 'web') {
      this.mockWebClientes.push({
        ...cliente,
        created_at: createdAt,
        updated_at: cliente.updated_at ?? null,
        deleted_at: cliente.deleted_at ?? null,
        store_id: cliente.store_id ?? null,
        created_by: cliente.created_by ?? null,
      });
      return;
    }
    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'INSERT INTO clientes (id, nombre, telefono, habeas_data_flag, fecha_creacion, created_at, updated_at, deleted_at, store_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [
      cliente.id,
      cliente.nombre,
      cliente.telefono,
      cliente.habeas_data_flag ? 1 : 0,
      cliente.fecha_creacion,
      createdAt,
      cliente.updated_at ?? null,
      cliente.deleted_at ?? null,
      cliente.store_id ?? null,
      cliente.created_by ?? null,
    ];
    await this.ejecutarRun(sql, values);
  }

  async actualizarCliente(cliente: Cliente): Promise<void> {
    const updatedAt = Date.now();

    if (Capacitor.getPlatform() === 'web') {
      const existente = this.mockWebClientes.find((c) => c.id === cliente.id);
      if (existente) {
        existente.nombre = cliente.nombre;
        existente.telefono = cliente.telefono;
        existente.updated_at = updatedAt;
      }
      return;
    }
    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'UPDATE clientes SET nombre = ?, telefono = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL';
    const values = [cliente.nombre, cliente.telefono, updatedAt, cliente.id];
    await this.ejecutarRun(sql, values);
  }

  async leerCrudoClientes(): Promise<Cliente[]> {
    if (Capacitor.getPlatform() === "web") return this.mockWebClientes;
    if (!this.isInitialized) await this.initializePlugin();
    const res = await this.db.query("SELECT * FROM clientes");
    return (res.values as Cliente[]) ?? [];
  }

  async leerCrudoTransacciones(): Promise<Transaccion[]> {
    if (Capacitor.getPlatform() === "web") return this.mockWebTransacciones;
    if (!this.isInitialized) await this.initializePlugin();
    const res = await this.db.query("SELECT * FROM transacciones");
    return (res.values as Transaccion[]) ?? [];
  }

  async leerCrudoProductos(): Promise<Producto[]> {
    if (Capacitor.getPlatform() === "web") return this.mockWebProductos;
    if (!this.isInitialized) await this.initializePlugin();
    const res = await this.db.query("SELECT * FROM productos");
    return (res.values as Producto[]) ?? [];
  }

  async leerCrudoMovimInventario(): Promise<MovimInventario[]> {
    if (Capacitor.getPlatform() === "web") return this.mockWebMovimInventario;
    if (!this.isInitialized) await this.initializePlugin();
    const res = await this.db.query("SELECT * FROM movim_inventario");
    return (res.values as MovimInventario[]) ?? [];
  }

  async leerCrudoVentas(): Promise<Venta[]> {
    if (Capacitor.getPlatform() === "web") return this.mockWebVentas;
    if (!this.isInitialized) await this.initializePlugin();
    const res = await this.db.query("SELECT * FROM ventas");
    return (res.values as Venta[]) ?? [];
  }

  async leerCrudoVentaItems(): Promise<VentaItem[]> {
    if (Capacitor.getPlatform() === "web") return this.mockWebVentaItems;
    if (!this.isInitialized) await this.initializePlugin();
    const res = await this.db.query("SELECT * FROM venta_items");
    return (res.values as VentaItem[]) ?? [];
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

  async crearTransaccion(transaccion: Transaccion, dentroDeTx = false): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      this.mockWebTransacciones.push({ ...transaccion, venta_id: transaccion.venta_id ?? null, deleted_at: transaccion.deleted_at ?? null });
      return;
    }
    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'INSERT INTO transacciones (id, cliente_id, venta_id, tipo, monto, concepto, fecha, created_at, updated_at, deleted_at, store_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [
      transaccion.id,
      transaccion.cliente_id,
      transaccion.venta_id ?? null,
      transaccion.tipo,
      transaccion.monto,
      transaccion.concepto || '',
      transaccion.fecha,
      transaccion.created_at ?? null,
      transaccion.updated_at ?? null,
      transaccion.deleted_at ?? null,
      transaccion.store_id ?? null,
      transaccion.created_by ?? null,
    ];
    await this.ejecutarRun(sql, values, dentroDeTx);
  }

  async crearProducto(producto: Producto): Promise<void> {
    const createdAt = producto.created_at ?? Date.now();

    if (Capacitor.getPlatform() === 'web') {
      this.mockWebProductos.push({
        ...producto,
        created_at: createdAt,
        updated_at: producto.updated_at ?? null,
        deleted_at: producto.deleted_at ?? null,
        store_id: producto.store_id ?? null,
        created_by: producto.created_by ?? null,
      });
      return;
    }

    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'INSERT INTO productos (id, nombre, precio_venta, tipo_venta, minimo_stock, costo_promedio, created_at, updated_at, deleted_at, store_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [
      producto.id,
      producto.nombre,
      producto.precio_venta,
      producto.tipo_venta,
      producto.minimo_stock,
      producto.costo_promedio,
      createdAt,
      producto.updated_at ?? null,
      producto.deleted_at ?? null,
      producto.store_id ?? null,
      producto.created_by ?? null,
    ];
    await this.ejecutarRun(sql, values);
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
    await this.ejecutarRun(sql, values, true);
  }

  async actualizarProducto(id: string, nombre: string, precioVenta: number, minimoStock: number): Promise<void> {
    const ahora = Date.now();

    if (Capacitor.getPlatform() === "web") {
      this.mockWebProductos = this.mockWebProductos.map((producto) => (
        producto.id === id
          ? { ...producto, nombre, precio_venta: precioVenta, minimo_stock: minimoStock, updated_at: ahora }
          : producto
      ));
      return;
    }

    if (!this.isInitialized) await this.initializePlugin();
    const sql = "UPDATE productos SET nombre = ?, precio_venta = ?, minimo_stock = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL";
    await this.ejecutarRun(sql, [nombre, precioVenta, minimoStock, ahora, id], false);
  }

  async resetInventario(): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      this.mockWebVentaItems = [];
      this.mockWebMovimInventario = [];
      this.mockWebVentas = [];
      this.mockWebProductos = [];
      return;
    }

    if (!this.isInitialized) await this.initializePlugin();

    await this.ejecutarEnTransaccion(async () => {
      await this.ejecutarRun('DELETE FROM venta_items', [], true);
      await this.ejecutarRun('DELETE FROM movim_inventario', [], true);
      await this.ejecutarRun('DELETE FROM ventas', [], true);
      await this.ejecutarRun('DELETE FROM productos', [], true);
    });
  }

  async reemplazarTodo(data: RespaldoData): Promise<ConteoImportacion> {
    const conteo: ConteoImportacion = {
      clientes: data.clientes.length,
      transacciones: data.transacciones.length,
      productos: data.productos.length,
      movim_inventario: data.movim_inventario.length,
      ventas: data.ventas.length,
      venta_items: data.venta_items.length,
    };

    return this.ejecutarEnTransaccion(async () => {
      if (Capacitor.getPlatform() === "web") {
        this.mockWebVentaItems = [...data.venta_items];
        this.mockWebMovimInventario = [...data.movim_inventario];
        this.mockWebTransacciones = [...data.transacciones];
        this.mockWebVentas = [...data.ventas];
        this.mockWebProductos = [...data.productos];
        this.mockWebClientes = [...data.clientes];
        return conteo;
      }

      await this.ejecutarRun("DELETE FROM venta_items", [], true);
      await this.ejecutarRun("DELETE FROM movim_inventario", [], true);
      await this.ejecutarRun("DELETE FROM transacciones", [], true);
      await this.ejecutarRun("DELETE FROM ventas", [], true);
      await this.ejecutarRun("DELETE FROM productos", [], true);
      await this.ejecutarRun("DELETE FROM clientes", [], true);

      for (const c of data.clientes) {
        await this.ejecutarRun(
          "INSERT INTO clientes (id, nombre, telefono, habeas_data_flag, fecha_creacion, created_at, updated_at, deleted_at, store_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [c.id, c.nombre, c.telefono, c.habeas_data_flag, c.fecha_creacion, c.created_at ?? null, c.updated_at ?? null, c.deleted_at ?? null, c.store_id ?? null, c.created_by ?? null],
          true
        );
      }

      for (const p of data.productos) {
        await this.ejecutarRun(
          "INSERT INTO productos (id, nombre, precio_venta, tipo_venta, minimo_stock, costo_promedio, created_at, updated_at, deleted_at, store_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [p.id, p.nombre, p.precio_venta, p.tipo_venta, p.minimo_stock, p.costo_promedio, p.created_at ?? null, p.updated_at ?? null, p.deleted_at ?? null, p.store_id ?? null, p.created_by ?? null],
          true
        );
      }

      for (const v of data.ventas) {
        await this.insertVenta(v);
      }

      for (const t of data.transacciones) {
        await this.crearTransaccion(t, true);
      }

      for (const m of data.movim_inventario) {
        await this.ejecutarRun(
          "INSERT INTO movim_inventario (id, producto_id, tipo, cantidad, costo_unitario, motivo, fecha, actor_id, stock_calculado_anterior, cantidad_fisica, diferencia_calculada, created_at, updated_at, deleted_at, store_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [m.id, m.producto_id, m.tipo, m.cantidad, m.costo_unitario, m.motivo ?? null, m.fecha, m.actor_id ?? null, m.stock_calculado_anterior ?? null, m.cantidad_fisica ?? null, m.diferencia_calculada ?? null, m.created_at ?? null, m.updated_at ?? null, m.deleted_at ?? null, m.store_id ?? null, m.created_by ?? null],
          true
        );
      }

      for (const i of data.venta_items) {
        await this.insertVentaItem(i);
      }

      return conteo;
    });
  }

  private async ejecutarEnTransaccion<T>(operacion: () => Promise<T>): Promise<T> {
    if (Capacitor.getPlatform() === 'web') {
      const snapClientes = [...this.mockWebClientes];
      const snapVentas = [...this.mockWebVentas];
      const snapVentaItems = [...this.mockWebVentaItems];
      const snapMovim = [...this.mockWebMovimInventario];
      const snapTransacciones = [...this.mockWebTransacciones];
      const snapProductos = [...this.mockWebProductos];

      try {
        return await operacion();
      } catch (error) {
        this.mockWebClientes = snapClientes;
        this.mockWebVentas = snapVentas;
        this.mockWebVentaItems = snapVentaItems;
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
      this.mockWebVentas.push(this.construirVenta(venta));
      return;
    }

    if (!this.isInitialized) await this.initializePlugin();
    const sql = `
      INSERT INTO ventas (
        id, tipo_pago, monto_contado, monto_fiado, cliente_id, fecha, created_at, updated_at, deleted_at, store_id, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      venta.id,
      venta.tipo_pago,
      venta.monto_contado,
      venta.monto_fiado,
      venta.cliente_id ?? null,
      venta.fecha,
      venta.created_at ?? null,
      venta.updated_at ?? null,
      venta.deleted_at ?? null,
      venta.store_id ?? null,
      venta.created_by ?? null,
    ];
    await this.ejecutarRun(sql, values, true);
  }

  private async insertVentaItem(item: VentaItem): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      this.mockWebVentaItems.push({ ...item, deleted_at: item.deleted_at ?? null });
      return;
    }

    if (!this.isInitialized) await this.initializePlugin();
    const sql = `
      INSERT INTO venta_items (
        id, venta_id, producto_id, cantidad, precio_venta, costo_unitario, ganancia,
        created_at, updated_at, deleted_at, store_id, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      item.id,
      item.venta_id,
      item.producto_id,
      item.cantidad,
      item.precio_venta,
      item.costo_unitario,
      item.ganancia,
      item.created_at ?? null,
      item.updated_at ?? null,
      item.deleted_at ?? null,
      item.store_id ?? null,
      item.created_by ?? null,
    ];
    await this.ejecutarRun(sql, values, true);
  }

  async registrarVenta(venta: Venta, items: VentaItem[], movimientos: MovimInventario[], transaccionFiado?: Transaccion): Promise<void> {
    this.validarMontosVenta(venta, items);
    return this.ejecutarEnTransaccion(async () => {
      await this.insertVenta(venta);
      for (const item of items) {
        await this.insertVentaItem(item);
      }
      for (const movimiento of movimientos) {
        await this.crearMovimientoInterno(movimiento);
      }
      if ((venta.monto_fiado ?? 0) > 0 && transaccionFiado) {
        await this.crearTransaccion(transaccionFiado, true);
      }
    });
  }

  async obtenerVentas(): Promise<VentaConItems[]> {
    if (Capacitor.getPlatform() === 'web') {
      const ventas = this.filtrarActivos(this.mockWebVentas);
      const items = this.filtrarActivos(this.mockWebVentaItems);
      return this.combinarVentasConItems(ventas, items);
    }

    if (!this.isInitialized) await this.initializePlugin();
    const ventasRes = await this.db.query('SELECT * FROM ventas WHERE deleted_at IS NULL ORDER BY fecha DESC');
    const itemsRes = await this.db.query('SELECT * FROM venta_items WHERE deleted_at IS NULL ORDER BY created_at ASC, id ASC');
    const ventas: Venta[] = ventasRes.values ?? [];
    const items: VentaItem[] = itemsRes.values ?? [];
    return this.combinarVentasConItems(ventas, items);
  }

  async softDeleteVenta(id: string): Promise<void> {
    const ahora = Date.now();

    if (Capacitor.getPlatform() === 'web') {
      this.mockWebVentas = this.mockWebVentas.map((venta) => (
        venta.id === id ? { ...venta, deleted_at: ahora } : venta
      ));
      this.mockWebVentaItems = this.mockWebVentaItems.map((item) => (
        item.venta_id === id ? { ...item, deleted_at: ahora } : item
      ));
      return;
    }

    if (!this.isInitialized) await this.initializePlugin();

    return this.ejecutarEnTransaccion(async () => {
      await this.ejecutarRun('UPDATE ventas SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL', [ahora, id], true);
      await this.ejecutarRun('UPDATE venta_items SET deleted_at = ? WHERE venta_id = ? AND deleted_at IS NULL', [ahora, id], true);
    });
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

  async obtenerTransacciones(): Promise<Transaccion[]> {
    if (Capacitor.getPlatform() === 'web') {
      return this.filtrarActivos(this.mockWebTransacciones)
        .sort((a, b) => b.fecha - a.fecha) as Transaccion[];
    }

    if (!this.isInitialized) await this.initializePlugin();
    const sql = 'SELECT * FROM transacciones WHERE deleted_at IS NULL ORDER BY fecha DESC';
    const res = await this.db.query(sql);
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
    await this.ejecutarRun(sql, [Date.now(), id]);
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
    await this.ejecutarRun(sql, [id]);
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
    await this.ejecutarRun(sql, [Date.now(), id]);
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
    await this.ejecutarRun(sql, [id]);
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
    await this.ejecutarRun(sql, [Date.now(), id]);
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
    await this.ejecutarRun(sql, [id]);
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
    await this.ejecutarRun(sql, [costoPromedio, id], true);
  }

  private validarMontosVenta(venta: Venta, items: VentaItem[]): void {
    const contado = venta.monto_contado;
    const fiado = venta.monto_fiado;

    if (contado == null || fiado == null || Number.isNaN(contado) || Number.isNaN(fiado)) {
      throw new Error("Los montos de la venta son obligatorios");
    }

    if (contado < 0 || fiado < 0) {
      throw new Error("Los montos de la venta no pueden ser negativos");
    }

    const total = items.reduce((acumulado, item) => acumulado + calcularTotalVenta(item.precio_venta, item.cantidad), 0);
    if (Math.abs((contado + fiado) - total) >= 0.01) {
      throw new Error("Los montos no coinciden con el total de la venta");
    }

    if (fiado > 0 && !venta.cliente_id) {
      throw new Error("Debes seleccionar un cliente para el saldo fiado");
    }
  }

  private async backfillMontosVentas(): Promise<void> {
    const columnasVentas = await this.obtenerColumnas('ventas');
    if (!columnasVentas.has('precio_venta')) {
      return;
    }

    await this.ejecutarRun(
      "UPDATE ventas SET monto_contado = precio_venta * cantidad, monto_fiado = 0 WHERE monto_contado IS NULL AND tipo_pago = ?",
      ["CONTADO"],
    );
    await this.ejecutarRun(
      "UPDATE ventas SET monto_contado = 0, monto_fiado = precio_venta * cantidad WHERE monto_contado IS NULL AND tipo_pago = ?",
      ["FIADO"],
    );
  }

  /**
   * The plugin signature is run(sql, values, transaction) and that third
   * parameter DEFAULTS TO TRUE, meaning every run opens its own transaction.
   * Inside ejecutarEnTransaccion that produces "cannot start a transaction
   * within a transaction" on a real device.
   *
   * Callers here think in terms of "am I already inside a transaction", so the
   * flag is inverted once, in this single place. See Decision 028.
   */
  private async ejecutarRun(sql: string, values: any[], dentroDeTx = false) {
    return this.db.run(sql, values, !dentroDeTx);
  }
}
