import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ProveedorDeudaModalComponent } from '../proveedor-deuda-modal/proveedor-deuda-modal.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ProveedorRepository } from 'src/app/core/repositories/proveedor.repository';
import { MovimientoDeudaRepository } from 'src/app/core/repositories/movimiento-deuda.repository';

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

  constructor(
    private proveedorRepo: ProveedorRepository, 
    private modalCtrl: ModalController,
    private movRepo: MovimientoDeudaRepository // Inyectamos el historial
  ) {}

  async abrirModalDeuda(proveedor: any) {
    const modal = await this.modalCtrl.create({
      component: ProveedorDeudaModalComponent,
      componentProps: {
        proveedorId: proveedor.id,
        proveedorNombre: proveedor.nombre
      },
      initialBreakpoint: 0.8,
      breakpoints: [0, 0.5, 0.8, 1]
    });
    await modal.present();
    
    await modal.onDidDismiss();
    
    // Usamos setTimeout para asegurar que la animacion de cierre termino antes de refrescar
    setTimeout(() => {
      this.cargarProveedores();
    }, 150);
  }

  ngOnInit() {
    this.cargarProveedores();
  }

  async cargarProveedores() {
    try {
      const provs = await this.proveedorRepo.obtenerTodos();
      
      // PATRON LEDGER: Recalcular saldos exactos al vuelo leyendo los movimientos reales
      for (const p of provs) {
        const movs = await this.movRepo.obtenerMovimientos(p.id);
        let saldoCalculado = 0;
        for (const m of movs) {
          if (m.tipo === 'CARGO') saldoCalculado += m.monto;
          else if (m.tipo === 'ABONO') saldoCalculado -= m.monto;
        }
        p.saldo_deuda = saldoCalculado; // Asignamos la verdad absoluta
      }
      
      this.proveedores = [...provs]; // Clonamos para forzar a Angular a pintar los cambios
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