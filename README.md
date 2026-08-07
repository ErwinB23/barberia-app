# Barbería App

Aplicación móvil para la gestión integral de una barbería, incluyendo reservas, servicios,
disponibilidad, clientes, barberos, pagos, notificaciones y administración.

## Estado actual

El proyecto se encuentra en fase de cimentación arquitectónica. Las funcionalidades del negocio y
la integración con el backend se implementarán de forma progresiva.

## Stack

- Expo SDK 57
- React Native
- Expo Router
- TypeScript strict
- Supabase como backend planificado
- Android e iOS como plataformas principales

## Arquitectura

El proyecto utilizará una arquitectura feature-first para mantener cada capacidad del negocio
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

Actualmente, el proyecto es personal y no tiene una licencia pública definida.
