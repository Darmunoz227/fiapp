import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { CajaRepository } from '../../core/repositories/caja.repository';
import { addIcons } from 'ionicons';
import { cashOutline, lockOpenOutline, walletOutline } from 'ionicons/icons';

@Component({
  selector: 'app-caja',
  templateUrl: './caja.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CajaPage implements OnInit {
  sesionActiva: any = null;
  formBaseStr: string = '';
  formBaseNum: number = 0;

  constructor(
    private cajaRepo: CajaRepository,
    private toastCtrl: ToastController
  ) {
    addIcons({ cashOutline, lockOpenOutline, walletOutline });
  }

  async ngOnInit() {
    await this.cargarEstadoCaja();
  }

  // Refresca la vista cada vez que el usuario entra a la pantalla
  async ionViewWillEnter() {
    await this.cargarEstadoCaja();
  }

  async cargarEstadoCaja() {
    this.sesionActiva = await this.cajaRepo.obtenerSesionAbierta();
  }

  onBaseChange(valor: string | number) {
    const raw = valor.toString().replace(/\D/g, '');
    if (!raw) {
      this.formBaseStr = '';
      this.formBaseNum = 0;
      return;
    }
    this.formBaseNum = parseInt(raw, 10);
    this.formBaseStr = this.formBaseNum.toLocaleString('es-CO');
  }

  async abrirCaja() {
    if (this.formBaseNum <= 0 && this.formBaseStr !== '0') return;
    
    try {
      await this.cajaRepo.abrirCaja(this.formBaseNum);
      await this.cargarEstadoCaja();
      
      const toast = await this.toastCtrl.create({
        message: '¡Turno iniciado con éxito!',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    } catch (e) {
      console.error(e);
    }
  }
}
