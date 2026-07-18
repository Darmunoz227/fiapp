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
    path: 'inventario',
    loadComponent: () => import('./features/inventario/inventory-list.page').then(m => m.InventoryListPage)
  },
];
