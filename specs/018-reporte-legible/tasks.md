# Feature 018 - Tasks

Test-first. RED before GREEN. Confirm TOTAL: N SUCCESS before every commit. wc -l before every git add.

T001. RED. Builder spec: with sales, the text contains Vendido, Ganancia with margin, Venta promedio and Ventas. With zero sales, venta promedio and margen are 0 and no division by zero. Contado and sale-level fiado under the ventas header; manual credits and abonos under the aparte header. The business name appears, and a blank name degrades to a generic header.

T002. GREEN. Implement construirTextoReporte beside reportes-calculations. Pure, zero framework imports, money through formatCurrencyCOP.

T003. Add a share button to Reportes. Read the business name from Preferences, build the text for the currently selected range from the resumen the page already holds, share through the Feature 014 path with the silent-cancel handling from Decision 035.

T004. Gate before merge. grep for as any, ts-ignore and any returns nothing. grep -c this.db.run still returns 1. Build green. Full suite green with the new count recorded.

T005. DEVICE. Android Pixel_8 with real sales, one manual fiado and one abono. Share HOY and TODO. Confirm every figure matches the Reportes screen for the same range, the two fiado groups are under separate headers and never summed, the text arrives whole in WhatsApp, and cancelling the share sheet is silent.

T006. Write Decision 039 and update PROJECT_CONTEXT sections 3 and 10.
