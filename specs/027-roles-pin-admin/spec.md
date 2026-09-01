# Feature 027 - PIN de administrador para acciones destructivas (Fase 1 de roles)

## Origen
Dos merchants pidieron control de rol: el inventario no debe poder alterarse
sin autorizacion del propietario. Los merchants trabajan por turnos con un
familiar; el "empleado" no es un extrano a vigilar sino familia que ayuda.
El objetivo es un candado de intencion: evitar que el familiar, en el uso
normal, altere por error o impulso el inventario, los precios o borre cosas.

## Contexto de dispositivo (realidad observada)
Los merchants usan su celular personal y le copian el APK al familiar para
que instale la app en su propio telefono. NO hay un dispositivo dedicado al
negocio todavia (es tema de educacion del merchant, aun no resuelto). Por eso
el modelo NO es multi-usuario con login: es un candado local por accion.

## Alcance honesto de lo que protege
Un PIN guardado localmente NO es seguridad criptografica: alguien tecnico con
acceso al dispositivo podria eludirlo. Pero esa NO es la amenaza real aqui.
La amenaza real es "que el familiar no me desordene el inventario sin querer".
Para ese problema (familia, confianza, prevenir errores) el PIN simple es la
herramienta correcta y suficiente. Se documenta explicitamente para no vender
una falsa sensacion de seguridad.

## Decision de alcance: Fase 1
La app arranca ABIERTA (generica para ambos roles), NO en modo empleado. Solo
las acciones DESTRUCTIVAS piden PIN en el momento (PIN por accion, no por
sesion, porque son las mas peligrosas). Fase 1 gatea exactamente TRES acciones:
- Reiniciar inventario (configuraciones.page.ts) - ya pide escribir REINICIAR;
  se antepone el PIN.
- Anular movimiento de inventario (inventory-movement.page.ts) - destructiva,
  altera el stock historico via softDelete.
- Editar producto (inventory-list.page.ts, abrirEdicion) - cambia precios y
  datos; el requisito del merchant es que el inventario no se altere sin
  autorizacion.

## Fuera de alcance (Fase 1)
- Duplicar producto NO se gatea: es constructivo (crea uno nuevo), no
  destructivo, y es justo el flujo que Feature #25 acelero para las tiendas
  de ropa. Pedir PIN por cada talla mataria esa agilidad.
- Ocultar ganancias al empleado NO entra: no es una accion a bloquear con PIN
  puntual sino una vista a ocultar por defecto, lo que requiere un modelo de
  estado de sesion (modo admin activo) mas complejo. Se pospone.
- NO se implementa login, tabla de usuarios, ni multi-dispositivo.
- created_by (de Feature #26) NO se pobla todavia con el rol; queda para
  cuando exista un concepto de sesion de usuario.

## Mecanismo del PIN
- Nuevo KEY en Preferences: pin_administrador (string). Mismo patron que el
  resto de PreferencesService (get/set con try/catch).
- El merchant configura su PIN en Configuraciones (nueva seccion "Seguridad").
  Puede establecerlo y cambiarlo (para cambiarlo, se pide el PIN actual).
- Si NO hay PIN configurado (null), las tres acciones destructivas quedan
  ABIERTAS: se ejecutan sin pedir nada. Esto evita bloquear a merchants que
  aun no han configurado seguridad.
- Si hay PIN configurado, antes de ejecutar cada accion destructiva se muestra
  un AlertController con input type password. Si el PIN ingresado coincide, la
  accion procede; si no coincide, se cancela y se avisa.

## Logica pura testeable
Se extrae la verificacion a una funcion pura para poder testearla sin DOM:
- verificarPin(ingresado: string, guardado: string | null): boolean
  - Si guardado es null -> true (sin PIN configurado, se permite).
  - Si guardado tiene valor -> true solo si ingresado === guardado (trim).
Esto centraliza la regla "sin pin configurado permite" y evita duplicarla en
cada una de las tres pantallas.

## Alcance de archivos
- src/app/core/preferences/preferences.service.ts: KEY pin_administrador +
  getPinAdministrador/setPinAdministrador.
- src/app/core/seguridad/pin.ts (nuevo): funcion pura verificarPin + tests.
- Un helper compartido para "pedir PIN y ejecutar si es correcto". Puede vivir
  como metodo en un servicio nuevo (SeguridadService) o como utilidad. Se
  decide en plan.md para no duplicar el AlertController en 3 pantallas.
- configuraciones.page.ts/html: seccion Seguridad (configurar/cambiar PIN) +
  gate en reiniciarInventario.
- inventory-list.page.ts: gate en abrirEdicion.
- inventory-movement.page.ts: gate en anularMovimiento.

## Reuso de precedentes
- El patron de AlertController con input password ya existe en
  mostrarAlertaCodigoActivacion (activacion premium). Se replica el estilo.
- PreferencesService ya tiene el patron KEY + get/set (nombreNegocio,
  trial_bloqueado, catalogo_fiado, etc.).

## Acceptance criteria
AC-01. Sin PIN configurado, las tres acciones destructivas se ejecutan sin
       pedir PIN (comportamiento actual intacto).
AC-02. Con PIN configurado, reiniciar inventario pide el PIN antes del flujo
       de REINICIAR; PIN correcto continua, incorrecto cancela.
AC-03. Con PIN configurado, editar producto pide el PIN antes de abrir el
       modal de edicion; incorrecto no abre el modal.
AC-04. Con PIN configurado, anular movimiento pide el PIN antes del
       softDelete; incorrecto no anula.
AC-05. Duplicar producto NUNCA pide PIN (constructivo, fuera de alcance).
AC-06. El merchant puede configurar un PIN por primera vez en Configuraciones.
AC-07. Para cambiar un PIN existente se exige el PIN actual.
AC-08. verificarPin: null guardado -> true; valor guardado -> true solo si
       coincide (trim), false si no.
AC-09. Sin regresiones en la suite.

## Gate de pruebas
- TDD: RED antes de GREEN para verificarPin (funcion pura) en pin.spec.ts.
- Suite completa TOTAL SUCCESS antes de cada commit de codigo.
- Device test Android: sin PIN, las 3 acciones corren normal; configurar PIN;
  con PIN, cada una de las 3 pide el PIN (correcto procede, incorrecto
  cancela); duplicar NO pide PIN; cambiar el PIN exige el actual.
