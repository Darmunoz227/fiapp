# Feature 019 - Tasks

Test-first. RED before GREEN.

T001. RED. Add inventory-row tests covering:
- stock 10, costo_promedio 5000 => $50.000
- stock > 0, costo_promedio 0 => "Sin costo registrado"
- stock 0 => $0

T002. GREEN. Add a pure helper that derives valor_a_costo presentation from stock and costo_promedio.

T003. GREEN. Render inventory value on each product row.

T004. Verify no schema changes, migrations, writes, or freemium behavior changes.

T005. DEVICE. Android Pixel_8:
- product with cost shows inventory value
- product with stock and zero cost shows "Sin costo registrado"
- values survive reload
- inventory screen remains readable

T006. Write Decision 040 and update PROJECT_CONTEXT.
