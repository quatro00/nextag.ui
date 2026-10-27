# Fuse Angular Starter

Base limpia y reutilizable construida a partir de Fuse 22.1.0 / Angular 22.1.

## Incluye

- Angular Material y estilos base de Fuse.
- Layout administrativo responsive con menú lateral.
- Tema claro, oscuro y sistema.
- Set de iconos Lucide incluido por Fuse.
- Pantalla de inicio vacía.
- Pantalla visual de inicio de sesión lista para conectar a una API.
- Configuración SPA sin SSR/Express.

## Se eliminó

- Dashboards de demostración.
- Academy, AI Chat, Calendar, Contacts, File Manager, Help Center, Mailbox, Notes, Orders, Scrumboard y Tasks.
- Extras, documentación, Coming Soon, Maintenance y Website demo.
- Assistant, shortcuts, notificaciones, usuario demo y publicidad de Fuse.
- Imágenes, fotografías, tarjetas y datos mock.
- FullCalendar, ApexCharts, Transloco, date-fns y dependencias exclusivas de demos.
- Caché `.angular`.

## Requisitos

Usar Node 24.15.0 o una versión compatible con Angular 22. El archivo `.nvmrc` ya apunta a 24.15.0.

```bash
nvm use
npm install
npm start
```

## Estructura para nuevos módulos

Crear cada módulo funcional dentro de:

```text
src/app/domains/admin/modules/<modulo>/
```

Agregar sus rutas en `src/app/domains/admin/routes.ts` y su acceso en `src/app/domains/admin/layout/data/navigation.ts`.

La autenticación actual es únicamente visual: al enviar el formulario navega a `/admin/inicio`. Cada proyecto debe conectar su API, sesión, guards e interceptores.
