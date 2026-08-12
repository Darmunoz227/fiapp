# FiApp - Entrega para piloto Android e iPhone

## Objetivo

Preparar la entrega de FiApp para un piloto controlado en:

- Android: APK instalable
- iPhone: instalacion desde Xcode

---

## 1. Estado previo obligatorio

Antes de preparar cualquier entrega:

    git checkout main
    git status --short
    git log --oneline -1
    npm test -- --watch=false --browsers=ChromeHeadless 2>&1 | tail -4

Esperado:

    working tree clean
    TOTAL: 162 SUCCESS
    Commit main con Feature #20 mergeada

---

## 2. Android - APK para piloto

Android si usa APK.

### Build

    export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
    export ANDROID_HOME=$HOME/Library/Android/sdk
    export PATH=$PATH:$ANDROID_HOME/platform-tools

    npm run build && npx cap sync android
    cd android && ./gradlew assembleDebug; cd ..

Esperado:

    BUILD SUCCESSFUL

### Ubicacion del APK

    android/app/build/outputs/apk/debug/app-debug.apk

### Crear copia de entrega

    mkdir -p dist/pilot
    COMMIT=$(git rev-parse --short HEAD)
    cp android/app/build/outputs/apk/debug/app-debug.apk "dist/pilot/FiApp-piloto-${COMMIT}.apk"
    shasum -a 256 "dist/pilot/FiApp-piloto-${COMMIT}.apk" > "dist/pilot/FiApp-piloto-${COMMIT}.sha256.txt"

### Verificar

    ls -lh dist/pilot/
    cat dist/pilot/*.sha256.txt

### Instalar localmente en Android

    adb install -r "dist/pilot/FiApp-piloto-${COMMIT}.apk"
    adb shell am force-stop com.diegomunoz.fiapp
    adb shell am start -n com.diegomunoz.fiapp/io.ionic.starter.MainActivity

Esperado:

    Performing Streamed Install
    Success
    App opens

---

## 3. iPhone - Instalacion para piloto interno

iPhone NO usa APK.

Para iPhone se instala desde Xcode.

### Build y sincronizacion

    npm run build && npx cap sync ios
    npx cap open ios

### En Xcode

1. Conectar el iPhone por cable.
2. Seleccionar el iPhone como destino.
3. Revisar Signing & Capabilities.
4. Seleccionar Team / Apple ID.
5. Presionar Run.

### Si iOS bloquea la app

Ir a:

    Ajustes -> General -> VPN y gestion de dispositivos

Luego confiar en el perfil del desarrollador.

### Validacion minima en iPhone

- La app instala.
- La app abre.
- Home carga.
- Se puede crear cliente.
- Se puede crear producto.
- Se puede registrar movimiento de inventario.
- Se puede registrar venta.
- Reporte se comparte por hoja nativa de iOS.
- Respaldo se puede compartir.
- Reiniciar inventario pide REINICIAR.
- Reiniciar inventario funciona en base de prueba.

---

## 4. Nota de entrega

El APK debug es solo para piloto controlado.

No es una publicacion de Play Store.

Para iPhone, la instalacion directa desde Xcode es adecuada para el dispositivo del desarrollador o pruebas internas controladas.
