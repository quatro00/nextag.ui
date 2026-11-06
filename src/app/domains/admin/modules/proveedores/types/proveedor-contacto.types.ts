export interface ProveedorContacto {
  id: string;
  empresaId: string;
  proveedorId: string;
  nombre: string;
  cargo: string | null;
  correo: string | null;
  telefono: string | null;
  celular: string | null;
  esPrincipal: boolean;
  activo: boolean;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaActualizacion: string | null;
  usuarioModificacion: string | null;
}

export interface ProveedorContactoGuardar {
  nombre: string;
  cargo: string | null;
  correo: string | null;
  telefono: string | null;
  celular: string | null;
  esPrincipal: boolean;
}
