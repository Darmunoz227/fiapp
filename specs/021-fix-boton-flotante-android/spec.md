# Feature #21 - Fix boton flotante (+) tapado por barra de navegacion Android

## Contexto
Durante el piloto del 2026-08-13, los 3 merchants Android reportaron que el boton
flotante + (agregar cliente) en Home queda parcialmente tapado o "mordido" por
la barra de navegacion inferior del sistema (gestos o 3 botones, segun el
dispositivo/OEM). En iPhone no ocurre porque iOS no superpone una barra de
sistema sobre el WebView de la misma manera.

## Causa raiz (evidencia de codigo)
Archivo: src/app/home/home.page.html
Elemento afectado: ion-fab vertical="bottom" horizontal="end" slot="fixed"
con ion-fab-button color="dark" (click)="abrirModalNuevoCliente()"

Archivo: src/app/home/home.page.scss no aplica ningun env(safe-area-inset-bottom)
al FAB. El toolbar superior si lo hace (padding con env(safe-area-inset-top)),
pero el FAB inferior no tiene equivalente. ion-fab vertical bottom usa un
valor fijo que no compensa la barra de navegacion del sistema Android.

## Alcance
- Unico archivo de negocio afectado: src/app/home/home.page.scss (presentacion).
- Sin cambios en home.page.ts, sin cambios de logica en home.page.html.
- Sin schema, sin DatabaseService, sin logica de negocio.

## Solucion propuesta
Agregar padding-bottom: env(safe-area-inset-bottom) o margen equivalente
al contenedor del ion-fab para que el boton respete el area segura inferior
en Android, sin afectar su posicion en iPhone.

## Fuera de alcance
- No se modifica el comportamiento del boton (abrirModalNuevoCliente).
- No se modifican otros FABs de la app si existieran en otras pantallas.

## Gate de pruebas (sin logica de negocio, sin test automatizado nuevo)
- RED/GREEN no aplica: es un fix puramente CSS de presentacion.
- Gate = TOTAL: 158 SUCCESS (suite completa sin regresiones) mas
  verificacion manual en dispositivo.

## Evidencia requerida antes de merge
- Verificado BY HAND en Android Pixel_8, en ambos modos de navegacion del
  sistema si el emulador lo permite (gestos y barra de 3 botones).
- Regresion rapida en iPhone/simulador para confirmar que el FAB no se
  desplaza de forma indebida.

## Precedente
Mismo tipo de defecto que Decision 030 (Feature #10): bug de presentacion
resuelto sin tocar logica, con verificacion por dispositivo como gate.
