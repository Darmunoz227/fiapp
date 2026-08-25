# Plan - Feature #21

## Archivos a modificar
1. src/app/home/home.page.scss (unico cambio funcional)
2. Opcional: src/app/home/home.page.html si se requiere una clase
   contenedora nueva para el ion-fab (a confirmar durante implementacion)

## Cambio tecnico
Agregar una regla CSS al selector del FAB o a un wrapper para que el
boton respete env(safe-area-inset-bottom):

ion-fab[vertical="bottom"] {
  bottom: calc(20px + env(safe-area-inset-bottom));
}

Nota: 20px es el valor por defecto aproximado que usa Ionic para el FAB;
se debe verificar el valor real inspeccionando el DOM renderizado antes
de fijarlo, para no duplicar espaciado en dispositivos sin barra de
sistema (donde env(safe-area-inset-bottom) es 0).

## Fuera de alcance para este plan
- No se crean nuevas variables SCSS globales salvo que se detecte
  reutilizacion en mas de una pantalla durante la implementacion.
- No se toca ningun otro ion-fab del proyecto en este feature.

## Pasos de ejecucion
T001 - Confirmar visualmente en Android Pixel_8 el problema actual
       (capturar posicion del boton antes del fix).
T002 - Aplicar el cambio CSS propuesto en home.page.scss.
T003 - Correr suite completa de tests (gate: TOTAL 158 SUCCESS, sin
       regresiones).
T004 - Verificar BY HAND en Android Pixel_8 (gestos y/o 3 botones).
T005 - Verificar BY HAND en iPhone/simulador (regresion, no debe
       moverse el boton de forma indebida).
T006 - Redactar Decision 042 en docs/DECISIONS.md y sincronizar
       docs/PROJECT_CONTEXT.md.
T007 - Merge --no-ff a main.

## Riesgos
- Bajo: cambio de una sola regla CSS, sin logica de negocio, sin
  schema, sin DatabaseService.
- Riesgo real es puramente visual: verificar que el boton no quede
  con demasiado espacio en dispositivos SIN barra de sistema (ej.
  algunos Android con gestos ya integrados al edge).
