import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import { LocalStorage } from '@/app/core/local-storage';
import {
    AuthUser,
    LoginRequest,
    LoginResponse,
} from '@/app/domains/auth/types/auth.types';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private http = inject(HttpClient);
    private localStorage = inject(LocalStorage);
    private apiUrl = inject(API_URL);

    private readonly tokenKey = 'nextag.accessToken';
    private readonly userKey = 'nextag.user';

    readonly user = signal<AuthUser | null>(this.getStoredUser());

    isAuthenticated(): boolean {
        return (
            !!this.accessToken &&
            !!this.user() &&
            !this.isTokenExpired()
        );
    }

    login(request: LoginRequest): Observable<LoginResponse> {
        return this.http
            .post<LoginResponse>(`${this.apiUrl}/Auth/login`, request)
            .pipe(
                tap((response) => {
                    this.setSession(response);
                })
            );
    }

    logout(): void {
        this.localStorage.removeItem(this.tokenKey);
        this.localStorage.removeItem(this.userKey);

        this.user.set(null);
    }

    isTokenExpired(): boolean {
        const token = this.accessToken;

        if (!token) {
            return true;
        }

        try {
            const payloadPart = token.split('.')[1];

            if (!payloadPart) {
                return true;
            }

            const base64 = payloadPart
                .replace(/-/g, '+')
                .replace(/_/g, '/');

            const padded = base64.padEnd(
                Math.ceil(base64.length / 4) * 4,
                '='
            );

            const payload = JSON.parse(atob(padded));

            if (typeof payload.exp !== 'number') {
                return true;
            }

            return Date.now() >= payload.exp * 1000;
        } catch {
            return true;
        }
    }

    hasRole(role: string): boolean {
        const user = this.user();

        if (!user) {
            return false;
        }

        const normalizedRole = role.trim().toUpperCase();

        return user.roles.some(
            (x) => x.trim().toUpperCase() === normalizedRole
        );
    }

    hasAnyRole(roles: string[]): boolean {
        return roles.some((role) => this.hasRole(role));
    }

    get accessToken(): string | null {
        return this.localStorage.getItem(this.tokenKey);
    }

    private setSession(response: LoginResponse): void {
        this.localStorage.setItem(
            this.tokenKey,
            response.accessToken
        );

        this.localStorage.setItem(
            this.userKey,
            JSON.stringify(response.user)
        );

        this.user.set(response.user);
    }

    private getStoredUser(): AuthUser | null {
        const value = this.localStorage.getItem(this.userKey);

        if (!value) {
            return null;
        }

        try {
            return JSON.parse(value) as AuthUser;
        } catch {
            this.localStorage.removeItem(this.userKey);
            return null;
        }
    }
}