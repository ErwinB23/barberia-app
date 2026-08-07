# Barbería App — Engineering Guidelines

## Project Context

- Expo SDK 57, React Native, Expo Router y TypeScript con `strict: true`.
- Supabase como backend.
- Android e iOS son las plataformas principales; implementar web solo cuando una funcionalidad lo requiera.

## Sources of Truth

- Antes de modificar APIs sensibles a versión de Expo, React Native, Expo Router o configuración nativa, consultar la documentación exacta de Expo SDK 57: https://docs.expo.dev/versions/v57.0.0/.
- Para Supabase, consultar la documentación oficial vigente.
- La versión instalada y las decisiones explícitas del repositorio prevalecen sobre ejemplos genéricos.
- Una Skill nunca prevalece sobre la documentación oficial/versionada ni sobre las reglas del proyecto.

## Product Roles

Los roles canónicos son `CLIENTE`, `BARBERO` y `ADMINISTRADOR`.

Ocultar interfaces nunca sustituye la autorización. Los permisos reales deben aplicarse mediante Supabase/RLS o lógica segura de servidor.

## Architecture

- Usar arquitectura feature-first.
- Mantener `src/app` delgado y limitado a rutas, layouts y composición de navegación.
- Colocar la lógica de negocio en features, no en componentes visuales.
- Evitar dependencias sobre internals de otras features.
- Compartir código solo cuando sea realmente reutilizable.
- No realizar reestructuraciones masivas sin una tarea explícita.

## TypeScript

- Mantener `strict: true` y evitar `any` salvo justificación excepcional.
- Validar en runtime toda entrada externa.
- Preferir tipos generados desde Supabase cuando corresponda.
- No duplicar tipos, roles o constantes con una fuente canónica.

## Supabase

- Usar migraciones versionadas y RLS en todos los datos accesibles desde el cliente.
- Nunca exponer `service_role` ni secretos en la aplicación.
- Ejecutar operaciones privilegiadas únicamente en un entorno seguro.
- Encapsular el acceso a Supabase; no dispersarlo arbitrariamente por componentes.
- Revisar Auth, RLS y seguridad al modificar datos, permisos o políticas.

## Security

- Aplicar mínimo privilegio y validar inputs y datos externos.
- No registrar tokens, claves ni datos personales sensibles.
- No guardar secretos en variables `EXPO_PUBLIC_*`.
- Revisar IDOR/BOLA, elevación de privilegios y políticas RLS incompletas.
- No silenciar errores de seguridad.

## UI/UX

- Crear una interfaz moderna, profesional, consistente, accesible y fácil de navegar.
- Usar tokens semánticos para colores, tipografía, espaciado y radios.
- Diseñar estados de loading, empty, error, disabled y success.
- Garantizar áreas táctiles adecuadas y no depender solo del color para comunicar estados.
- Respetar safe areas, teclado y características de cada plataforma.
- Priorizar la experiencia móvil antes que web.

## Code Quality

- Escribir código pequeño, enfocado, mantenible y con nombres orientados al dominio.
- Evitar duplicación, abstracciones prematuras y refactors fuera del alcance.
- No dejar código muerto, comentado, `catch` vacíos ni errores silenciados sin justificación.

## Testing

- Usar TDD para nueva lógica de negocio, bugs y cambios de comportamiento cuando sea razonable.
- Probar las reglas de dominio y añadir pruebas de regresión a los bug fixes cuando corresponda.
- Cubrir flujos críticos con pruebas de integración/E2E cuando exista la infraestructura.

## Debugging

- Reproducir antes de modificar, leer el error completo e identificar la causa raíz.
- Probar una hipótesis a la vez y evitar correcciones aleatorias.
- Después de varios intentos fallidos, detenerse y reconsiderar el enfoque o la arquitectura.

## Skills

Usar únicamente las Skills locales relevantes para la tarea:

- Expo/React Native: Skills Expo y React Native instaladas.
- UI: `expo-native-ui` + `ui-ux-pro-max`.
- Supabase: `supabase` + `supabase-postgres-best-practices`.
- Seguridad: `code-security`.
- Nueva funcionalidad o bugfix: `Test-Driven Development (TDD)` cuando corresponda.
- Bugs y fallos inesperados: `Systematic Debugging`.
- Antes de declarar una tarea terminada: `verification-before-completion`.

No cargar Skills irrelevantes solo porque estén disponibles.

## Definition of Done

Antes de afirmar que una tarea está terminada:

1. Ejecutar verificaciones nuevas.
2. Ejecutar como mínimo `npm run check`.
3. Ejecutar los tests relevantes cuando existan.
4. Revisar `git diff`.
5. Confirmar que no se modificaron archivos fuera del alcance.
6. Informar cualquier warning o limitación pendiente.

Nunca hacer commit, push, merge ni crear un PR salvo solicitud explícita.
