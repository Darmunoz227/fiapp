# Plan de Implementación

1. **CsvParserService (Lógica Pura):**
   - Recibe un texto crudo, lo separa por saltos de línea y comas, y devuelve un objeto `{ validos: [], errores: [] }`.
   - Se testea sin dependencias externas (TDD estricto sin mocks).

2. **DatabaseService (Persistencia):**
   - Método `importarProductosCSV(productos)`.
   - Usa `this.ejecutarEnTransaccion(sql, values, true)` para iterar e insertar el Producto y su AJUSTE inicial de forma atómica.

3. **ImportadorCsvComponent (UI Standalone):**
   - Flujo de estados: `INICIO` -> `VISTA_PREVIA` -> `CARGANDO` -> `EXITO`.
   - Reutiliza el patrón de `Filesystem` y `Share` de Capacitor que ya existe en `RespaldoService` para exportar la plantilla.
