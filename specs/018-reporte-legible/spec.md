# Feature 018 - Readable report shareable over WhatsApp

## Problem

To understand their numbers today the merchant exports the raw JSON backup and pastes it into an AI chatbot to get a summary. Every figure they need already exists in reportes-calculations. The app should produce the readable report itself.

## Scope

A button on the Reportes screen builds a plain-text summary for the current range (HOY or TODO) and hands it to the native share sheet, reusing the Feature 014 Share path. No new dependency.

This feature is PRESENTATION ONLY. It computes nothing new: it reads the existing ResumenReporte and adds three pure derivations - average sale, margin percent, and profit, all from figures already present. Nothing touches the database beyond the reads the Reportes screen already performs.

## The text

Spanish, tienda language, COP without decimals per the constitution. Example:

  Reporte FiApp - Hoy
  Tienda Deportiva

  Vendido: 150.000
  Ganancia: 45.000 (margen 30 por ciento)
  Venta promedio: 25.000
  Ventas: 6

  Como te pagaron las ventas:
    De contado: 90.000
    Quedo fiado: 60.000

  Movimientos de fiado aparte:
    Fiados a mano: 50.000
    Abonos recibidos: 20.000

## Naming, chosen to avoid merchant confusion

"Venta promedio", not "ticket promedio": ticket is retail jargon a shopkeeper does not use.

The two fiado concepts MUST be separated by MEANING, not by the word. Fiado inside a sale (monto_fiado) is money owed FROM a sale of products. Manual fiado (transaccion with venta_id null, Decision 032) is a hand-written credit with no sale behind it. Summing them double counts debt, the exact bug Decision 032 fixed. The report groups them under two distinct headers: "Como te pagaron las ventas" for contado and the sale-level fiado, and "Movimientos de fiado aparte" for manual credits and abonos. The manual one keeps the word "Fiados a mano": prestamo was rejected because it evokes a money lender, which is not the app focus, and the two HEADERS keep the concepts apart without changing the word.

## Derivations (Group A, pure)

Venta promedio = totalVendido / numeroVentas, 0 when no sales.
Margen = gananciaTotal / totalVendido times 100, whole number, 0 when nothing sold.
Utilidad = gananciaTotal, already present.

## Out of scope, backlog

Clientes nuevos, dias con mas ventas, weekly or monthly evolution all need NEW queries the resumen does not carry. Evolution is a chart and belongs to the postponed financial dashboard. Deferred. Profit and margin are sensitive to an EMPLOYEE per Principle V, but roles are not implemented; recorded, not gated.

## Functional requirements

RF-01. A share button on Reportes builds the text for the currently selected range and opens the share sheet.
RF-02. The builder is a PURE function beside reportes-calculations, taking ResumenReporte plus business name and range, returning a string. Zero framework imports.
RF-03. All money through formatCurrencyCOP, no decimals.
RF-04. The two fiado groups appear under their two distinct headers and are never summed.
RF-05. Sharing reuses the Feature 014 Share path; a cancelled share sheet stays silent per Decision 035.
RF-06. Read and display only. No schema, no write, no freemium gate, reading is free per Decision 033.

## Acceptance criteria

AC-01. With sales, the text shows Vendido, Ganancia with margin, Venta promedio and Ventas, matching the on-screen figures.
AC-02. Contado and sale-level fiado under the ventas header; manual credits and abonos under the aparte header. Visibly separate.
AC-03. With zero sales, Venta promedio and margen are 0 and nothing divides by zero.
AC-04. HOY covers only today; TODO everything, matching the range on screen.
AC-05. Cancelling the share sheet shows nothing.

## Device verification

Karma proves the pure builder but never opens a share sheet. On the Android Pixel_8 with real sales, one manual fiado and one abono: share HOY and TODO, confirm every figure matches the Reportes screen, the two fiado groups stay separate, the text arrives whole in WhatsApp, and cancelling is silent.
