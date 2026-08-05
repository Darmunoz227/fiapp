# Feature 015 - Money input pattern across POS and inventory

## Problem

The merchant types money into fields that start at 0 and show no thousands separator. To enter 15000 they must first delete the 0, and what they see while typing is 15000, not 15.000. On a POS used dozens of times a day this is friction on the critical path.

The correct pattern ALREADY EXISTS in nueva-transaccion (manual fiado): a text input with inputmode numeric, a string field that starts empty, and handlers that reformat while preserving the caret position. The task is to EXTRACT that pattern, not to invent a new one.

## Scope

Four MONEY fields receive the pattern:

- ventas.page.html: precio, abono
- inventory-movement.page.html: costo_unitario
- inventory-list.page.html: precio_venta

## Out of scope, and why

QUANTITY fields are explicitly excluded: cantidad in ventas, cantidad and conteo_fisico in inventory movements, and minimo_stock. cantidad may be decimal because products can be sold by weight in grams under Decision 014, and formatCurrencyCOP truncates to zero decimals. Applying the money pattern to those fields would break weight-based sales.

Inventory value per product AT COST is Feature 016. It is a calculation and display feature with its own pending decision about products whose costo_promedio is 0 while holding stock.

## Functional requirements

RF-01. The caret-position logic MUST be extracted into a PURE function in shared/utils, with zero imports from Ionic, Capacitor or Angular, per Principle II. It receives the raw text, the caret position and the formatted text, and returns the new caret position.

RF-02. nueva-transaccion MUST be migrated to the extracted function. Its behaviour MUST NOT change. The suite staying green is the safety net for this step.

RF-03. The paste handler MUST apply the caret position it computes.

RF-04. Every money field MUST start EMPTY, never at 0. The bound field is a string, and the numeric value is derived through parseCurrencyInput.

RF-05. Money fields MUST use type text with inputmode numeric. type number cannot render a thousands separator because the browser rejects the separator as an invalid numeric value.

RF-06. Formatting MUST go through formatCurrencyCOP so COP is shown without decimals, per the constitution.

RF-07. Quantity fields MUST be left untouched.

RF-08. No schema change, no migration, no SQL. Read and display only.

## Acceptance criteria

AC-01. The pure function returns the correct caret position for: caret at the start, caret in the middle of a formatted number, caret at the end, and an empty string.

AC-02. nueva-transaccion still behaves identically after migration, with the suite green.

AC-03. Every money field renders empty on open. No 0 to delete.

AC-04. Typing 15000 into a money field displays 15.000 while typing, and the caret stays where the merchant expects.

AC-05. Pasting a value into a money field leaves the caret after the pasted digits.

AC-06. A sale by weight with a decimal quantity still works. Quantity fields show no thousands separator.

## Device verification, the only evidence

Karma never renders an ion-input, never fires a real input event and never manipulates a caret. It can only prove the pure function. On the Android Pixel_8, for each of the four money fields: open the screen and confirm the field is empty, type a five digit amount and watch the separator appear while the caret stays put, delete digits from the middle, paste a value. Then register a sale by weight to confirm quantities were not broken.
