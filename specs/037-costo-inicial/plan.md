# Plan - Feature 037

## Enfoque

La decision de costo sale a una FUNCION PURA en inventory-calculations.ts, no
a un if dentro de crearMovimientoInterno. Razon: la suite corre solo la rama
web, y una funcion pura es lo unico que la suite puede defender de verdad.
El if quedaria sin test real.

Firma propuesta:

  resolverCostoPromedio(
    tipo: TipoMovimiento,
    costoPromedioActual: number,
    stockDerivado: number,
    cantidad: number,
    costoUnitario: number | null,
  ): number

Reglas, en este orden:
1. AJUSTE con costoUnitario mayor que 0 -> devuelve costoUnitario (REEMPLAZA).
2. AJUSTE sin costo (null, 0 o vacio) -> devuelve costoPromedioActual.
3. COMPRA o PRODUCCION -> delega en calcularCostoPromedioPonderado, sin
   tocarla. Esa funcion NO se modifica: es el corazon financiero y ya tiene
   tests. La regresion AC-05 la protege.
4. Cualquier otro tipo -> devuelve costoPromedioActual.

crearMovimientoInterno pasa a llamar a resolverCostoPromedio en vez de tener
la condicion inline, y escribe el costo solo si cambio.

## Orden de trabajo

Fase 1 - andamiaje: firma de resolverCostoPromedio devolviendo el costo
actual siempre, para que el RED falle por ASERCION y no por "Cannot find name".

Fase 2 - RED de la logica pura. Verificar la salida REAL: debe decir
"Expected X to be Y". Un RED que falla por TypeError o por nombre no existe no
es un RED (Decision 057). Verificar ANTES con grep -n "^describe(" que el
describe nuevo entra en el describe de nivel superior correcto.

Fase 3 - GREEN de la logica pura.

Fase 4 - cablear crearMovimientoInterno + el alta (inventory-list) con el
costo opcional. Test del alta anclado contra crearProductoConStockInicial con
sus ARGUMENTOS REALES, nunca con not.toHaveBeenCalled(), que pasa vacuo
(enmienda del AC-10 de la Feature 036).

Fase 5 - UI del modal: etiqueta dinamica, nota viva de stock resultante, nota
de reemplazo de costo condicionada a costo previo mayor que 0, y el costo del
AJUSTE en el historial.

Fase 6 - gates: npm test, y npm run build > /tmp/build.log 2>&1 con EXIT CODE
explicito (nunca por tuberia con grep, Decision 056). NG8103 en 0.

Fase 7 - device test Android POR ARTEFACTO. Orden obligatorio:
npm run build -> npx cap sync android -> npx cap run android. Verificar por
grep de una cadena NUEVA dentro de android/app/src/main/assets/public/*.js
ANTES de tocar el emulador (Decision 057: el bundle viejo invalido dos
intentos).

Fase 8 - Decision 059, sync de PROJECT_CONTEXT y backlog, merge --no-ff, push.

## Riesgos

- Ninguno de schema. costo_unitario ya existe NOT NULL.
- El AJUSTE ya escribe costo_unitario 0 hoy; pasar un valor real no rompe la
  columna.
- La UI nueva NO crea componente standalone, asi que NG8103 no aplica por
  construccion. Igual se verifica.
- Cuidado con ion-note slot="helper": NO renderiza sobre la sintaxis vieja de
  ion-item mas ion-label position stacked (Decision 057). Las notas van como
  parrafo dentro del ion-item o debajo, con clase propia.
