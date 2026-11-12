export interface EquipoSoporteIntegrante {

  id: string;
  empresaId: string;

  equipoSoporteId: string;
  usuarioId: string;

  usuarioNombre: string;
  usuarioCorreo: string;

  activo: boolean;

  fechaCreacion: string;
  usuarioCreacion: string;

  fechaActualizacion: string | null;
  usuarioModificacion: string | null;
}

export interface UsuarioDisponibleSoporte {

  id: string;

  nombre: string;
  apellidos: string;

  nombreCompleto: string;
  correo: string;
}

export interface EquipoSoporteIntegranteCrear {
  usuarioId: string;
}