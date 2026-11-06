export interface TipoProveedor {
  id: number;
  clave: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface ProveedorList {
  id: string;
  empresaId: string;
  clave: string;
  nombre: string;
  razonSocial: string | null;
  rfc: string | null;
  correo: string | null;
  telefono: string | null;
  activo: boolean;
  tipoProveedorIds: number[];
  tiposProveedor: string[];
}

export interface ProveedorDetalle extends ProveedorList {
  sitioWeb: string | null;
  direccion: string | null;
  colonia: string | null;
  municipio: string | null;
  estado: string | null;
  pais: string | null;
  codigoPostal: string | null;
  observaciones: string | null;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaActualizacion: string | null;
  usuarioModificacion: string | null;
}

export interface ProveedorGuardar {
  clave: string;
  nombre: string;
  razonSocial: string | null;
  rfc: string | null;
  correo: string | null;
  telefono: string | null;
  sitioWeb: string | null;
  direccion: string | null;
  colonia: string | null;
  municipio: string | null;
  estado: string | null;
  pais: string | null;
  codigoPostal: string | null;
  observaciones: string | null;
  tipoProveedorIds: number[];
}

export interface ProveedorFiltros {
  activo?: boolean;
  tipoProveedorId?: number;
  buscar?: string;
}
