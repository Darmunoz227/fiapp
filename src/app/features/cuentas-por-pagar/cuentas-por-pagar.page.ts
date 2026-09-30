import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ActionSheetController, ToastController } from '@ionic/angular';
import { ProveedoresRepository } from '../../core/repositories/proveedores.repository';
import { addIcons } from 'ionicons';
import { add, businessOutline, walletOutline, documentTextOutline, createOutline, trashOutline } from 'ionicons/icons';

@Component({
  selector: 'app-cuentas-por-pagar',
  templateUrl: './cuentas-por-pagar.page.html',
  styleUrls: ['./cuentas-por-pagar.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CuentasPorPagarPage implements OnInit {
  proveedores: any[] = [];

  constructor(
    private proveedoresRepo: ProveedoresRepository,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
    private toastCtrl: ToastController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ add, businessOutline, walletOutline, documentTextOutline, createOutline, trashOutline });
  }

  async ngOnInit() {
    await this.cargarProveedores();
  }

  async cargarProveedores() {
    this.proveedores = await this.proveedoresRepo.obtenerProveedores();
    this.cdr.detectChanges();
  }

  formatearDinero(valor: number): string {
    return valor.toLocaleString('es-CO');
  }

  async crearProveedor() {
    const alert = await this.alertCtrl.create({
      header: 'Nuevo Proveedor',
      inputs: [
        { name: 'nombre', type: 'text', placeholder: 'Nombre (ej. Coca-Cola)' },
        { name: 'telefono', type: 'tel', placeholder: 'Teléfono (Opcional)' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            if (data.nombre) {
              await this.proveedoresRepo.crearProveedor(data.nombre, data.telefono);
              await this.cargarProveedores();
              this.mostrarToast('Proveedor creado');
            }
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async abrirOpciones(proveedor: any) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: proveedor.nombre,
      subHeader: `Deuda actual: $ ${this.formatearDinero(proveedor.saldo_pendiente)}`,
      buttons: [
        {
          text: 'Anotar nueva deuda (Llegó pedido)',
          icon: 'document-text-outline',
          handler: () => { this.registrarDeuda(proveedor); }
        },
        {
          text: 'Registrar Abono (Pagar)',
          icon: 'wallet-outline',
          handler: () => { this.registrarAbono(proveedor); }
        },
        { text: 'Cancelar', icon: 'close', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  async editarProveedor(proveedor: any) {
    const alert = await this.alertCtrl.create({
      header: 'Editar Proveedor',
      inputs: [
        { name: 'nombre', type: 'text', value: proveedor.nombre, placeholder: 'Nombre' },
        { name: 'telefono', type: 'tel', value: proveedor.telefono, placeholder: 'Teléfono' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Actualizar',
          handler: async (data) => {
            if (data.nombre) {
              await this.proveedoresRepo.actualizarProveedor(proveedor.id, data.nombre, data.telefono);
              await this.cargarProveedores();
              this.mostrarToast('Proveedor actualizado');
            }
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async eliminarProveedor(proveedor: any) {
    if (proveedor.saldo_pendiente > 0) {
      const alertaDeuda = await this.alertCtrl.create({
        header: 'Acción bloqueada',
        message: `No puedes eliminar a ${proveedor.nombre} porque aún le debes $ ${this.formatearDinero(proveedor.saldo_pendiente)}. Paga la deuda primero.`,
        buttons: ['Entendido']
      });
      await alertaDeuda.present();
      return;
    }

    const alert = await this.alertCtrl.create({
      header: '¿Eliminar proveedor?',
      message: `¿Estás seguro de que deseas eliminar a ${proveedor.nombre}? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.proveedoresRepo.eliminarProveedor(proveedor.id);
            await this.cargarProveedores();
            this.mostrarToast('Proveedor eliminado');
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async registrarDeuda(proveedor: any) {
    const alert = await this.alertCtrl.create({
      header: 'Nueva Deuda',
      subHeader: proveedor.nombre,
      inputs: [
        { name: 'monto', type: 'number', placeholder: 'Monto de la factura' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            if (data.monto && Number(data.monto) > 0) {
              await this.proveedoresRepo.agregarDeuda(proveedor.id, Number(data.monto));
              await this.cargarProveedores();
              this.mostrarToast('Deuda registrada');
            }
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async registrarAbono(proveedor: any) {
    if (proveedor.saldo_pendiente <= 0) {
      this.mostrarToast('Este proveedor no tiene deudas pendientes.');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Registrar Abono',
      subHeader: proveedor.nombre,
      message: `Saldo actual: $ ${this.formatearDinero(proveedor.saldo_pendiente)}`,
      inputs: [
        { name: 'monto', type: 'number', placeholder: `¿Cuánto vas a abonar?` }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Siguiente',
          handler: (data) => {
            if (data.monto && Number(data.monto) > 0) {
              if (Number(data.monto) > proveedor.saldo_pendiente) {
                 this.mostrarToast('El abono no puede ser mayor a la deuda.', 'danger');
                 return false; // Bloquea el cierre si el valor es incorrecto
              }
              this.seleccionarMetodoPago(proveedor, Number(data.monto));
            }
            return true; // Permite el cierre si todo sale bien
          }
        }
      ]
    });
    await alert.present();
  }

  async seleccionarMetodoPago(proveedor: any, monto: number) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: `¿Cómo pagaste los $ ${this.formatearDinero(monto)}?`,
      subHeader: 'Si eliges Efectivo, se descontará de la Caja Registradora.',
      buttons: [
        {
          text: 'Efectivo (Descuenta de Caja)',
          handler: async () => {
            await this.proveedoresRepo.registrarAbono(proveedor.id, monto, 'EFECTIVO');
            await this.cargarProveedores();
            this.mostrarToast('Abono registrado y caja actualizada', 'success');
            return true;
          }
        },
        {
          text: 'Transferencia (Nequi/Banco)',
          handler: async () => {
            await this.proveedoresRepo.registrarAbono(proveedor.id, monto, 'TRANSFERENCIA');
            await this.cargarProveedores();
            this.mostrarToast('Abono registrado (sin tocar la caja)', 'success');
            return true;
          }
        },
        { text: 'Cancelar', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  async mostrarToast(mensaje: string, color: string = 'dark') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }
}
