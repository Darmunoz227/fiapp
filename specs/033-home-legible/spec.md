# Feature 033 - Inicio legible (rediseno visual del Home)

## Contexto
FiApp nacio simple y evoluciono a un MiniPOS con 31 features, pero el
Inicio conserva la apariencia de las primeras versiones. Revisando una
captura del dispositivo se identificaron defectos concretos de
legibilidad, no de gusto.

**El mas grave es de accesibilidad, no de estetica:** los cuatro iconos
del header son AZULES sobre fondo AZUL MARINO, demasiado cerca en
luminosidad, y sin etiqueta. Para la pareja mayor del piloto eso no es un
detalle: es no distinguir donde tocar. Mismo criterio que llevo a la
Decision 044 a prohibir el swipe como interaccion primaria.

## Alcance
SOLO legibilidad y disciplina visual del Inicio. CERO cambios de flujo,
CERO funciones nuevas, CERO reordenamiento.

## Principio rector
**Ningun elemento cambia de sitio.** El merchant ya tiene la pantalla
memorizada; reordenarla seria peor que dejarla fea.

## Los 5 defectos a corregir

1. **Iconos casi invisibles.** Azul sobre azul marino, 22px, sin
   etiqueta. -> Blancos, ~24px, con una palabra debajo (Reportes,
   Vender, Inventario, Ajustes) y toque de al menos 48px.

2. **Marca de agua que estorba.** Un "FIAPP" gigante en SVG detras del
   buscador (watermark-container). -> Se elimina.

3. **Seis colores compitiendo.** Azul marino, azul, rojo, amarillo,
   verde y negro simultaneos. -> Un azul de acento + neutros. Rojo SOLO
   deuda, verde SOLO saldado. Todo por variables de Ionic (Decision 029),
   nunca una custom property sin fallback (Decision 030).

4. **El FAB se CONSERVA (corregido por evidencia E2).** La propuesta
   inicial lo quitaba por "dos acciones primarias compiten"; el merchant
   lo usa. Solo se ajusta su color para que no compita en intensidad con
   la accion principal.

5. **Filas de cliente sin jerarquia.** Lineas delgadas, inicial suelta,
   montos en amarillo. -> Tarjetas de al menos 64px con avatar, nombre,
   linea de estado ("Debe" / "Al dia") y monto con color semantico.

## Decision - la marca del merchant por encima de la nuestra
Hoy "FiApp / Mi Negocio en el Bolsillo" domina y el nombre del negocio
queda debajo. Se invierte. Es su herramienta de trabajo, no nuestro
afiche.

## Decision - los emoji de reconocimiento SE MANTIENEN
El emoji de la bolsa en "TOTAL QUE ME DEBEN" se conserva. Quitarlo era un
criterio estetico, no de usuario. Funciona como ancla de RECONOCIMIENTO:
la pareja mayor lo identifica sin leer. Ademas la app YA usa emoji en el
catalogo de fiado (Feature #22) y quitarlos aqui seria incoherente.
Regla: emoji para ETIQUETAR, SVG para lo que se TOCA.

## Decision - se CONSERVAN todas las clases CSS existentes
No se renombra ninguna (boton-fiado-productos,
boton-registrar-produccion, cliente-item, tarjeta-total, deuda-texto,
lista-clientes). El test de regresion de AC-06 de la Feature 030 consulta
querySelector('.boton-registrar-produccion') y es la unica garantia
escrita de que un comerciante sin modo produccion no ve UI nueva.

## Evidencia de campo (2026-09-07, merchant de ropa deportiva, WhatsApp)

**E1 - Los iconos: defecto confirmado, pero NO doloroso.** Textual: "le
da casi igual, pero piensa que debe tener mejor contraste". El arreglo se
mantiene, pero baja de critico a mejora. HONESTIDAD SOBRE LA EVIDENCIA:
la justificacion de accesibilidad para la pareja mayor del ambulante
sigue siendo una HIPOTESIS del supervisor; no se le ha preguntado a ella.

**E2 - El FAB SI se usa. Se revierte la propuesta de quitarlo.** Textual:
"si lo usa". El argumento de "dos acciones primarias compiten" es un
principio de diseno abstracto que no le esta causando ningun problema
real al usuario. El FAB se conserva.

**E3 - HALLAZGO: la accion principal del Inicio no es la misma para todos
los merchants.** Textual: "el fiado lo usa muy poco pero tiene dos
clientes con deuda; le sirve mucho el mensaje por WhatsApp (muy util e
innovador)". El boton rojo grande de fiado ocupa el lugar de accion
principal y este merchant casi no lo usa; lo que si valora es el
comprobante por WhatsApp (Decision 051). Pero el ambulante vive del fiado
(mas del 50% de sus ventas), asi que la jerarquia correcta DEPENDE del
tipo de merchant y hoy esta fija para todos. Es n=1: NO se resuelve en
esta feature. Queda anotado como pregunta de producto para el backlog.

## Fuera de alcance
- Navegacion por tabs o cualquier cambio de arquitectura.
- Rediseno de otras pantallas: esta feature es SOLO el Inicio.
- Sistema de diseno formal con tokens: feature posterior. Aqui se
  pilotea el criterio visual con usuarios reales antes de generalizarlo.
- Modo oscuro: se verifica que no empeore, no se redisena.

## Criterios de aceptacion
- AC-01: los 4 iconos son blancos, con etiqueta, toque >= 48px.
- AC-02: watermark-container ya no existe en el template.
- AC-03: el nombre del negocio es mas prominente que la marca FiApp.
- AC-04: el FAB de nuevo cliente SIGUE existiendo y funcionando
  (corregido por E2); solo cambia su color para no competir con la
  accion principal.
- AC-05: rojo y verde se usan EXCLUSIVAMENTE para deuda y saldado.
- AC-06: REGRESION - el boton de produccion sigue condicionado y su test
  sigue verde SIN modificarse.
- AC-07: REGRESION - buscar, entrar al detalle, editar y eliminar por
  swipe, registrar fiado y crear cliente siguen funcionando.
- AC-08: los colores resuelven por variables de Ionic.
- AC-09: verificado en Android Y en modo oscuro.
