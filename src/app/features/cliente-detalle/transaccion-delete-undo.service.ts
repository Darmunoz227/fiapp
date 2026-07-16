import { Injectable } from '@angular/core';
import { Transaccion } from '../../core/models/transaccion.model';

@Injectable()
export class TransaccionDeleteUndoService {
  private pendingTransaccion: Transaccion | null = null;
  private timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  stage(transaccion: Transaccion): void {
    this.clear();
    this.pendingTransaccion = { ...transaccion };
    this.timeoutHandle = setTimeout(() => this.clear(), 5000);
  }

  consume(): Transaccion | null {
    const transaccion = this.pendingTransaccion;
    this.clear();
    return transaccion;
  }

  clear(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
    this.pendingTransaccion = null;
  }
}
