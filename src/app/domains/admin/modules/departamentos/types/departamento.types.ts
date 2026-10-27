export interface DepartamentoList {
  id: string;
  areaId: string;
  areaClave: string;
  areaNombre: string;
  clave: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  fechaCreacion: string;
}

export interface DepartamentoDetalle {
  id: string;
  areaId: string;
  areaClave: string;
  areaNombre: string;
  clave: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string | null;
  usuarioCreacionId: string | null;
  usuarioActualizacionId: string | null;
}

export interface DepartamentoCreate {
  areaId: string;
  clave: string;
  nombre: string;
  descripcion: string | null;
}

export interface DepartamentoUpdate {
  areaId: string;
  clave: string;
  nombre: string;
  descripcion: string | null;
}

export interface DepartamentoEstatus {
  activo: boolean;
}