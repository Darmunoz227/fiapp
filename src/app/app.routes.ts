import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    // Le agregamos "/:id" para que Angular sepa que esta pantalla necesita saber A QUIÉN va a mostrar
    path: 'cliente-detalle/:id',
    loadComponent: () => import('./features/cliente-detalle/cliente-detalle.page').then( m => m.ClienteDetallePage)
  },
  {
    path: 'configuraciones',
    loadComponent: () => import('./features/configuraciones/configuraciones.page').then( m => m.ConfiguracionesPage)
  },
  {
    path: 'fiado-productos',
    loadComponent: () => import('./features/fiado-productos/fiado-productos.page').then(m => m.FiadoProductosPage)
  },
  {
    path: 'registrar-produccion',
    loadComponent: () => import('./features/registrar-produccion/registrar-produccion.page').then(m => m.RegistrarProduccionPage)
  },
  {
    path: 'gastos',
    loadComponent: () => import('./features/gastos/gastos.page').then(m => m.GastosPage)
  },
  {
    path: 'inventario',
    loadComponent: () => import('./features/inventario/inventory-list.page').then(m => m.InventoryListPage)
  },
  {
    path: 'inventario/movimiento/:productoId',
    loadComponent: () => import('./features/inventario/inventory-movement.page').then(m => m.InventoryMovementPage)
  },
  {
    path: 'ventas',
    loadComponent: () => import('./features/ventas/ventas.page').then(m => m.VentasPage)
  },
  {
    path: 'reportes',
    loadComponent: () => import('./features/reportes/reportes.page').then(m => m.ReportesPage)
  },
  {
    path: "importador-csv",
    loadComponent: () => import("./features/inventario/importador-csv/importador-csv.page").then(m => m.ImportadorCsvPage)
  },
  {
    path: 'proveedores-list',
    loadComponent: () => import('./features/proveedores/proveedores-list/proveedores-list.page').then( m => m.ProveedoresListPage)
  },
];
