# Quickstart: Borrado seguro y recuperable (soft-delete)

## Goal
Verify that clientes and transacciones can be soft-deleted, restored immediately in context, and excluded from visible counts and balances while the app keeps using local SQLite.

## Expected Flow

1. Open the app and create or load a cliente with one or more transacciones.
2. Delete the cliente or a transaccion from the relevant UI.
3. Confirm the record disappears from the list and the affected totals update.
4. Use the immediate "Deshacer" action before leaving the context.
5. Confirm the record returns and the calculated values restore.
6. Close and reopen the app to confirm undo is no longer available after context loss.

## Verification Checklist

- Cliente borrado no aparece en listas activas.
- Transacción borrada no afecta el saldo visible.
- `deleted_at` is preserved in storage.
- Immediate undo works only in the current UI context.
- Freemium count excludes deleted clientes.
- No physical `DELETE` is used for this feature path.

## Recommended Manual Test Commands

```bash
npm run build
npm run test
```
