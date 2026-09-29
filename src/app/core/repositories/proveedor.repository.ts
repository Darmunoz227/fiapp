import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { DatabaseService } from '../database/database.service';

@Injectable({ providedIn: 'root' })
export class ProveedorRepository {
  private mockWebProveedores: any[] = [];

  constructor(private dbService: DatabaseService) {}

  // Getter auxiliar para abstraer el acceso interno al plugin SQLite
  private get db(): any {
    return (this.dbService as any).db;
  }
  
  private async ensureInit() {
    if (!(this.dbService as any).isInitialized) {
      await (this.dbService as any).initializePlugin();
    }
  }

  async crear(proveedor: any): Promise<string> {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    const now = new Date().toISOString();
    const nuevo = { ...proveedor, id, created_at: now, deleted_at: null };

    if (Capacitor.getPlatform() === 'web') {
      this.mockWebProveedores.push(nuevo);
      return id;
    }

    await this.ensureInit();
    const query = `INSERT INTO proveedores (id, nombre, telefono, contacto, notas, created_at) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [id, nuevo.nombre, nuevo.telefono || null, nuevo.contacto || null, nuevo.notas || null, now];
    await this.db.run(query, values);
    return id;
  }

  async obtenerTodos(): Promise<any[]> {
    if (Capacitor.getPlatform() === 'web') {
      return this.mockWebProveedores.filter(p => !p.deleted_at);
    }

    await this.ensureInit();
    const query = `SELECT * FROM proveedores WHERE deleted_at IS NULL ORDER BY nombre ASC`;
    const result = await this.db.query(query);
    return (result?.values as any[]) || [];
  }

  async actualizar(proveedor: any): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      const index = this.mockWebProveedores.findIndex((p: any) => p.id === proveedor.id);
      if (index !== -1) {
        this.mockWebProveedores[index] = { ...this.mockWebProveedores[index], ...proveedor };
      }
      return;
    }

    await this.ensureInit();
    const query = `UPDATE proveedores SET nombre = ?, telefono = ?, contacto = ?, notas = ? WHERE id = ?`;
    const values = [proveedor.nombre, proveedor.telefono || null, proveedor.contacto || null, proveedor.notas || null, proveedor.id];
    await this.db.run(query, values);
  }

  async eliminar(id: string): Promise<void> {
    const now = new Date().toISOString();
    if (Capacitor.getPlatform() === 'web') {
      const index = this.mockWebProveedores.findIndex((p: any) => p.id === id);
      if (index !== -1) {
        this.mockWebProveedores[index].deleted_at = now;
      }
      return;
    }

    await this.ensureInit();
    const query = `UPDATE proveedores SET deleted_at = ? WHERE id = ?`;
    await this.db.run(query, [now, id]);
  }
}
