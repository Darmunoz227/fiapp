# Feature 023 - Tasks

Test-first. RED before GREEN. Commits atómicos. No merge a main.

T001. DOCS. spec.md + plan.md + tasks.md committeados ANTES de cualquier
      código. (commit 1)

T002. RED. Añadir a inventory-calculations.spec.ts un describe para
      calcularValorTotalInventario con los 4 casos obligatorios:
      - array vacío => 0
      - stock > 0 con costo_promedio 0 => aporta 0, sin NaN (mezclado con
        otra línea normal para probar que no rompe la suma)
      - varios productos => suma exacta
      - stock 0 con costo > 0 => aporta 0
      Ejecutar la suite y EVIDENCIAR el fallo (función inexistente).
      NO tocar código de producción todavía.

T003. GREEN (función). Implementar calcularValorTotalInventario y el tipo
      LineaValorInventario en inventory-calculations.ts. Mínimo: un reduce.
      Re-ejecutar la suite: los tests nuevos pasan, CERO regresiones.

T004. GREEN (presentación). Cablear en InventoryListPage:
      - valorTotalInventarioTexto() delegando en la función pura usando
        stockActual(id) + producto.costo_promedio de lo ya cargado.
      - bloque resumen en inventory-list.page.html sobre la lista,
        mismo *ngIf gate que la lista.
      - estilos SOLO con variables Ionic existentes.

T005. Verify (sin cambios estructurales):
      - git diff confirma cero toques en core/database/* y ningún
        CREATE/ALTER TABLE nuevo.
      - Suite completa: TOTAL: N SUCCESS; comparar N contra el baseline
        previo (162 specs históricos) => N_final = N_base + 5 nuevos.
      - Ningún test existente borrado ni debilitado (diff de .spec files
        solo ADICIONES).

T006. DEVICE (posterior al piloto, gate antes de merge, BY HAND Pixel_8):
      - total visible y correcto con productos con costo
      - producto "Sin costo registrado" presente: total no es NaN y coincide
        con la suma manual de las filas que sí tienen costo
      - producto con stock 0 aporta 0
      - inventario recién instalado (vacío): sin bloque roto / total $0
      - dark mode y light mode legibles (Decision 029)
