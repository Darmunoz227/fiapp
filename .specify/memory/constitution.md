<!-- Sync Impact Report Version change: template -> 1.0.0 (initial adoption) Modified principles: none (initial adoption) Added sections: all (initial adoption) Removed sections: none Templates reviewed: ✅ plan-template.md; ✅ spec-template.md; ✅ tasks-template.md Deferred items: none. AMENDMENT 1.1.0 (2026-08-05): Modified sections: Restricciones de Alcance, added EXCEPCION TEMPORAL for the Feature #13 hardcoded activation password. Principles changed: none. Templates reviewed: no changes required --> # FiApp Constitution

## Core Principles

### I. Stack Bloqueado y Standalone Estricto
La base tecnica de FiApp es no negociable: Ionic con Angular standalone
components, Capacitor y @capacitor-community/sqlite. Todo el codigo nuevo y
modificado MUST compilar con TypeScript strict habilitado. Queda prohibido crear
o reintroducir NgModules; el enrutamiento lazy MUST usar loadComponent.

### II. Clean Architecture en 3 Capas
La arquitectura MUST separarse en tres capas: core/domain, core/data y
features. core/domain contiene logica pura y MUST tener cero imports de
framework. El dominio NUNCA importa Ionic, SQLite ni Capacitor. Los servicios
de aplicacion y casos de uso se conectan por inyeccion de dependencias y por
interfaces explicitas.

### III. Integridad de Datos Inmutable
Stock y costo promedio ponderado MUST derivarse exclusivamente del log
append-only movim_inventario. Queda prohibido almacenar stock_actual mutable
como fuente de verdad. El costo en venta_items MUST congelarse por snapshot al
momento de la venta; las ganancias historicas son inmutables. Todos los
borrados MUST ser soft-delete mediante deleted_at tombstones, y queda prohibido
DELETE fisico. Toda query funcional MUST filtrar deleted_at IS NULL cuando
aplique. Toda tabla sincronizable MUST incluir created_at, updated_at,
deleted_at, store_id y created_by. Cada conexion SQLite MUST activar
PRAGMA foreign_keys = ON.

### IV. Offline-First con Outbox
Toda accion de usuario MUST completarse contra SQLite local con latencia
objetivo menor a 100 ms por operacion en camino critico. La nube nunca puede
bloquear la UX transaccional. Toda escritura que requiera sincronizacion remota
MUST registrarse en un Outbox para procesamiento posterior y reintentos.

### V. Seguridad por Dominio y Roles
Existen dos roles oficiales: OWNER y EMPLOYEE. Las verificaciones de permisos
MUST vivir en la capa de dominio, no solo en la UI. Un EMPLOYEE no puede ver
costo o ganancia, no puede borrar registros y no puede cambiar precios. La UI
restringida MUST ocultarse, no solo deshabilitarse.

## UX y Reglas de Producto

El flujo de checkout MUST resolverse en tres taps o menos en el camino feliz.
La interfaz MUST minimizar carga cognitiva y mantener lenguaje claro para uso
diario en tienda. El idioma por defecto y textos principales MUST ser espanol
de Colombia (es-CO). Los valores monetarios MUST mostrarse en COP sin
decimales.

## Restricciones de Alcance (No Hacer Aun)

Quedan fuera de alcance hasta nueva enmienda constitucional: facturacion
electronica DIAN, funcionalidades de IA, contabilidad completa (balance general
y libro mayor), FIFO o manejo por lotes, marketplace y cualquier mecanismo con
contrasenas de activacion hardcodeadas.

EXCEPCION TEMPORAL v1.1.0: se autoriza la contrasena de activacion
hardcodeada implementada en Feature #13, unicamente como mecanismo de
friccion para el piloto. Sus limites estan registrados en la Decision 033:
la contrasena es legible en el bundle JS y reinstalar reinicia el contador
de dias. La excepcion caduca cuando existan codigos de activacion por
dispositivo, momento en el que la restriccion original vuelve a aplicar sin
enmienda adicional.

## Governance

Esta constitucion prevalece sobre practicas informales y plantillas genericas.
Toda enmienda MUST actualizar este archivo y su Sync Impact Report en el mismo
cambio. El versionado constitucional usa semver: MAJOR para redefinir o remover
principios, MINOR para agregar principios o secciones sustantivas y PATCH para
aclaraciones de redaccion sin impacto normativo. Toda revision de codigo MUST
incluir validacion explicita de cumplimiento constitucional.

**Version**: 1.1.0 | **Ratified**: 2026-07-13 | **Last Amended**: 2026-08-05
