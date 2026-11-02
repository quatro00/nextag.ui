export interface EmpresaList {
  id: string;
  clave: string;
  nombre: string;
  razonSocial: string | null;
  rfc: string | null;
  correo: string | null;
  activo: boolean;
  fechaCreacion: string;
}

export interface EmpresaDetalle extends EmpresaList {
  telefono: string | null;
  sitioWeb: string | null;
  logoUrl: string | null;
  usuarioCreacion: string;
  fechaActualizacion: string | null;
  usuarioModificacion: string | null;
}

export interface EmpresaCreate {
  clave: string;
  nombre: string;
  razonSocial: string | null;
  rfc: string | null;
  correo: string | null;
  telefono: string | null;
  sitioWeb: string | null;
  logoUrl: string | null;
}

export type EmpresaUpdate = EmpresaCreate;

export interface EmpresaEstatus {
  activo: boolean;
}