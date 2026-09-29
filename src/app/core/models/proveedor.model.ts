export interface Proveedor {
  id: string;
  nombre: string;
  telefono?: string | null;
  contacto?: string | null;
  notas?: string | null;
  created_at: string;
  deleted_at?: string | null;
}
