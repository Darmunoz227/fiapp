import { Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';

@Injectable({
  providedIn: 'root'
})
export class MovimientoDeudaRepository {
  constructor(private db: DatabaseService) {}

  async registrarAbono(proveedorId: string, monto: number, notas?: string): Promise<void> {
    // TODO: Implementar logica transaccional
    throw new Error('Method not implemented.');
  }
}
