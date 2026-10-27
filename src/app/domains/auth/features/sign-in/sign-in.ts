import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  required,
  submit,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.services';

@Component({
  selector: 'auth-sign-in',
  templateUrl: './sign-in.html',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormField,
  ],
})
export default class AuthSignIn {
  private router = inject(Router);
  private authService = inject(AuthService);

  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected signInFormModel = signal({
    email: '',
    password: '',
  });

  protected signInForm = form(
    this.signInFormModel,
    (form) => {
      required(form.email, {
        message: 'Ingresa tu correo electrónico',
      });

      email(form.email, {
        message: 'Ingresa un correo electrónico válido',
      });

      required(form.password, {
        message: 'Ingresa tu contraseña',
      });
    }
  );

  signIn(event: Event): void {
    event.preventDefault();

    submit(this.signInForm, async () => {
      this.loading.set(true);
      this.errorMessage.set(null);

      try {
        await firstValueFrom(
          this.authService.login({
            email: this.signInFormModel().email,
            password: this.signInFormModel().password,
          })
        );

        if (!this.authService.hasRole('ADMINISTRADOR')) {
          this.authService.logout();

          this.errorMessage.set(
            'El usuario no tiene acceso al portal de administración.'
          );

          return;
        }

        await this.router.navigateByUrl('/admin/inicio');
      } catch (error) {
        if (error instanceof HttpErrorResponse) {
          this.errorMessage.set(
            error.error?.message ??
              'No fue posible iniciar sesión.'
          );
        } else {
          this.errorMessage.set(
            'No fue posible iniciar sesión.'
          );
        }
      } finally {
        this.loading.set(false);
      }
    });
  }
}