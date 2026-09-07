# Plan - Feature 033 Inicio legible

## Estrategia
Cambio SOLO visual. Cero schema, cero logica de negocio, cero servicios.
Se tocan home.page.html y home.page.scss; home.page.ts solo si las
etiquetas de los iconos lo exigen.

Orden: header -> quitar marca de agua -> tarjeta y boton principal ->
filas de cliente -> ajuste del FAB -> device (Android + modo oscuro).

## Riesgo principal y como se contiene
El Inicio es la pantalla que los 3 merchants usan a diario y TIENE tests,
incluido el de regresion de AC-06 de la Feature 030. Contencion:
- NO se renombra ninguna clase CSS existente.
- Suite despues de CADA bloque, no al final.
- git diff despues de cada cambio.

## Colores
Todo por variables de Ionic (Decision 029), nunca una custom property sin
fallback (Decision 030). Azul de acento = primary. Rojo (danger) SOLO
deuda; verde (success) SOLO saldado. Se elimina el amarillo (warning)
para montos. El FAB deja de ser negro solido para no competir con la
accion principal.

## Gates
- Suite verde antes de cada commit.
- Device Android con bundle fresco verificado por STRING LITERAL y
  cap run --target sin tuberia (Decision 053). Modo oscuro revisado.
