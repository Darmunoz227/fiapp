import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ProveedorRepository } from 'src/app/core/repositories/proveedor.repository';

@Component({
  selector: 'app-proveedores-list',
  templateUrl: './proveedores-list.page.html',
  styleUrls: ['./proveedores-list.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ProveedoresListPage implements OnInit {
  proveedores: any[] = [];
  isModalOpen = false;
  
  nuevo: any = { id: null, nombre: '', telefono: '', contacto: '', notas: '' };

  constructor(private proveedorRepo: ProveedorRepository) {}

  ngOnInit() {
    this.cargarProveedores();
  }

  async cargarProveedores() {
    try {
      this.proveedores = await this.proveedorRepo.obtenerTodos();
    } catch (e: any) {
      console.error("Error BD:", e);
    }
  }

  setModalOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
    if (!isOpen) {
      this.nuevo = { id: null, nombre: '', telefono: '', contacto: '', notas: '' };
    }
  }

  editarProveedor(proveedor: any) {
    this.nuevo = { ...proveedor };
    this.setModalOpen(true);
  }

  async eliminarProveedor(id: string) {
    try {
      await this.proveedorRepo.eliminar(id);
      await this.cargarProveedores();
    } catch (e: any) {
      console.error("Error al eliminar:", e);
    }
  }

  async guardarProveedor() {
    if (!this.nuevo.nombre) return;
    try {
      if (this.nuevo.id) {
        await this.proveedorRepo.actualizar(this.nuevo);
      } else {
        await this.proveedorRepo.crear(this.nuevo);
      }
      this.setModalOpen(false);
      await this.cargarProveedores();
    } catch (e: any) {
      console.error("Error BD:", e);
    }
  }
}
