import { HttpErrorResponse } from '@angular/common/http';

/** La API NexTag devuelve los errores de negocio en { message: string }. */
export function mensajeApi(error: unknown, predeterminado: string): string {
  if (error instanceof HttpErrorResponse) {
    if (typeof error.error?.message === 'string' && error.error.message.trim()) {
      return error.error.message;
    }
    if (typeof error.error?.title === 'string' && error.error.title.trim()) {
      return error.error.title;
    }
  }
  return predeterminado;
}
