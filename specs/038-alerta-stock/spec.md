# Feature 038 - Avisar ANTES de que se agote, y decirlo claro

## Problema

La alerta de stock bajo existe, se calcula en cada carga y NO SIRVE. Dos
defectos, no uno.

(A) No avisa: informa un hecho consumado. esStockBajo es stock <= minimo. Con
minimo 0 solo es cierto cuando el stock YA llego a cero. No dice "se te esta
acabando", dice "ya se acabo".

(B) El texto miente. Un producto con CERO unidades no tiene "stock bajo":
esta AGOTADO. Son dos estados con urgencia distinta y hoy se ven identicos.

Y es el caso POR DEFECTO desde la Feature 036, que hizo el minimo opcional:
todo producto nuevo nace con minimo 0. Sin querer dejamos la alerta inservible
para todos los productos nuevos.

## Evidencia

Respaldo de device 2026-09-27: NUEVE productos, CERO con minimo mayor que 0.
Ninguno puede recibir un aviso anticipado.

Captura de device 2026-09-27: la pildora renderiza correctamente (roja, con
borde). El hallazgo abierto que venia de la Feature 036 queda CERRADO: la
alerta funciona. Lo que falla es CUANDO se enciende y QUE dice.

Dos hipotesis propias descartadas por evidencia antes de disenar: que los
estilos de ion-label le ganaban a la clase del badge (falso), y que el producto
"Prueba de cantidad" estaba en stock 0 (falso, tiene 20 - por eso no muestra
aviso, correctamente).

Evidencia de campo 2026-09-17: la merchant de ropa puso su existencia FISICA
en el campo "stock minimo", nunca registro la COMPRA, y quedo en alerta
permanente hasta que dejo de usar la app. Nadie sabe que numero va en un campo
llamado "stock minimo".

Decision de producto de Diego 2026-09-27: "que se les avise cuando ya se les
esta agotando, pero la app debe ser clara para que el merchant lo sepa".

## Decision central

Tres estados donde hoy hay uno, resueltos por una funcion pura NUEVA. El orden
de evaluacion es parte de la decision:

1. stock <= 0                      -> AGOTADO       (rojo)
2. minimo > 0 && stock <= minimo   -> POR_AGOTARSE  (ambar)
3. minimo <= 0                     -> SIN_MINIMO    (neutro, tocable)
4. resto                           -> OK, sin aviso

AGOTADO se evalua PRIMERO: un producto en 0 sin minimo debe decir "Agotado",
no "configura un aviso". Lo urgente es que ya no puede vender.

esStockBajo NO se toca: conserva sus tests y sus consumidores. El estado es
una funcion nueva encima.

## El minimo se SUGIERE, nunca se exige

Un campo obligatorio fue lo que expulso a la merchant; uno vacio deja la
alerta muerta. Salida: al escribir la cantidad inicial, el minimo se PRELLENA
con una sugerencia editable y borrable.

Regla (D-2): 25% de la cantidad inicial, redondeado hacia abajo, minimo 1.
20 -> 5, 10 -> 2, 4 -> 1, 0 -> 0. Escala con el negocio: la panaderia mueve
cientos, la tienda de ropa unidades. Es una HEURISTICA documentada como tal,
no una verdad.

La etiqueta cambia de "Stock minimo (opcional)" a "Avisame cuando queden ___".
No es cosmetica: explica que HACE el numero en vez de como se llama el campo,
y el desconocimiento de ese numero fue el origen del abandono.

## Decisiones de UI acordadas sobre prototipo (Decision 054)

- D-1: textos "Agotado" / "Quedan N - repon pronto" / "Avisame cuando queden
  pocos". Se retira "Stock bajo" del vocabulario: es la etiqueta que confunde.
- D-2: sugerencia del 25% redondeado hacia abajo, minimo 1.
- D-3: el aviso NO se lleva al Inicio en esta feature. El Home acaba de
  redisenarse (Decisions 054 y 056) y meterle un bloque reabre ese trabajo.
- D-4: la lista NO se reordena por estado. El comerciante tiene la pantalla
  memorizada (principio de la Decision 054: no mover nada de sitio).
- D-5: al DUPLICAR se copia el minimo del original si lo tiene; se sugiere
  solo si viene en 0. Quien duplica una talla ya penso el numero una vez.

## Criterios de aceptacion

- AC-01: stock 0 y minimo 0 -> AGOTADO (no SIN_MINIMO, no POR_AGOTARSE).
- AC-02: stock 0 y minimo 5 -> AGOTADO (el orden gana sobre la condicion 2).
- AC-03: stock 2 y minimo 3 -> POR_AGOTARSE.
- AC-04: stock 3 y minimo 3 -> POR_AGOTARSE (el limite INCLUYE, igual que
  esStockBajo hoy).
- AC-05: stock 12 y minimo 0 -> SIN_MINIMO.
- AC-06: stock 12 y minimo 3 -> OK, sin aviso.
- AC-07: la sugerencia da 5 para 20, 2 para 10, 1 para 4, 1 para 1, 0 para 0.
- AC-08: el alta prellena el minimo al escribir la cantidad y el comerciante
  puede borrarlo o cambiarlo; nunca bloquea el guardado.
- AC-09: la lista muestra la pildora correcta por estado con su color, y la
  de SIN_MINIMO es tocable y lleva a definir el minimo.
- AC-10: REGRESION - esStockBajo conserva su comportamiento y sus tests sin
  una sola modificacion.
- AC-11: SIN cambio de schema. minimo_stock ya existe en productos.
- AC-12: device test verificado POR ARTEFACTO (respaldo JSON) con los cuatro
  estados presentes en la base.

## Fuera de alcance

Aviso en el Inicio (D-3). Notificaciones push: romperia offline-first y
ninguna evidencia lo pide. Reorden de la lista (D-4). Las nueve pantallas con
ionViewWillEnter sin manejo de error (Decision 056). El ?? false de
inventory-list.page.ts:63, que es deuda real pero NO causa este defecto:
verificado hoy.
