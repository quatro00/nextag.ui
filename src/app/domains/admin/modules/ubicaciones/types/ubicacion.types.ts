export interface UbicacionList {
  id: string;
  empresaId: string;

  sucursalId: string;
  sucursalNombre: string;

  tipoUbicacionId: string | null;
  tipoUbicacionNombre: string | null;

  ubicacionPadreId: string | null;
  ubicacionPadreNombre: string | null;

  clave: string;
  nombre: string;
  descripcion: string | null;

  activo: boolean;
}

export interface UbicacionDetalle extends UbicacionList {
  fechaCreacion: string;
  usuarioCreacion: string;

  fechaActualizacion: string | null;
  usuarioModificacion: string | null;
}

export interface UbicacionCreate {
  sucursalId: string;

  tipoUbicacionId: string | null;
  ubicacionPadreId: string | null;

  clave: string;
  nombre: string;
  descripcion: string | null;
}

export type UbicacionUpdate = UbicacionCreate;

export interface UbicacionEstatus {
  activo: boolean;
}

/**
 * Se utiliza únicamente para representar
 * la estructura jerárquica en el frontend.
 */
export interface UbicacionFilaArbol extends UbicacionList {
  nivel: number;
  tieneHijos: boolean;
}