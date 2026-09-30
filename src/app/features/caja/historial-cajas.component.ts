import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { CajaRepository } from '../../core/repositories/caja.repository';
import { addIcons } from 'ionicons';
import { closeOutline, documentTextOutline } from 'ionicons/icons';

@Component({
  selector: 'app-historial-cajas',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Historial de Cortes Z</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cerrar()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content color="light">
      <div *ngIf="historial.length === 0" class="ion-padding ion-text-center" style="margin-top: 40px;">
        <ion-icon name="document-text-outline" style="font-size: 64px; color: var(--ion-color-medium)"></ion-icon>
        <h3 style="color: var(--ion-color-dark);">Sin registros</h3>
        <p style="color: var(--ion-color-medium)">Aún no has realizado ningún Corte Z.</p>
      </div>
      <ion-list *ngIf="historial.length > 0" inset="true">
        <ion-item *ngFor="let h of historial">
          <ion-label>
            <h2><strong>{{ h.fecha_cierre | date:'medium' }}</strong></h2>
            <p>Físico: $ {{ h.saldo_fisico | number:'1.0-0' }} | Esperado: $ {{ h.saldo_esperado | number:'1.0-0' }}</p>
            <p *ngIf="h.nota_cierre"><em>"{{ h.nota_cierre }}"</em></p>
          </ion-label>
          <ion-note slot="end" [color]="h.diferencia === 0 ? 'success' : (h.diferencia > 0 ? 'tertiary' : 'danger')">
            <strong style="font-size: 1.1em;">
              {{ h.diferencia === 0 ? '✔ Cuadre' : (h.diferencia > 0 ? 'Sobró $' + (h.diferencia | number:'1.0-0') : 'Faltó $' + ((h.diferencia * -1) | number:'1.0-0')) }}
            </strong>
          </ion-note>
        </ion-item>
      </ion-list>
    </ion-content>
  `
})
export class HistorialCajasComponent implements OnInit {
  historial: any[] = [];
  
  constructor(private modalCtrl: ModalController, private cajaRepo: CajaRepository) {
    addIcons({ closeOutline, documentTextOutline });
  }

  async ngOnInit() {
    this.historial = await this.cajaRepo.obtenerHistorialCajas();
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }
}
