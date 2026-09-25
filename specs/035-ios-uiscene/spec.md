# Feature 035 - Adopcion del ciclo de vida UIScene en iOS

## Problema
iOS 27 / SDK actual rechaza el arranque de apps que no adoptan escenas.
Artefacto real (iPhone 17 Pro Max, 2026-09-25): pantalla negra y
"Application failed to launch: UIScene life cycle is required for apps
built with this SDK". Compila y firma bien; el fallo es de runtime.
El bump de Capacitor 8.4.0 a 8.5.2 (commit b7f2aea) NO lo resuelve:
cap sync no toca AppDelegate.swift ni Info.plist. Verificado por grep.

## Alcance
SOLO arranque nativo de iOS. CERO cambios en src/, cero schema,
cero logica de negocio. Android no se toca.

## Decision de implementacion
La clase SceneDelegate vive DENTRO de AppDelegate.swift, que ya esta
en el target. Un archivo .swift nuevo no entra solo al target de Xcode
y el sintoma de ese olvido es identico al bug actual (pantalla negra),
lo que lo vuelve caro de diagnosticar. Separarla es cosmetico.

## Criterios de aceptacion (TODOS se verifican en device, la suite es ciega al Swift)
- AC-01: la app arranca en el iPhone 17 Pro Max y muestra el Inicio,
  no una pantalla negra.
- AC-02: la consola de Xcode NO emite el runtime issue de UIScene.
- AC-03: enviar la app a segundo plano y volver conserva el estado.
- AC-04: SQLite escribe y lee en iOS: crear un cliente, matarla desde
  el multitarea, reabrir, y el cliente sigue ahi.
- AC-05: compartir un respaldo por WhatsApp funciona (plugin Share,
  unica ruta que dependia de metodos del AppDelegate).
- AC-06: Android NO se rompe: gate web en verde y APK arranca.
- AC-07: git diff sobre src/ vacio.

## No cubierto
Cuenta de desarrollador paga, TestFlight y distribucion a terceros.
El certificado gratuito de 7 dias sigue siendo el limite: sirve para
demo en el telefono de Diego, no para instalar en el de un interesado.
