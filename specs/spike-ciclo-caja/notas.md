# Spike - Ciclo de caja (evidencia acumulada antes del spec)

Mismo patron que specs/spike-produccion/notas.md: se acumula evidencia
ANTES de escribir el spec, distinguiendo su origen y su confiabilidad.

## Evidencia de MERCADO (Bancamia, cientos de comercios evaluados)

**M1 - La base de caja es la norma, no la excepcion.** Cerca del 80% de
los comercios deja una base en efectivo para el dia siguiente. Arrancar
en cero es minoritario.

**M2 - Incluso quienes dejan base tienen dias en cero.** Un imprevisto
puede llevarse la base cualquier dia; le pasa a todos. El caso "hoy
arranco en cero" NO es un error del merchant ni un caso raro: es parte
del uso normal.

## Evidencia de CAMPO (piloto, merchant de ropa deportiva, 2026-09-07)

**C1 - No anota gastos hormiga.** Tintos y almuerzos corrientes no se
registran; solo lo significativo. Ver Feature 032 spec.

**C2 - Saca efectivo de la caja para gastos familiares.** Retiro
personal: no es gasto del negocio, pero si no se registra la caja no
cuadra. Causa mas probable de los descuadres reportados.

## Implicaciones de diseno (aun no son decisiones)

- La base se SUGIERE desde el ultimo cierre, con confirmacion de un
  toque. NUNCA se arrastra automatica: el dia del imprevisto arrancaria
  con un numero falso y el cierre no cuadraria sin que el merchant sepa
  por que. Misma regla que la recurrencia de gastos (Feature 032): la
  app propone, el usuario confirma.
- Poner la base en cero debe costar un toque, no tres. Si cuesta, el
  merchant miente o abandona la pantalla.
- El retiro personal necesita ser un concepto propio, distinto de costo
  (mercancia) y de gasto (operacion). Sin el, el arqueo nunca cuadra.

## Preguntas abiertas (formular SIN pedir montos)

- "Al cerrar, deja algo de efectivo en la caja para el otro dia, o se lo
  lleva todo?" -> confirma si la base existe como practica. NO preguntar
  cuanto: preguntar por la plata rompe la confianza antes de tenerla.
- Cuando la caja no cuadra, que hace hoy? Lo anota, lo ignora, lo busca?
- Cuenta el efectivo al cerrar, o solo mira cuanto quedo?
