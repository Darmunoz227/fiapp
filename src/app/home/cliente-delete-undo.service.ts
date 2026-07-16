import { Injectable } from '@angular/core';
import { Cliente } from '../core/models/cliente.model';

@Injectable()
export class ClienteDeleteUndoService {
  private pendingCliente: Cliente | null = null;
  private timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  stage(cliente: Cliente): void {
    this.clear();
    this.pendingCliente = { ...cliente };
    this.timeoutHandle = setTimeout(() => this.clear(), 5000);
  }

  consume(): Cliente | null {
    const cliente = this.pendingCliente;
    this.clear();
    return cliente;
  }

  clear(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
    this.pendingCliente = null;
  }
}
