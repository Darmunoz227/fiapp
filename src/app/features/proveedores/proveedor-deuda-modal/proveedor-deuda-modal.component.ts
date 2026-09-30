import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  timeOutline, 
  arrowUpCircleOutline, 
  arrowDownCircleOutline, 
  cashOutline, 
  addCircleOutline, 
  cameraOutline, 
  logoWhatsapp, 
  trashOutline,
  documentTextOutline, // Agregado para arreglar el warning
  trash              // Agregado para arreglar el warning
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { MovimientoDeudaRepository } from '../../../core/repositories/movimiento-deuda.repository';
// Importamos Capacitor para saber si estamos en web o nativo
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-proveedor-deuda-modal',
  templateUrl: './proveedor-deuda-modal.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ProveedorDeudaModalComponent implements OnInit {
  @Input() proveedorId!: string;
  @Input() proveedorNombre!: string;
  @Input() proveedorTelefono?: string;
  
  saldoActual: number = 0;
  movimientos: any[] = [];
  vistaActual: 'HISTORIAL' | 'FORMULARIO' = 'HISTORIAL';
  
  tipoMovimiento: 'ABONO' | 'CARGO' = 'ABONO';
  formMontoStr: string = '';
  formMontoNum: number = 0;
  formNotas: string = '';
  formFotoUrl: string | null = null; 

  constructor(private modalCtrl: ModalController, private movRepo: MovimientoDeudaRepository) {
    addIcons({ 
      timeOutline, arrowUpCircleOutline, arrowDownCircleOutline, 
      cashOutline, addCircleOutline, cameraOutline, logoWhatsapp, 
      trashOutline, documentTextOutline, trash 
    });
  }

  async ngOnInit() {
    await this.cargarHistorial();
  }

  async cargarHistorial() {
    this.movimientos = await this.movRepo.obtenerMovimientos(this.proveedorId);
    let saldoAcumulado = 0;
    const movsInvertidos = [...this.movimientos].reverse();
    for (const m of movsInvertidos) {
      if (m.tipo === 'CARGO') saldoAcumulado += m.monto;
      else if (m.tipo === 'ABONO') saldoAcumulado -= m.monto;
      m.saldoMomentaneo = saldoAcumulado;
    }
    this.saldoActual = saldoAcumulado;
  }

  onMontoChange(valor: string | number) {
    const raw = valor.toString().replace(/\D/g, ''); 
    if (!raw) {
      this.formMontoStr = '';
      this.formMontoNum = 0;
      return;
    }
    this.formMontoNum = parseInt(raw, 10);
    this.formMontoStr = this.formMontoNum.toLocaleString('es-CO'); 
  }

  abrirFormulario(tipo: 'ABONO' | 'CARGO') {
    this.tipoMovimiento = tipo;
    this.formMontoStr = '';
    this.formMontoNum = 0;
    this.formNotas = '';
    this.formFotoUrl = null;
    this.vistaActual = 'FORMULARIO';
  }

  async tomarFotoFactura() {
    try {
      console.log('Iniciando captura de foto...');
      
      // En entorno Web a veces Prompt falla, forzamos Photos (galería) si estamos en Web
      const isWeb = Capacitor.getPlatform() === 'web';
      
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: isWeb ? CameraSource.Photos : CameraSource.Prompt 
      });
      
      console.log('Foto capturada exitosamente');
      this.formFotoUrl = image.dataUrl || null;
    } catch (error: any) {
      console.error('Error al capturar la foto:', error);
      // Solo mostramos error si no es una cancelación del usuario
      if (error && error.message && error.message.indexOf('User cancelled') === -1) {
         alert('No se pudo abrir la cámara. Asegúrate de probar en un dispositivo real o emulador para una experiencia completa.');
      }
    }
  }

  async guardarMovimiento() {
    if (this.formMontoNum > 0) {
      const notasFinal = this.formNotas;
      await this.movRepo.registrarMovimiento(this.proveedorId, this.tipoMovimiento, this.formMontoNum, notasFinal);
      await this.cargarHistorial();
      this.vistaActual = 'HISTORIAL';
    }
  }

  enviarWhatsApp(mov: any) {
    const signo = mov.tipo === 'ABONO' ? 'Abono de' : 'Nuevo cargo de';
    const montoFmt = Number(mov.monto).toLocaleString('es-CO');
    const mensaje = `Hola *${this.proveedorNombre}*, le notifico un *${signo} $${montoFmt}* en la cuenta. Notas: ${mov.notas || 'Ninguna'}.`;
    const url = `https://api.whatsapp.com/send?phone=${this.proveedorTelefono || ''}&text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  cerrar() {
    this.modalCtrl.dismiss({ actualizado: true });
  }
}