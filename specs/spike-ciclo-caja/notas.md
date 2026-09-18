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

## Evidencia de CAMPO (tienda de ropa, 2026-09-17)
Hablando con la EMPLEADA que hace relevos con la duena. Fue mas
explicita que la duena en varios puntos.

**C4 - El local maneja DOS cajas.** Entre el 10% y el 20% del
inventario es del esposo de la duena (socio que NUNCA atiende); el
resto es de ella. El dinero para gastos se retira de una u otra caja
SEGUN DE QUIEN ERA EL ARTICULO VENDIDO. El spike asumia UNA sola caja:
aqui hay dos bolsas alimentadas por el mismo mostrador. DECISION
PENDIENTE antes del spec: soportarlo o declararlo fuera de alcance.

**C5 - La base: n=2 y DIVERGEN.** La duena SI deja base. Miguel retira
todo pero RECUERDA con cuanto abrio y la repone al dia siguiente, y
dice que "puede variar segun la persona". Ninguna practica es
universal: confirma que la app SUGIERE y el usuario CONFIRMA, nunca
arrastra automatico.

**C6 - El descuadre SI se busca.** La duena: "se busca el faltante,
quizas una venta por anotar o un gasto que no se anota". Y cuenta el
efectivo al cerrar "para hacer el cierre de venta y cuadrar el total de
lo vendido". El arqueo le sirve porque YA hace ese trabajo a mano.

**C7 - El cuaderno NO es una lista de gastos: es un libro contable.**
En una misma hoja, sin formato fijo, anotan: cada venta con QUE
articulo, QUIEN lo vendio (duena o empleada) y el precio; que entro por
plataforma (Nequi / Daviplata / Bre-B) y que entro en efectivo (el
datafono aparentemente ya no lo usan); los gastos (ej. cambiar un
bombillo LED: saca de la caja, compra, anota); los pagos a proveedores;
y el FONDO de ahorro. Ejemplo textual visto ese dia: "48 S" en una
esquina = 48 mil pesos, la S es Sandra, la empleada.

Consecuencias:
- QUIEN VENDIO ya tiene columna: created_by existe desde la Feature 026
  y sigue vacia. La fase 2 de roles deja de ser hipotesis: hay un caso
  real de dos personas alternando en el mismo mostrador.
- FORMA DE PAGO discriminada esta confirmada en campo, no solo en el
  backlog.
- El FONDO (meta de ahorro para imprevistos y para el sueldo de la
  empleada) es un concepto NUEVO que no estaba en ningun backlog.
- La duena maneja ADEMAS un segundo cuaderno de uso exclusivo con sus
  compras, deudas y saldos a proveedores.
