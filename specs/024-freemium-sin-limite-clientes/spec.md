# Feature 024 - Freemium: sin limite de clientes + recordatorios de trial

## Contexto
Durante el piloto activo con 3 merchants, el limite de 7 clientes bloqueaba
la app antes de que el merchant pudiera evaluarla con su clientela real.
Diego decide que el UNICO limite del trial debe ser el tiempo, no la
cantidad de clientes creados. Ademas, quiere fomentar mas compromiso del
piloto durante el trial: que use la app activamente y le comparta su
experiencia, mediante recordatorios suaves (no bloqueantes).

## Decision - Parte A: eliminar el limite por clientes
- Se elimina LIMITE_CLIENTES (7) y toda la logica de bloqueadoPorClientes
  en FreemiumService.obtenerEstado().
- contarClientes() deja de invocarse dentro de obtenerEstado() (ya no
  decide el bloqueo). DatabaseService.contarClientes() en si NO se toca
  (se usa en otras partes del proyecto, confirmado por grep).
- motivo pasa de 'clientes' | 'tiempo' | 'ninguno' a solo 'tiempo' | 'ninguno'.
- puedeAgregarCliente() se mantiene (mismo nombre, las 2 llamadas existentes
  en home.page.ts y nuevo-cliente.component.ts no cambian), pero ahora su
  comportamiento es identico a puedeEscribir(): solo depende de licencia y
  dias transcurridos.
- LIMITE_DIAS sube de 20 a 25.

## Decision - Parte B: recordatorios de compromiso durante el trial
- Se muestra un Alert NO bloqueante (a diferencia de mostrarAlertaBloqueo,
  que si bloquea) en el dia 8 y en el dia 17 desde la instalacion.
- Maximo UNA vez por dia calendario, incluso si la app se abre varias veces
  ese dia. Se persiste en Preferences bajo una KEY nueva
  (ultimo_dia_recordatorio_mostrado) para no repetir en la misma sesion/dia.
- Solo aplica DURANTE el trial activo: si ya tiene licencia premium, o si
  el trial ya esta bloqueado (expirado), no se muestra ningun recordatorio.
- No usa la palabra "feedback". Mensaje en espanol, resaltando el esfuerzo
  del desarrollo en pro del negocio del merchant:

  Titulo: "Gracias por confiar en FiApp! (emoji manos arriba)"
  Cuerpo: "Cada actualizacion que hago pensando en tu negocio, en que lleves
  tus cuentas mas facil y le ganes tiempo al dia a dia. Cuentame como te
  esta yendo con la app, tu experiencia es lo que mas me ayuda a seguir
  mejorandola para ti."
  Botones: "Cerrar" (cancel) / "Escribirle a Diego" (abre el mismo
  WHATSAPP_FEEDBACK_URL que ya existe).

## Alcance
- Unico archivo de logica de negocio: freemium.service.ts.
- Se reusa el mismo AlertController y el mismo WHATSAPP_FEEDBACK_URL ya
  existentes; no se crea infraestructura nueva de mensajeria.
- Persistencia del "ya se mostro hoy" en Preferences (mismo patron que
  trial_bloqueado), no en SQLite. Es estado de UI/UX, no dato de negocio.
- Se llama la verificacion de recordatorio desde app.component.ts, junto a
  inicializarEstadoFreemium() (arranque de la app), sin bloquear el arranque.

## Fuera de alcance
- No se toca schema, DatabaseService (mas alla de NO invocar contarClientes
  desde obtenerEstado), ni ninguna escritura de negocio.
- No se elimina contarClientes() de DatabaseService (sigue usandose en
  otras partes segun el grep de evidencia).
- No se cambia el comportamiento de bloqueo POR TIEMPO (sigue bloqueando
  toda escritura al expirar los 25 dias, igual que antes con 20).
- No se agregan mas de 2 recordatorios en esta primera version.

## Reuso de precedentes
- Mismo patron de Preferences que trial_bloqueado / licencia_premium.
- Mismo AlertController y WHATSAPP_FEEDBACK_URL de mostrarAlertaBloqueo.
- Principio de "leer es gratis" (Decision 033) no aplica aqui: esto es una
  notificacion, no un guard de escritura.

## Acceptance criteria
AC-01. Con dias_desde_instalacion = 21 (bajo el limite viejo) y sin licencia
       premium, puedeEscribir() devuelve true (antes hubiera bloqueado a los
       20; ahora el limite es 25).
AC-02. Con totalClientes en cualquier valor (incluido 50), si dias <= 25 y
       no hay licencia, puedeEscribir() devuelve true. El conteo de clientes
       ya NO influye en el bloqueo.
AC-03. Con dias > 25 y sin licencia, puedeEscribir() devuelve false y
       muestra la alerta de bloqueo (comportamiento por tiempo sin cambios,
       solo el umbral subio).
AC-04. Con licencia premium activa, puedeEscribir() devuelve true sin
       invocar contarClientes ni mostrar ninguna alerta.
AC-05. En el dia 8 (y no antes), si el trial esta activo (no bloqueado, sin
       licencia) y no se ha mostrado el recordatorio ese dia calendario, se
       muestra el Alert de compromiso. No bloquea la app.
AC-06. En el dia 17, mismo comportamiento que AC-05, independiente de si el
       recordatorio del dia 8 se vio o no.
AC-07. Si se abre la app 3 veces en el mismo dia calendario dentro de la
       ventana del recordatorio, este se muestra UNA sola vez.
AC-08. Si el trial ya esta bloqueado (expirado) o hay licencia premium, NO
       se muestra ningun recordatorio, sin importar el dia.
AC-09. El mensaje del recordatorio NO contiene la palabra "feedback".

## Gate de pruebas
- TDD estricto: RED antes de GREEN en freemium.service.spec.ts.
- Ajustar los tests existentes que mockeaban contarClientes como parte de
  la decision de bloqueo (ya no aplica); mantener contarClientes en el mock
  del spec solo si sigue siendo dependencia inyectada, ajustando expectativas.
- Gate: TOTAL SUCCESS en la suite completa antes de cada commit de codigo.
- Verificacion BY HAND en Android: confirmar que con muchos clientes creados
  la app sigue funcionando sin bloqueo (solo por tiempo), y que el
  recordatorio aparece en los dias esperados sin bloquear la interaccion.
