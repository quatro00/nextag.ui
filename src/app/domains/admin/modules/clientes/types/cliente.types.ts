export interface ClienteList {
  id: string;
  empresaId: string;

  clave: string;
  nombre: string;

  razonSocial: string | null;
  rfc: string | null;

  correo: string | null;
  telefono: string | null;

  contactoPrincipal: string | null;
  telefonoContacto: string | null;
  correoContacto: string | null;

  activo: boolean;
}

export interface ClienteDetalle extends ClienteList {
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

export interface ClienteGuardar {
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

  contactoPrincipal: string | null;
  telefonoContacto: string | null;
  correoContacto: string | null;

  observaciones: string | null;
}

export interface ClienteFiltros {
  activo?: boolean;
  buscar?: string;
}