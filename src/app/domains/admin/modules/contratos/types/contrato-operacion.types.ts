import {
    ContratoAccionEstado,
} from './contrato.types';

export type ContratoOperacion =
    ContratoAccionEstado | 'eliminar';

export interface ContratoOperacionDialogData {
    operacion: ContratoOperacion;
    titulo: string;
    mensaje: string;
    numeroContrato: string;
    nombreContrato: string;
    textoConfirmar: string;
    requiereMotivo: boolean;
    destructiva: boolean;
}

export interface ContratoOperacionDialogResult {
    confirmado: boolean;
    motivo: string | null;
}