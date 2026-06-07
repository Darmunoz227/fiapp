import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common'; // Nos permite usar tuberías como "uppercase"
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem,
  IonLabel, IonInput, IonRow, IonCol, IonButton
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-nueva-transaccion',
  templateUrl: './nueva-transaccion.component.html',
  styleUrls: ['./nueva-transaccion.component.scss'],
  standalone: true,
  imports: [
    FormsModule, CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem,
    IonLabel, IonInput, IonRow, IonCol, IonButton
  ]
})
export class NuevaTransaccionComponent {
  
  // Esta "antena" recibe la orden: ¿Soy un fiado o un abono? Por defecto es fiado.
  @Input() tipo: 'fiado' | 'abono' = 'fiado'; 

  monto: number | null = null;
  concepto: string = '';

  constructor(private modalCtrl: ModalController) {}

  cerrarModal() {
    this.modalCtrl.dismiss();
  }

  guardar() {
    // Cuando el usuario le da a guardar, no guardamos en la base de datos aquí.
    // Simplemente empaquetamos los datos y se los devolvemos a la pantalla del cliente.
    this.modalCtrl.dismiss({
      monto: this.monto,
      concepto: this.concepto,
      tipo: this.tipo
    });
  }
}
