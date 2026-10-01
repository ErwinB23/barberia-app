# Barbería App

Aplicación móvil para la gestión integral de una barbería, incluyendo reservas, servicios,
disponibilidad, clientes, barberos, pagos, notificaciones y administración.

## Estado actual

La aplicación cuenta con funcionalidades para clientes, barberos y administradores, integradas con
Supabase. Antes de publicarla, todavía deben validarse la configuración y los flujos en cada entorno.

## Stack

- Expo SDK 57
- React Native
- Expo Router
- TypeScript strict
- Supabase como backend
- Android e iOS como plataformas principales

## Arquitectura

El proyecto utiliza una arquitectura feature-first para mantener cada capacidad del negocio
cohesionada y permitir que la aplicación crezca sin mezclar responsabilidades.

```text
src/
├── app/
├── features/
├── shared/
├── infrastructure/
├── config/
└── theme/
```

- `app/`: rutas, layouts y composición de navegación con Expo Router.
- `features/`: funcionalidades organizadas por dominio de negocio.
- `shared/`: componentes, hooks, tipos y utilidades realmente reutilizables.
- `infrastructure/`: integraciones con servicios externos y detalles técnicos.
- `config/`: configuración central de la aplicación y del entorno.
- `theme/`: tokens visuales y soporte de temas.

## Requisitos

- Node.js compatible con Expo SDK 57
- npm

## Instalación

```bash
npm install
```

Copia `.env.example` a `.env.local` y completa las dos variables públicas de Supabase para tu
proyecto. `.env.local` no debe subirse a Git. La clave publicable puede estar en el cliente; nunca
uses ahí una `service_role` ni otra clave secreta. Para el envío de invitaciones por correo, toma
`supabase/functions/.env.example` como referencia y configura `RESEND_API_KEY` y
`RESEND_FROM_EMAIL` únicamente en el entorno seguro de la Edge Function. No copies esos valores al
entorno de Expo.

## Desarrollo

```bash
npm start
npm run android
npm run ios
npm run web
```

Android e iOS son los objetivos principales. El soporte web es secundario y se desarrollará cuando
una funcionalidad lo requiera.

## Calidad

```bash
npm run lint
npm run lint:fix
npm run typecheck
npm run format
npm run format:check
npm run check
```

`npm run check` ejecuta la verificación general de lint, tipos y formato antes de considerar un
cambio terminado.

## Organización del desarrollo

- Utilizar una rama Git por tarea.
- Mantener cambios pequeños y enfocados.
- Revisar y verificar los cambios antes de cada commit.
- `AGENTS.md` contiene las reglas de ingeniería del proyecto.
- `.agents/skills` contiene las Skills locales utilizadas por Codex.

## Roadmap

- Arquitectura base
- Supabase
- Autenticación y roles
- Catálogo
- Horarios y disponibilidad
- Reservas
- Pagos
- Administración
- Notificaciones
- Testing E2E
- IA

## Licencia

El repositorio es privado y el código propio de Barbería App no tiene una licencia pública definida.
El aviso de licencia de Expo se conserva en `THIRD_PARTY_NOTICES.md` y no es una licencia general
para esta aplicación.
