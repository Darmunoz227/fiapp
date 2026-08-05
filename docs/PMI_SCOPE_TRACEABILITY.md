### 1. FEATURE INVENTORY
| Feature ID | Feature name | Functional module (clients / sales-POS / credit-fiados / inventory / reports / settings) | Status (done / in progress / pending) | Merged to main? (yes/no) | Short description (1 line, business language, no code) |
|---|---|---|---|---|---|
| 001 | Borrado seguro y recuperable de clientes y transacciones | clients | done | yes | Lets the merchant hide a customer or debt record and bring it back if the deletion was a mistake. |
| 002 | Catálogo de productos y movimientos de inventario | inventory | done | yes | Lets the merchant register products, track stock from history, and see low-stock alerts. |
| 003 | Anulación y restauración de movimientos de inventario | inventory | done | yes | Lets the merchant correct a wrong stock movement without losing the record. |
| 004 | Ventas de un solo producto con contado o fiado | sales-POS | done | yes | Records a single-item sale, reduces stock, and creates customer debt when the sale is on credit. |
| 005 | Reportes de ventas y ganancias | reports | done | yes | Shows today or all-time sales totals, profit, and a read-only list of sales. |
| 006 | Fortalecimiento de atomicidad en registros de inventario | inventory | done | yes | Keeps purchase cost updates and inventory movements from splitting apart when a save fails. |
| 007 | Pago parcial y mixto en ventas | sales-POS | done | yes | Lets a customer pay part in cash and part on credit in one sale. |
| 008 | Arreglo de transacciones nativas para escrituras locales | inventory | done | yes | Prevents device-side write failures so sales and stock operations complete reliably. |
| 009 | Ajustes de experiencia y legibilidad en pantalla | reports | done | yes | Makes mixed sales visible, the business name readable, and dark mode usable. |
| 010 | Corrección de superposición al navegar | settings | done | yes | Stops the next screen from showing through during page transitions. |
| 011 | Ventas con varios productos | sales-POS | done | yes | Lets the merchant confirm one sale with several lines instead of repeating sales. |
| 012 | Trazabilidad de fiados en reportes | credit-fiados | done | yes | Shows who owes, what was sold on credit, and separates manual debts and payments. |

### 2. REMAINING SCOPE (the missing ~7%)
| Item | Why it is still open | Priority label if one exists (P0/P1/P2...) | Blocking or non-blocking |
|---|---|---|---|
| Abonos posteriores a una deuda existente | Debt repayment is still separate from new credit sales, so a fiado can be recorded but not paid down later. | P3 | non-blocking |
| Migración de dinero a enteros | Money still uses decimal values with tolerance, and changing that would touch several sale flows. | P5 | non-blocking |
| Respaldo y exportación de datos | The current export path does not yet cover all merchant data, so a lost phone can still mean lost books. | P6 | blocking |
| Rendimiento de reportes | The report still loads full history without virtualization, which may become slow as records grow. | P7 | non-blocking |
| Reinicio de datos para el comerciante | Merchants still want a way to restart products and sales without losing clients and debt. | P8 | non-blocking |
| Endurecer el freemium | The current limit only blocks new customers, not ongoing use with existing customers. | P9 | non-blocking |
| Reporte legible compartible por WhatsApp | Merchants still need a report the app itself can generate and share. | P10 | non-blocking |

### 3. REQUIREMENT ORIGINS
| Feature ID | Requested by (founder / pilot merchant / academic requirement / technical need) | Role of requester | Communication channel if recorded (in-person visit, WhatsApp, phone, direct observation, internal decision) | Approximate date (from commit date or doc date) |
|---|---|---|---|---|
| 001 | not documented | not documented | not recorded | not documented |
| 002 | not documented | not documented | not recorded | 2026-07-16 |
| 003 | not documented | not documented | not recorded | 2026-07-24 |
| 004 | not documented | not documented | not recorded | 2026-07-24 |
| 005 | not documented | not documented | not recorded | 2026-07-24 |
| 006 | technical need | not applicable | not recorded | 2026-07-30 |
| 007 | founder | Carol | internal decision | 2026-07-30 |
| 008 | technical need | not applicable | not recorded | 2026-07-31 |
| 009 | pilot merchant | merchant user | direct observation | 2026-08-01 |
| 010 | pilot merchant | merchant user | direct observation | 2026-08-01 |
| 011 | not documented | not documented | not recorded | 2026-08-02 |
| 012 | founder | Carol | internal decision | 2026-08-03 |

### 4. REJECTED, DEFERRED OR CHANGED SCOPE
| Item | Decision (rejected / deferred / modified) | Reason | Where it is documented |
|---|---|---|---|
| Mutable stock cache or projection | rejected | Stock must stay derived from the movement log, not duplicated in a mutable field. | DECISIONS.md; Feature 002 spec.md |
| Role-based negative-stock override | rejected | The inventory MVP does not include users, roles, or admin permissions. | DECISIONS.md; Feature 002 spec.md |
| CSV/Excel import for inventory | deferred | Quick Add and manual onboarding were preferred over spreadsheet import. | DECISIONS.md; Feature 002 spec.md |
| Physical delete of inventory movements | rejected | Movements must remain traceable; corrections use logical deletion or adjustment flows. | DECISIONS.md; Feature 003 spec.md |
| Annulling purchase movements | rejected | Purchase errors are corrected by adjustment, not by undoing the purchase. | Feature 003 spec.md |
| Custom report ranges, charts, export, product-level report | deferred | Reports were limited to Hoy/Todo and read-only summary/list views. | Feature 005 spec.md |
| Manual reconciliation of credit sales and manual fiados | deferred | The report keeps manual debts separate from sale-linked credit. | Feature 005 spec.md; Feature 012 spec.md |
| Later abonos against existing debt | deferred | Debt repayment is a separate future flow, not part of a sale. | Feature 007 spec.md; Feature 012 spec.md |
| Integer-cents money migration | deferred | Money stays decimal for now with a small tolerance in the invariant. | Feature 007 spec.md; Feature 011 spec.md |
| Native platform test harness / executeSet migration | deferred | The transaction fix stayed focused on the explicit wrapper and did not widen scope. | Feature 008 spec.md |
| Dark-mode toggle inside the app | rejected | System appearance support was kept; no in-app toggle was added. | Feature 009 spec.md |
| Custom navigation animations and router changes | deferred | The transition fix was limited to theming and background behavior. | Feature 010 spec.md |
| Editing or splitting a confirmed sale | rejected | Confirmed sales stay immutable; multi-item editing happens only before confirmation. | Feature 011 spec.md |
| Discounts, taxes, barcode scanning | deferred | Multi-item sale scope stayed limited to core cart and line handling. | Feature 011 spec.md |
| Concept editing and layout rewrite in cliente detalle | deferred | The feature kept the current layout and only fixed the credit traceability. | Feature 012 spec.md |

### 5. QUALITY & VALIDATION EVIDENCE
- Total automated tests currently passing: 117, as recorded in PROJECT_CONTEXT.md.
- Platforms validated: Android yes, recorded; iOS yes, recorded; web not explicitly validated as a user run, only covered through the web/mock test path described in the docs.
- Pilot merchant feedback explicitly mentioned: the docs say dark mode made the app unreadable for a pilot merchant before Feature 009, and PROJECT_CONTEXT.md says the Android pilot merchant is now confirmed unblocked; the same context also records a real merchant asking to restart inventory without losing client debts.
- Current database schema version: v7, documented in PROJECT_CONTEXT.md and Decision 032.