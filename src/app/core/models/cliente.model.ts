export interface Cliente {
  id: string; 
  nombre: string;
  telefono: string;
  habeas_data_flag: boolean; 
  fecha_creacion: number; 
  created_at?: number | null;
  updated_at?: number | null;
  deleted_at?: number | null;
  store_id?: string | null;
  created_by?: string | null;
}
