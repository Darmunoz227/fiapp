# FiApp - Smoke Pass Final Multiplataforma

## Objetivo

Validar que FiApp funciona correctamente antes del piloto en:

- Android Pixel_8
- iPhone real

Este smoke pass verifica flujos criticos del negocio, persistencia local, respaldo, reportes, inventario, ventas, fiados, freemium y reset de inventario.

No reemplaza la suite automatizada. Confirma que la app funciona en dispositivo real.

---

## 1. Estado previo obligatorio

Antes de probar cualquier dispositivo:

- Rama: main
- Working tree clean
- Feature #20 mergeada
- Tests verdes
- Commit main identificado

Comandos:

    git checkout main
    git status --short
    git log --oneline -1
    npm test -- --watch=false --browsers=ChromeHeadless 2>&1 | tail -4

Esperado:

    TOTAL: 162 SUCCESS
    working tree clean

Resultado:

    PASS / FAIL:
    Notas:

---

## 2. Instalacion en Android Pixel_8

Comandos:

    export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
    export ANDROID_HOME=$HOME/Library/Android/sdk
    export PATH=$PATH:$ANDROID_HOME/platform-tools

    npm run build && npx cap sync android
    cd android && ./gradlew assembleDebug; cd ..
    adb install -r android/app/build/outputs/apk/debug/app-debug.apk
    adb shell am force-stop com.diegomunoz.fiapp
    adb shell am start -n com.diegomunoz.fiapp/io.ionic.starter.MainActivity

Esperado:

    BUILD SUCCESSFUL
    Performing Streamed Install
    Success
    App opens

Resultado Android:

    PASS / FAIL:
    Notas:

---

## 3. Instalacion en iPhone real

Importante:

iPhone no instala APK. Para iPhone se usa Xcode.

Comandos previos:

    npm run build && npx cap sync ios
    npx cap open ios

En Xcode:

1. Conectar iPhone por cable.
2. Seleccionar el iPhone como destino.
3. Revisar Signing & Capabilities.
4. Seleccionar Team / Apple ID.
5. Presionar Run.

Si iOS bloquea la app por desarrollador no confiable:

    Ajustes -> General -> VPN y gestion de dispositivos

Luego confiar en el perfil del desarrollador.

Esperado:

- La app instala en el iPhone.
- La app abre.
- Home carga.
- No hay pantalla en blanco.
- No hay error visible de SQLite.

Resultado iPhone:

    PASS / FAIL:
    Notas:

---

## 4. Smoke funcional comun Android + iPhone

Ejecutar estos escenarios en Android Pixel_8 y en iPhone real.

---

### Smoke 01 - Abrir app

Esperado:

- Home carga.
- No hay pantalla en blanco.
- No hay errores visibles.
- Navegacion funciona.

Android:

    PASS / FAIL:
    Notas:

iPhone:

    PASS / FAIL:
    Notas:

---

### Smoke 02 - Nombre del negocio

Ruta:

    Configuraciones -> Nombre de tu negocio

Dato:

    Tienda Deportiva Piloto

Esperado:

- Guarda el nombre.
- El nombre persiste despues de cerrar y abrir la app.

Android:

    PASS / FAIL:
    Notas:

iPhone:

    PASS / FAIL:
    Notas:

---

### Smoke 03 - Crear cliente

Ruta:

    Home -> Nuevo cliente

Datos:

    Nombre: Cliente Piloto
    Telefono: 3001234567
    Habeas Data: marcado

Esperado:

- Cliente aparece en Home.
- Cliente persiste al reiniciar la app.

Android:

    PASS / FAIL:
    Notas:

iPhone:

    PASS / FAIL:
    Notas:

---

### Smoke 04 - Fiado manual

Ruta:

    Cliente -> Registrar fiado

Datos:

    Monto: 10.000
    Concepto: Huevos anotados manualmente

Esperado:

- Deuda aumenta.
- Concepto queda visible.
- Es fiado manual, no venta POS.

Android:

    PASS / FAIL:
    Notas:

iPhone:

    PASS / FAIL:
    Notas:

---

### Smoke 05 - Abono

Ruta:

    Cliente -> Registrar abono

Datos:

    Monto: 3.000
    Concepto: Abono parcial

Esperado:

- Deuda baja.
- Abono queda visible.
- Abono sigue permitido aunque el trial este vencido.

Android:

    PASS / FAIL:
    Notas:

iPhone:

    PASS / FAIL:
    Notas:

---

### Smoke 06 - Crear producto

Ruta:

    Inventario -> Nuevo producto

Datos:

    Nombre: Camiseta Piloto
    Precio de venta: 50.000
    Tipo de venta: UNIDAD
    Stock minimo: 2

Esperado:

- Producto aparece.
- Stock actual inicia en 0.
- Valor a costo muestra $0.

Android:

    PASS / FAIL:
    Notas:

iPhone:

    PASS / FAIL:
    Notas:

---

### Smoke 07 - Compra de inventario

Ruta:

    Inventario -> Producto -> Movimiento de inventario

Datos:

    Tipo: COMPRA
    Cantidad: 10
    Costo unitario: 30.000
    Motivo: Compra inicial piloto

Esperado:

- Stock queda en 10.
- Costo promedio queda en 30.000.
- Valor a costo queda en 300.000.

Android:

    PASS / FAIL:
    Notas:

iPhone:

    PASS / FAIL:
    Notas:

---

### Smoke 08 - Producto sin costo registrado

Crear producto:

    Nombre: Producto Sin Costo Piloto
    Precio de venta: 20.000
    Tipo: UNIDAD
    Stock minimo: 1

Registrar movimiento:

    Tipo: AJUSTE
    Conteo fisico: 5
    Motivo: Conteo inicial sin compra

Esperado:

- Stock actual queda en 5.
- Costo promedio queda en 0.
- Lista muestra: Valor a costo: Sin costo registrado.

Android:

    PASS / FAIL:
    Notas:

iPhone:

    PASS / FAIL:
    Notas:

---

### Smoke 09 - Venta contado

Ruta:

    Ventas

Datos:

    Producto: Camiseta Piloto
    Cantidad: 1
    Pago: CONTADO

Esperado:

- Venta se registra.
- Stock baja.
- Reportes se actualizan.
- Ganancia usa costo congelado.

Android:

    PASS / FAIL:
    Notas:

iPhone:

    PASS / FAIL:
    Notas:

---

### Smoke 10 - Venta fiado

Ruta:

    Ventas

Datos:

    Cliente: Cliente Piloto
    Producto: Camiseta Piloto
    Cantidad: 1
    Pago: FIADO

Esperado:

- Venta se registra.
- Stock baja.
- Cliente queda con deuda.
- En Cliente Detalle aparece el concepto de lo vendido.
- La transaccion queda ligada a venta_id.

Android:

    PASS / FAIL:
    Notas:

iPhone:

    PASS / FAIL:
    Notas:

---

### Smoke 11 - Venta mixta

Ruta:

    Ventas

Datos:

    Cliente: Cliente Piloto
    Producto: Camiseta Piloto
    Cantidad: 1
    Abono: 20.000
    Resto fiado

Esperado:

- Venta se registra como MIXTO por derivacion.
- Stock baja.
- Monto contado y monto fiado se conservan.
- Ganancia no depende del metodo de pago.

Android:

    PASS / FAIL:
    Notas:

iPhone:

    PASS / FAIL:
    Notas:

---

### Smoke 12 - Reporte WhatsApp / compartir

Ruta:

    Reportes -> Compartir

Validar:

    HOY
    Historico

Esperado:

- Texto llega completo.
- Emojis se ven correctamente.
- Vendido, Ganancia, Venta promedio y Ventas coinciden con pantalla.
- "Como te pagaron las ventas" separa contado y quedo fiado.
- "Movimientos de fiado aparte" separa Fiados a mano y Abonos recibidos.
- No mezcla fiado de venta con fiado manual.

Android:

    PASS / FAIL:
    Notas:

iPhone:

    PASS / FAIL:
    Notas:

---

### Smoke 13 - Exportar respaldo

Ruta:

    Configuraciones -> Exportar respaldo completo

Esperado:

- Genera archivo JSON.
- Si se cancela compartir, no muestra error.
- En Android se puede validar archivo en cache con adb.
- En iPhone se valida que la hoja de compartir aparece y permite guardar o enviar.

Android:

    PASS / FAIL:
    Notas:

iPhone:

    PASS / FAIL:
    Notas:

---

### Smoke 14 - Importar respaldo

Solo ejecutar con datos de prueba.

Ruta:

    Configuraciones -> Importar respaldo

Esperado:

- Archivo invalido se rechaza.
- Schema incompatible se rechaza.
- Archivo valido exige escribir REEMPLAZAR.
- Si se escribe otra cosa, no cambia nada.
- Si se importa valido, reemplaza datos.

Android:

    PASS / FAIL:
    Notas:

iPhone:

    PASS / FAIL:
    Notas:

---

### Smoke 15 - Reiniciar inventario

Solo ejecutar con datos de prueba.

Ruta:

    Configuraciones -> Reiniciar inventario

Cancel path:

    Escribir NO

Esperado:

- No borra nada.

Happy path:

    Escribir REINICIAR

Esperado:

- productos = 0
- movim_inventario = 0
- ventas = 0
- venta_items = 0
- clientes conservados
- transacciones conservadas
- deuda visible
- venta_id preservado en transacciones
- se genera respaldo de seguridad antes

Android:

    PASS / FAIL:
    Notas:

iPhone:

    PASS / FAIL:
    Notas:

---

### Smoke 16 - Freemium

Validar con trial vencido.

Esperado:

- Lecturas siguen funcionando.
- Ventas bloqueadas.
- Crear producto bloqueado.
- Movimientos bloqueados.
- Fiado manual bloqueado.
- Abono permitido.
- Reiniciar inventario bloqueado.

Android:

    PASS / FAIL:
    Notas:

iPhone:

    PASS / FAIL:
    Notas:

---

## 5. Diferencias especificas por plataforma

### Android

Validar especialmente:

- APK instala.
- SQLite persiste despues de cerrar app.
- Export backup aparece en cache.
- Import backup funciona con file picker.
- Share sheet funciona con WhatsApp.
- Reset inventario ejecuta correctamente.

### iPhone

Validar especialmente:

- App instala desde Xcode.
- SQLite persiste despues de cerrar app.
- Teclado numerico funciona bien en campos monetarios.
- Share sheet de iOS comparte reporte y respaldo.
- File picker permite seleccionar respaldo JSON.
- Navegacion no se rompe.
- Dark mode y light mode se ven legibles.
- App no queda en blanco al cerrar y abrir.

---

## 6. Resultado final del smoke

Android Pixel_8:

    PASS / FAIL:

iPhone real:

    PASS / FAIL:

Fecha:

Commit main:

Tester:

Notas generales:
