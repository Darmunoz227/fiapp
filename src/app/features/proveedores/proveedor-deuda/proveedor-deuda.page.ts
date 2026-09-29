import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-proveedor-deuda',
  templateUrl: './proveedor-deuda.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule]
})
export class ProveedorDeudaPage implements OnInit {
  proveedorId: string = '';
  
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.proveedorId = this.route.snapshot.paramMap.get('id') || '';
    // TODO: Cargar datos del proveedor y movimientos desde el repositorio
  }
}
