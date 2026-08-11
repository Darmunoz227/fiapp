# Feature 019 - Plan

## Approach

Read-only feature.

No schema change.
No migration.
No database writes.

Inventory value is derived in the UI:

valor_a_costo = stock × costo_promedio

The value is displayed on each inventory row.

The special case:

stock > 0
costo_promedio = 0

renders:

"Sin costo registrado"

instead of "$0".

## Why no persistence

Stock is already derived from the immutable movement log (Decision 009).

valor_a_costo is a second-order derived value:

valor_a_costo = derived stock × stored costo_promedio

Persisting it would violate the same architectural rule that rejected stock caching.

## Risks

R1. Inventory rows already calculate stock. The feature must reuse that value and not perform duplicate queries.

R2. Products entered through AJUSTE can legitimately have stock with costo_promedio = 0. Showing "$0" would suggest the inventory has no value when in reality the cost is unknown.

R3. Inventory value must remain presentation only. No writes, no schema changes, no recalculation of costo_promedio.
