# Spike - SEGMENTO: a que dolor DIARIO le servimos

## Estado: ANALISIS (sin codigo). Fuente de verdad para decidir
## alcance comercial. NO es una decision todavia.

## Por que existe esta nota
Al cerrar lo academico y apuntar a rentabilidad (contexto 2026-09-22),
aparecio la pregunta de si FiApp debe volver a ser solo fiados o seguir
como MiniPOS. Se consulto una IA externa que recomendo "matar inventario
y gastos, volver a v1 fiados". Esta nota documenta por que esa tesis se
DESCARTA con evidencia propia, y que dice realmente la evidencia.

## Roster de pilotos (nombres reales; la doc vieja usa descriptores)
Hasta hoy la documentacion hablaba de "3 merchants" anonimos. Son CINCO
y tienen nombre. Esta tabla es el mapeo que faltaba:

- CARLOS + esposa = "el ambulante". Comida frente a un call center,
  pareja mayor, ~10 productos. 5-6 de cada 10 ventas son fiadas.
  Su hija precargo el catalogo y lo persuadio de usar la app.
  La hija es ademas la prospecta PRODUCTORA del spike-produccion.
- MIGUEL = "merchant de ropa deportiva". Buzos con variantes
  talla/color. Es quien origino la Feature 025 (Duplicar).
- YUDITH = "tienda de ropa" (no deportiva). Su empleada SANDRA hace
  relevos con ella. Su esposo es el socio que NUNCA atiende y que
  origina las DOS CAJAS del spike-ciclo-caja (C4). Es tambien la
  merchant del spike-proveedores (4 a 10 proveedores a credito).
- LADY = panaderia + tienda de abarrotes. Productora (200 panes/dia)
  y convenience store con cientos de productos. Visitada 2026-09-18.
- DANIEL = carniceria. NO estaba documentado en ningun archivo del
  repo antes de esta nota. Su esposa le lleva las cuentas en Excel.

CORRECCION: la frase "ES EL UNICO CON USO JUICIOSO" sobre Miguel ya
no es cierta para inventario. Ver Hallazgo 4.

## Hallazgo 1 - Carlos NO adopto la v1 de fiados. La RECHAZO.
La tesis externa dice "tu ambulante la usa porque no le pides nada
extra, vuelve a v1". Es FALSO y el propio registro de campo lo
desmiente. Cita textual del seguimiento de pilotos:

  "Primera version se le entraga pero no la utilizan, ya que era
   obligarlos a cambiar su metodologia de trabajo"

Carlos adopto DESPUES de dos cosas que costaron trabajo:
1. La Feature 022 completa (fiado por productos por toque), disenada
   especificamente para reemplazar su cuaderno POST-PICO, no para
   competir con el cuaderno durante el pico.
2. Acompanamiento humano: su hija cargo el catalogo, aprendio la app
   y lo persuadio; y hubo una tercera visita presencial donde se le
   dejo practicar el registro el mismo.

CONCLUSION: volver a "v1 solo fiados" NO devuelve a Carlos. Devuelve
exactamente la version que Carlos rechazo. Su exito no prueba que
menos producto retiene: prueba que ACOMPANAMIENTO + una feature
ajustada a su flujo real retiene.

## Hallazgo 2 - el fiado NO es universal. Lady lo rechazo de frente.
Cita textual de la visita del 2026-09-18:

  "me dijo que no le sirve porque el fiado que le permite a sus
   clientes son grandes a diferencia de el senor ambulante que solo
   tiene 10 productos"

Lady no anota el producto fiado, solo nombre y valor por columna, y
manda una FOTO del cuaderno por WhatsApp al cliente. El fiado por
producto (Decision 044) esta disenado para un catalogo de 10-15
productos: es correcto para Carlos y estructuralmente inaplicable
para ella. No es un defecto de ejecucion, es desajuste de segmento.

## Hallazgo 3 - lo que decide el pago NO es el porcentaje: es la
## FRECUENCIA del dolor.
Dato de campo, los dos extremos medidos:
- Carlos fia 5-6 veces AL DIA  -> ~150 eventos/mes.
- Lady fia "por mucho unas 10 por mes".

Una suscripcion mensual se sostiene sobre un dolor DIARIO. Nadie paga
una mensualidad por algo que toca 10 veces al mes. Por eso la
pregunta correcta no es "fiado si o no", sino: A QUE DOLOR DIARIO le
servimos en cada negocio.

- Para Carlos el dolor diario ES el fiado.
- Para Yudith, Miguel y Lady el dolor diario es VENDER e INVENTARIAR.
  El fiado les es marginal.

## Hallazgo 4 - son DOS productos sobre UN motor, no un producto con
## un modulo de mas.
La evidencia no separa a los pilotos en "usa / no usa". Los separa en
dos flujos diarios distintos:

  PERFIL A (Carlos): pocos productos, fiado diario. YA FUNCIONA.
  PERFIL B (Yudith, Miguel, Lady): catalogo mediano o grande, venta
  diaria, fiado marginal. BLOQUEADO EN LA ENTRADA.

Y el bloqueo del perfil B NO es "el inventario" como concepto. Son
dos fricciones concretas, nombradas y arreglables:

1. Crear producto no es declarar stock. Yudith puso en STOCK MINIMO
   lo que tenia fisicamente, el stock derivado quedo en 0 y la alerta
   roja se quedo encendida para siempre. Es hueco de ONBOARDING, no
   bug: el stock derivado del log es correcto (Decision 002/009).
2. Vender contra una lista PLANA. Miguel lo dijo con ~15 productos y
   Yudith pidio un buscador dentro del modal de venta "como el que ya
   existe en clientes". Dos merchants, sin hablarse, mismo punto.

Miguel es la prueba dura: con Duplicar (Feature 025) YA en sus manos
dijo que "igual es muy manual porque va seguir creando articulo por
articulo". La Fase 2 de variantes deja de ser hipotesis.

## Contra-tesis evaluada y DESCARTADA: "volver a fiado-only"
Se descarta por cuatro razones, todas con evidencia propia:

1. Carlos rechazo esa version (Hallazgo 1).
2. Lady rechazo el fiado (Hallazgo 2): volver a fiado-only la pierde,
   y es la merchant mas grande del piloto.
3. A 10 fiados/mes no hay disposicion a pagar (Hallazgo 3).
4. Miguel SI usa el fiado y le gusta: "priemra version de fiados la
   utiliza y le gusta. Contesta el whasapp para darme mejoras de la
   app". Su abandono fue en INVENTARIO, no en fiado. La tesis externa
   lo clasifico mal.

La segmentacion externa ("1 que fia mucho te ama, 4 que fian poco te
abandonaron") no sobrevive al detalle: Miguel usa fiado, Lady rechaza
fiado, Yudith se fue por una confusion puntual de UI, y la esposa de
Daniel -la que lleva las cuentas- acaba de interesarse. Daniel esta
MAS vivo hoy que hace un mes.

## Lo que la tesis externa SI acerto
- RETENCION es el problema, no las features. Coincide con el contexto
  de negocio ya commiteado: 4 pilotos, 1 activo, "ninguna feature
  arregla eso", y el unico que la usa es el unico con SEGUIMIENTO.
- "Esconder, no borrar" el modulo pesado. Correcto, y ademas el
  patron YA existe en el proyecto: modo_produccion es opt-in por
  producto y el boton del Home solo aparece si hay al menos uno
  (Decision 052, AC-06). No hace falta inventar feature flags.
- Preguntar disposicion a pagar. Correcto el instinto; ver Preguntas
  abiertas para la formulacion que si sirve.

## Competencia: hipotesis NO verificada, en ambas direcciones
La tesis externa afirma que el tendero con 500 productos "ya tiene
POS". La evidencia de Lady dice lo contrario: conoce el sistema POS
(lo menciono), pero NO usa ninguno; usa dos cuadernos. Conocimiento
sin adopcion. Pero "no hay competencia en el barrio" tambien es una
hipotesis propia sin verificar. PENDIENTE: revisar que ofrecen
realmente Treinta/Alegra/Siigo en barrio, con datos.

## Voz y foto con IA: NO para el flujo diario. Razon, no gusto.
Propuesta externa: reemplazar formularios por audio ("le fie 20 mil a
dona Marta") y foto al estante/cuaderno, con IA llenando los campos.
Se descarta para el flujo diario por tres razones:

1. ROMPE LA VENTAJA COMPETITIVA RECIEN DECLARADA. El contexto de
   negocio 2026-09-22 dice: offline-first pasa a ser ventaja
   competitiva porque "los merchants trabajan con senal intermitente;
   los POS que compiten exigen conexion". Voz y foto EXIGEN conexion.
   Carlos vende en hora pico frente a un call center: justo cuando
   mas gente hay y peor anda la red.
2. EL ERROR SILENCIOSO ES PEOR QUE EL PROBLEMA. Si el modelo oye
   "veinte mil" y escribe veintidos mil, y la pareja mayor no lo
   revisa, la app escribe un DATO FINANCIERO FALSO con dinero real de
   por medio. Es el mismo defecto que la Feature 034 esta corrigiendo
   (un error mostrado como hecho), pero generado por nosotros y sin
   rastro de que ocurrio.
3. COSTO VARIABLE SOBRE PRECIO FIJO. Cada transcripcion y cada foto
   cuesta. El merchant que mas usa la app es el que mas cuesta.

DONDE SI TENDRIA SENTIDO (anotado, no aprobado): la carga INICIAL
masiva de inventario. Es una sola vez, con wifi, con Diego presente
para corregir, y fuera del flujo critico de una venta. Es el caso que
Lady pidio (escanear facturas de compra).
PERO: Daniel, Miguel y Yudith YA tienen su inventario en Excel. Un
importador CSV les resuelve lo mismo con cero costo por uso, cero
dependencia de red y cero riesgo de alucinacion. El importador va
primero; la foto solo si queda un caso que el CSV no cubra.

## Bot de WhatsApp Business API: NO por ahora
Requiere verificacion de Meta, un servidor y costo por conversacion.
Rompe offline-first y mete costo recurrente por merchant.
Lo que YA existe es mejor de lo que parece: wa.me directo (Decision
051), gratis, sin servidor. Y es lo que Miguel mas valora: "el fiado
lo usa muy poco, pero le sirve mucho el mensaje por WhatsApp (muy
util e innovador)" (Decision 054).
La idea de fondo SI es buena y es barata: el respaldo ya se escribe a
disco y se comparte por share sheet (Decision 035). Falta ensenarles
a mandarselo a si mismos por WhatsApp. 80% del valor, 0% de costo.

## Riesgos de producto ANOTADOS - no implementar sin decision expresa
Dos ideas de la propuesta externa que se rechazan por riesgo, no por
costo:

- "Que la app decida a quien NO fiarle mas". Con datos de un solo
  negocio, en una economia donde la RELACION PERSONAL es la garantia.
  El merchant sabe que dona Marta paga; la app no. La primera vez que
  se equivoque, se pierde su confianza entera.
- "Cobros automaticos por WhatsApp mientras duerme". El riesgo
  reputacional no es nuestro, es DEL MERCHANT, con sus vecinos. El
  envio debe seguir siendo iniciado por el merchant, siempre. La
  Decision 051 ya lo dejo asi (atajo directo, no automatico).

## Preguntas abiertas - validar en las proximas visitas
1. Disposicion a pagar, formulada SIN preguntar un precio hipotetico
   (la gente dice que si y no paga). Preguntar en cambio:
   "Que usas hoy para esto y cuanto te cuesta?" Y cuando llegue el
   momento, pedir compromiso real (un mes por adelantado), no opinion.
2. Existe un segmento que VIVE del fiado a cuotas (no el tendero que
   fia de vez en cuando)? Carlos es n=1 de ese perfil. Sin
   investigar.
3. Yudith y Sandra: comparten telefono o cada una el suyo? Hoy usan
   su propio celular y no hay sincronizacion. Yudith no comprara un
   celular dedicado hasta validar la app. Protocolo manual a probar
   ANTES de construir merge: exportar al cerrar turno, importar al
   abrir, con la regla estricta de que solo UNO escribe por turno
   (el import actual es OVERWRITE, no merge: sin esa regla se pierden
   datos y se pierde la merchant).
4. Competencia real en barrio (ver seccion Competencia).

## Conclusion operativa (propuesta, no decidida)
1. NO volver a fiado-only. NO seguir apilando modulos.
2. Aceptar que hay DOS perfiles con un mismo motor, y que difieren en
   onboarding y en pitch, no en codigo.
3. La palanca #1 NO es una feature: es el seguimiento semanal. Esta
   medido: el unico que usa la app es el unico con seguimiento. Seis
   horas a la semana alcanzan para los cinco pilotos.
4. Las features del perfil B (crear producto = declarar stock;
   categoria + buscador en venta; importador CSV) existen para que,
   cuando SI haya seguimiento, la app no los expulse como expulso a
   Yudith con la alerta roja.

## Proximo paso
Decidir con Diego el orden de la cola tecnica. Esta nota NO autoriza
codigo por si sola.
