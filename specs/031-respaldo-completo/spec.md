# Feature 031 - Respaldo completo y restaurable

## Contexto
La Feature #30 dejo al descubierto dos huecos en el respaldo, ambos
documentados en la Decision 052:

1. `validarRespaldo` compara `schema_version` por igualdad EXACTA. Al
   pasar de v7 a v8, TODO respaldo exportado antes quedo inservible. El
   unico merchant con uso disciplinado (tienda de ropa deportiva) tiene
   hoy un backup v7 que la app rechaza con VERSION_INCOMPATIBLE. El
   problema se repetira con CADA cambio de schema.

2. El catalogo de fiado vive en Preferences (KEY catalogo_fiado), no en
   SQLite, y el respaldo solo cubre las 8 tablas. Si el ambulante pierde
   el telefono, pierde el catalogo que usa a diario para reconstruir
   fiados tras el pico de demanda. Mismo problema que la Decision 035
   titulo "un backup que omite tablas no es un backup".

## Alcance
Parte A: aceptar respaldos de versiones anteriores.
Parte B: incluir la configuracion de negocio guardada en Preferences.

## Parte A - Compatibilidad de versiones

**Decision - piso explicito, no compatibilidad universal.** El validador
acepta `schema_version` 7 u 8. Una version mayor a la actual se rechaza
(VERSION_INCOMPATIBLE): el archivo viene de una app mas nueva y podria
traer datos que esta version no sabe interpretar.

**Razon del piso.** Se puede garantizar que una TABLA ausente se rellene
vacia, pero NO que las COLUMNAS de una version vieja calcen: un respaldo
v4 no tendria monto_contado/monto_fiado (Decision 027). Prometer
compatibilidad con versiones que no podemos probar contradice la
Decision 003. Subir el piso despues es trivial; retirar una promesa rota
no lo es.

**Decision - tabla ausente se rellena vacia, no se rechaza.** Si el
archivo es v7 y no trae `producciones` ni `produccion_items`, esas dos
entran como arreglos vacios. Una tabla PRESENTE pero que no sea arreglo
sigue siendo TABLA_INVALIDA: eso es corrupcion, no antiguedad.

## Parte B - Configuracion de negocio en el respaldo

**Decision - viaja la configuracion del NEGOCIO; nunca el estado del
dispositivo, la licencia ni la seguridad.** De las 7 claves de
PreferencesService entran SOLO dos:

- `catalogo_fiado`: el merchant lo construyo a mano, es el objetivo.
- `nombreNegocio`: aparece en los comprobantes de WhatsApp.

Quedan FUERA, con razon explicita:
- `pin_administrador`: iria en texto plano en un JSON que se comparte por
  WhatsApp. La Decision 049 ya admite que el PIN no es seguridad
  criptografica; ponerlo en un archivo compartible seria empeorarlo gratis.
- `licencia_premium`: convertiria el respaldo en una llave de activacion
  transferible.
- `fecha_instalacion` y `trial_bloqueado`: estado del dispositivo;
  restaurarlos moveria el trial de un telefono a otro.
- `ultimo_dia_recordatorio_mostrado`: efimero, sin valor.

Esta regla debe citarse cada vez que se agregue una clave nueva a
Preferences.

**Decision - la config va FUERA de `data`.** El respaldo gana una clave
hermana `config` al nivel de `data`. Razon: `data` es el espejo de las
tablas SQLite y el validador lo recorre tabla por tabla; mezclar una
clave que no es tabla romperia ese contrato.

**Decision - `config` es OPCIONAL en la validacion.** Un respaldo v7 no
la trae y debe seguir siendo valido. Si falta, se restaura como
configuracion vacia y no se toca lo que el merchant ya tenga.

**Decision - restaurar config NUNCA borra lo existente si viene vacia.**
Si el archivo trae `catalogo_fiado` vacio, no se sobreescribe el catalogo
actual. Un respaldo sin catalogo no debe destruir el que el merchant
construyo (mismo espiritu que Decision 041: preservar lo que no se pidio
borrar).

## Fuera de alcance
- Compatibilidad con respaldos anteriores a v7.
- Merge de respaldos: la importacion sigue siendo OVERWRITE (backlog).
- Incluir el PIN o la licencia por ninguna via.
- Cifrado del archivo de respaldo.

## Criterios de aceptacion
- AC-01: un respaldo con `schema_version` 7 y sin las tablas de
  produccion se acepta, y esas dos tablas llegan como arreglos vacios.
- AC-02: un respaldo con `schema_version` 8 completo se acepta igual que
  hoy (regresion).
- AC-03: `schema_version` mayor a la actual se rechaza con
  VERSION_INCOMPATIBLE.
- AC-04: `schema_version` menor a 7 se rechaza con VERSION_INCOMPATIBLE.
- AC-05: una tabla presente pero no-arreglo sigue dando TABLA_INVALIDA.
- AC-06: el respaldo exportado incluye `config` con catalogo_fiado y
  nombreNegocio, y NO incluye pin, licencia ni fechas de instalacion.
- AC-07: al importar un respaldo con catalogo, el catalogo se restaura.
- AC-08: al importar un respaldo SIN config o con catalogo vacio, el
  catalogo existente del merchant NO se borra.
- AC-09: REGRESION - la suite completa sigue verde sin modificar ningun
  test viejo salvo adaptacion de contrato (Decision 036).
