import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LocalStorage {
  get length(): number {
    return localStorage.length;
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }

  key(index: number): string | null {
    return localStorage.key(index);
  }
}
