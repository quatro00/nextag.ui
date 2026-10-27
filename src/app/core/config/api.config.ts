import { InjectionToken } from '@angular/core';

export const API_URL = new InjectionToken<string>('API_URL');

export const apiConfig = {
  baseUrl: 'https://localhost:7046/api',
};