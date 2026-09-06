# Plan - Feature 031 Respaldo completo y restaurable

## Estrategia
Dos partes independientes, ambas ancladas en funciones puras ya
existentes y testeadas. SIN cambio de schema: SCHEMA_VERSION sigue en 8.
Orden: primero A (validador, cambio contenido en un archivo), luego B
(config, que toca modelo, builder, validador y las dos puntas de
Configuraciones).

## Parte A - Compatibilidad de versiones

respaldo-validator.ts:
- Constante nueva SCHEMA_VERSION_MINIMA_SOPORTADA = 7.
- Reemplazar la comparacion exacta por un rango: version < MINIMA o
  version > SCHEMA_VERSION rechaza VERSION_INCOMPATIBLE.
- El bucle sobre TABLAS deja de exigir presencia: si la tabla falta se
  rellena con []. Si esta presente y no es arreglo, sigue TABLA_INVALIDA.
- El motivo TABLA_FALTANTE deja de emitirse pero NO se borra del union
  type: quitarlo obligaria a tocar el manejo de errores de
  Configuraciones sin necesidad.

## Parte B - Config de negocio

1. Modelo: RespaldoConfig { catalogo_fiado: CatalogoItem[];
   nombre_negocio: string | null }. Respaldo gana config?: RespaldoConfig
   (OPCIONAL, para que un v7 siga siendo valido).
2. construirRespaldo recibe un tercer parametro config opcional y lo
   embebe. Si no se le pasa, no emite la clave.
3. validarRespaldo devuelve config cuando existe y es objeto; si falta o
   es invalida, devuelve undefined sin rechazar el respaldo.
4. Configuraciones al EXPORTAR: arma config con getCatalogoFiado() y
   getNombreNegocio().
5. Configuraciones al IMPORTAR: si config trae catalogo con al menos un
   item, setCatalogoFiado(). Si trae nombre no vacio, setNombreNegocio().
   Vacio o ausente NO borra lo existente.

## Pruebas (TDD, RED antes de GREEN)
1. validador acepta v7 sin tablas de produccion y las rellena vacias.
2. validador sigue aceptando v8 completo (regresion).
3. validador rechaza version mayor a la actual.
4. validador rechaza version menor a 7.
5. validador mantiene TABLA_INVALIDA para tabla presente no-arreglo.
6. construirRespaldo embebe config cuando se le pasa.
7. construirRespaldo NO emite config cuando no se le pasa.
8. validador devuelve config cuando existe; undefined cuando no.

## Gates
- Suite completa verde antes de cada commit.
- git diff de respaldo-validator.ts debe mostrar SOLO el rango de version
  y el relleno de tablas; ninguna otra linea.
- Verificar con grep que pin_administrador, licencia_premium,
  fecha_instalacion y trial_bloqueado NO aparecen en respaldo-builder.ts
  ni en el armado de config de configuraciones.page.ts.

## Riesgo conocido
La suite corre SOLO la rama web (Decision 052). Este cambio es logica
pura y no toca SQL, asi que la suite SI lo cubre. El unico paso de
device es el smoke: exportar en el dispositivo, revisar el JSON crudo y
reimportarlo.
