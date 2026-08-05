import { Cliente } from './cliente.model';
import { Transaccion } from './transaccion.model';
import { Producto } from './producto.model';
import { MovimInventario } from './movim-inventario.model';
import { Venta } from './venta.model';
import { VentaItem } from './venta-item.model';

export interface RespaldoData {
  clientes: Cliente[];
  transacciones: Transaccion[];
  productos: Producto[];
  movim_inventario: MovimInventario[];
  ventas: Venta[];
  venta_items: VentaItem[];
}

export interface Respaldo {
  schema_version: number;
  exported_at: string;
  data: RespaldoData;
}
