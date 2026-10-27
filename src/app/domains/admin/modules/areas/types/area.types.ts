export interface AreaList {
  id: string;
  clave: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  fechaCreacion: string;
}

export interface AreaDetalle {
  id: string;
  clave: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

export interface AreaCreate {
  clave: string;
  nombre: string;
  descripcion: string | null;
}

export interface AreaUpdate {
  clave: string;
  nombre: string;
  descripcion: string | null;
}

export interface AreaEstatus {
  activo: boolean;
}