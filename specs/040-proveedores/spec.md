# Feature 040 - Gestion de Proveedores y Asociacion al Inventario

## Problema
Los comerciantes dependen de una relacion estrecha con sus proveedores (ej. el cuaderno fisico de "Doña Yudith"). Necesitan tener el contacto a la mano para reabastecer inventario rapidamente y, eventualmente, manejar cuentas por pagar. El sistema no contemplaba la entidad "Proveedor".

## Evidencia (Reconstruida)
Almacenar contactos separados del inventario generaba friccion. Asignar un proveedor directamente al producto habilita automatizaciones de alto valor, como el reabastecimiento inteligente por WhatsApp a un solo clic.

## Decision (Implementada de facto)
Crear la entidad independiente `Proveedor` en SQLite, gestionada por un `ProveedorRepository` (aplicando patron Repositorio puro para empezar a desensamblar el `DatabaseService`). Añadir el campo `proveedor_id` a la tabla `productos`.

## Criterios de Aceptacion (Reconstruidos post-codigo)
* AC-01: El comerciante puede crear, listar, editar y ver notas de proveedores in-line.
* AC-02: El formulario de producto (nuevo y edicion) incluye un desplegable opcional para asociar un proveedor.
* AC-03: La tarjeta del producto en la vista de inventario muestra un identificador del proveedor asociado.
* AC-04: Existe un boton para pedir por WhatsApp que abre la app nativa con un mensaje pre-armado y el numero formateado (+57).
* AC-05: El esquema exportado en los JSON de respaldo incluye la tabla de proveedores.

## Fuera de Alcance
* Gestion de Cuentas por Pagar (saldos y abonos a proveedores). Esto se delega a una futura Feature iterativa basada en el modelo de fiados.
* Soporte para multiples proveedores por un solo producto.
* Multiples codigos de pais para WhatsApp (se inicio con un MVP centrado en Colombia).
