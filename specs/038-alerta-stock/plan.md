# Plan - Feature 038

## Enfoque

Dos funciones puras nuevas en inventory-calculations.ts. La suite corre SOLO
la rama web: una funcion pura es lo unico que puede defender de verdad, y este
es un cambio de REGLA, no de persistencia.

  export type EstadoStock = 'AGOTADO' | 'POR_AGOTARSE' | 'SIN_MINIMO' | 'OK';

  resolverEstadoStock(stockDerivado: number, minimoStock: number): EstadoStock
  sugerirMinimoStock(cantidadInicial: number): number

esStockBajo NO se toca (AC-10). Sus tests y consumidores quedan intactos; el
estado nuevo se construye encima, no en su lugar.

## Orden de trabajo

Fase 1 - andamiaje: ambas firmas devolviendo un valor fijo ('OK' y 0) para
que el RED falle por ASERCION y no por "Cannot find name".

Fase 2 - RED de las dos funciones. Verificar la salida REAL: debe decir
"Expected X to be Y". Verificar ANTES con grep -n "^describe(" donde entra el
describe nuevo; hoy son cinco y el nuevo va al FINAL como sexto.
ANTICIPAR por escrito que casos nacen verdes contra el andamiaje: 'OK' con
stock 12 y minimo 3 (AC-06) y la sugerencia de 0 (AC-07 parcial). Un verde no
anticipado es indistinguible de un falso verde (Decision 059).

Fase 3 - GREEN de las dos funciones puras.

Fase 4 - lista: getter estadoStock(productoId) que delega en la funcion pura,
y la pildora por estado en el HTML. La de SIN_MINIMO es tocable.

Fase 5 - alta: prellenar minimo_stock al escribir cantidad_inicial, SOLO si
el campo esta vacio (nunca pisar lo que el comerciante escribio). Etiqueta
nueva "Avisame cuando queden ___". Mismo cambio en duplicar, con la regla D-5.

Fase 6 - gates: npm test, y npm run build > /tmp/build.log 2>&1 con EXIT CODE
explicito. NG8103 en 0.

Fase 7 - device test POR ARTEFACTO. Orden obligatorio:
npm run build -> npx cap sync android -> npx cap run android, verificando por
grep de una cadena NUEVA dentro de android/app/src/main/assets/public/*.js
ANTES de tocar el emulador.
OJO: JAVA_HOME debe apuntar al JDK 21 de Android Studio, no al 17 de Homebrew.

Fase 8 - Decision 060, sync de PROJECT_CONTEXT y backlog, merge --no-ff, push.

## Riesgos

- Ninguno de schema. minimo_stock ya existe.
- El cambio de etiqueta y de pildora NO crea componente standalone, asi que
  NG8103 no aplica por construccion. Igual se verifica.
- Las notas y pildoras van como elemento con clase propia. NO usar ion-note
  slot="helper": no renderiza sobre la sintaxis vieja de ion-item mas
  ion-label position stacked (Decision 057).
- Presupuesto de CSS al limite en este proyecto: un archivo rompio el build
  por CINCO BYTES con la suite en verde (Decision 056). Verificar EXIT CODE.
- Los bloques python3 largos SE TRUNCAN al pegar (Decision 059): ediciones
  cortas, una por vez, verificando el OK: de cada una.
