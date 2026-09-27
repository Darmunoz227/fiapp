# Spec: Importador CSV de Inventario

## Contexto
Negocios con catálogos grandes (ropa, abarrotes) abandonan la app en la carga inicial porque crear producto por producto es muy lento. El importador CSV elimina esta fricción permitiendo la carga masiva desde un archivo preparado en el PC.

## Criterios de Aceptación (AC)
- **AC-01 (Plantilla):** Un botón permite generar localmente `plantilla_inventario.csv` y abrir el menú Share para enviarlo al PC, con las cabeceras: `Nombre,Precio,Cantidad_Actual,Costo_Unitario,Stock_Minimo`.
- **AC-02 (Selección):** Un input de archivo (`accept=".csv"`) permite cargar el documento lleno en la app.
- **AC-03 (Parseo seguro):** Se validan los datos. `Nombre` es obligatorio; `Precio`, `Cantidad_Actual`, `Costo_Unitario` y `Stock_Minimo` deben ser números >= 0 (si están vacíos, asumen 0).
- **AC-04 (Vista Previa y Bloqueo):** Se muestra un resumen ("N productos detectados, M errores"). Si hay errores (ej. texto donde va un número), se lista la fila del error y se BLOQUEA la importación. Solo se importa si el archivo es 100% válido.
- **AC-05 (Guardado Atómico):** Al confirmar, todos los productos se guardan en UNA SOLA transacción. Cada producto insertado genera automáticamente su movimiento `AJUSTE` inicial (Decisión 057).
- **AC-06 (Solo nuevos):** Para mantener la simplicidad y seguridad de la v1, el CSV es exclusivo para CARGA INICIAL masiva. No actualiza productos existentes (evita colisiones de nombres o UUIDs).
