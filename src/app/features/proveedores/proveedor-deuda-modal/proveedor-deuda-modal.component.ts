import { addIcons } from 'ionicons';
import { timeOutline, arrowUpCircleOutline, arrowDownCircleOutline, cashOutline } from 'ionicons/icons';
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { MovimientoDeudaRepository } from '../../../core/repositories/movimiento-deuda.repository';

@Component({
  selector: 'app-proveedor-deuda-modal',
  templateUrl: './proveedor-deuda-modal.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ProveedorDeudaModalComponent implements OnInit {
  movimientos: any[] = [];
  @Input() proveedorId!: string;
  @Input() proveedorNombre!: string;
  @Input() saldoActual: number = 0;

  constructor(private modalCtrl: ModalController, private movRepo: MovimientoDeudaRepository, private alertCtrl: AlertController) {
    addIcons({ timeOutline, arrowUpCircleOutline, arrowDownCircleOutline, cashOutline });}

    async ngOnInit() {
    await this.cargarHistorial();
  }

  async cargarHistorial() {
    this.movimientos = await this.movRepo.obtenerMovimientos(this.proveedorId);
  }

  
  async registrarAbonoPrompt() {
    const alert = await this.alertCtrl.create({
      header: 'Registrar Abono',
      inputs: [
        { name: 'monto', type: 'number', placeholder: 'Monto a abonar ($)', min: 1 },
        { name: 'notas', type: 'text', placeholder: 'Notas (ej. comprobante)' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            const monto = parseFloat(data.monto);
            if (monto > 0) {
              await this.movRepo.registrarAbono(this.proveedorId, monto, data.notas);
              this.saldoActual = (this.saldoActual || 0) - monto;
              await this.cargarHistorial();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  cerrar() {
    this.modalCtrl.dismiss({ actualizado: true });
  }

}
