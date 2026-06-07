import { Component, Input, OnChanges, SimpleChanges, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common'; // Nos permite usar tuberías como "uppercase"
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem,
  IonLabel, IonInput, IonRow, IonCol, IonButton, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { formatCurrencyCOP, formatFiadoConcept, parseCurrencyInput } from '../../utils/formatters';

@Component({
  selector: 'app-nueva-transaccion',
  templateUrl: './nueva-transaccion.component.html',
  styleUrls: ['./nueva-transaccion.component.scss'],
  standalone: true,
  imports: [
    FormsModule, CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem,
    IonLabel, IonInput, IonRow, IonCol, IonButton, IonSelect, IonSelectOption
  ]
})
export class NuevaTransaccionComponent implements OnChanges {
  
  // Esta "antena" recibe la orden: ¿Soy un fiado o un abono? Por defecto es fiado.
  @Input() tipo: 'fiado' | 'abono' = 'fiado'; 

  monto: number | null = null;
  montoTexto = '';
  concepto = '';
  conceptosAbono = ['Efectivo', 'Pago Digital (Nequi/Daviplata/etc)', 'Plataforma / Tarjeta'];
  @ViewChild('montoInput', { static: false }) montoInput: any;
  private _pasteListener: any = null;

  constructor(private modalCtrl: ModalController) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tipo']) {
      this.inicializarConcepto();
    }
  }

  async ngAfterViewInit() {
    // attach paste listener to native input to handle pasted values reliably
    try {
      const inputEl = this.montoInput;
      if (inputEl && inputEl.getInputElement) {
        const native = await inputEl.getInputElement();
        this._pasteListener = (ev: ClipboardEvent) => this.handlePaste(ev, native);
        native.addEventListener('paste', this._pasteListener);
      }
    } catch (e) {
      // ignore
    }
  }

  ngOnDestroy() {
    try {
      if (this._pasteListener && this.montoInput && this.montoInput.getInputElement) {
        this.montoInput.getInputElement().then((native: HTMLInputElement) => {
          native.removeEventListener('paste', this._pasteListener);
        }).catch(()=>{});
      }
    } catch (e) {}
  }

  private handlePaste(ev: ClipboardEvent, nativeInput: HTMLInputElement) {
    ev.preventDefault();
    const paste = ev.clipboardData?.getData('text') || '';
    const cleanedPaste = paste.replace(/[^0-9-]/g, '');
    if (!cleanedPaste) return;

    const raw = this.montoTexto || '';
    const start = nativeInput.selectionStart || 0;
    const end = nativeInput.selectionEnd || 0;

    const digitsBefore = raw.slice(0, start).replace(/\D/g, '').length;
    const digitsAfter = raw.slice(end).replace(/\D/g, '').length;
    const allDigits = raw.replace(/\D/g, '');

    const left = allDigits.slice(0, digitsBefore);
    const right = allDigits.slice(allDigits.length - digitsAfter);
    const newDigits = left + cleanedPaste + right;

    const numeric = parseCurrencyInput(newDigits);
    this.monto = numeric > 0 ? numeric : null;
    const formatted = this.monto ? formatCurrencyCOP(this.monto) : '';
    this.montoTexto = formatted;

    // set caret after inserted digits
    const digitsInserted = left.length + cleanedPaste.length;
    let pos = 0;
    if (digitsInserted === 0) pos = 0;
    else {
      let digitsSeen = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) digitsSeen++;
        if (digitsSeen === digitsInserted) { pos = i + 1; break; }
      }
      if (digitsSeen < digitsInserted) pos = formatted.length;
    }

    setTimeout(() => {
      try { nativeInput.setSelectionRange(pos, pos); } catch (e) {}
    }, 0);
  }

  private inicializarConcepto() {
    if (this.tipo === 'fiado') {
      this.concepto = formatFiadoConcept();
      return;
    }

    this.concepto = '';
  }

  async onMontoInput() {
    const raw = this.montoTexto || '';
    const inputEl = this.montoInput;

    // get native input element from IonInput
    let nativeInput: HTMLInputElement | null = null;
    try {
      if (inputEl && inputEl.getInputElement) {
        nativeInput = await inputEl.getInputElement();
      }
    } catch (e) {
      nativeInput = null;
    }

    const caretPos = nativeInput ? nativeInput.selectionStart || 0 : raw.length;

    // digits before caret in the raw string
    const digitsBefore = raw.slice(0, caretPos).replace(/\D/g, '').length;

    const cleaned = raw.replace(/[^0-9-]/g, '');
    const numeric = parseCurrencyInput(cleaned);
    this.monto = numeric > 0 ? numeric : null;
    const formatted = this.monto ? formatCurrencyCOP(this.monto) : '';

    // compute new caret position in formatted string based on digitsBefore
    let pos = 0;
    if (digitsBefore === 0) {
      pos = 0;
    } else {
      let digitsSeen = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) digitsSeen++;
        if (digitsSeen === digitsBefore) { pos = i + 1; break; }
      }
      if (digitsSeen < digitsBefore) pos = formatted.length;
    }

    this.montoTexto = formatted;

    // restore caret position asynchronously
    if (nativeInput) {
      setTimeout(() => {
        try { nativeInput.setSelectionRange(pos, pos); } catch (e) {}
      }, 0);
    }
  }

  async onMontoBlur() {
    if (this.monto) {
      this.montoTexto = formatCurrencyCOP(this.monto);
    }
  }

  cerrarModal() {
    this.modalCtrl.dismiss();
  }

  guardar() {
    if (this.tipo === 'fiado' && !this.concepto.trim()) {
      this.concepto = formatFiadoConcept();
    }

    // Cuando el usuario le da a guardar, no guardamos en la base de datos aquí.
    // Simplemente empaquetamos los datos y se los devolvemos a la pantalla del cliente.
    this.modalCtrl.dismiss({
      monto: this.monto,
      concepto: this.concepto,
      tipo: this.tipo
    });
  }
}
