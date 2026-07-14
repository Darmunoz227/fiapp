Especificación de Feature: Borrado seguro y recuperable (soft-delete) para clientes y transacciones
User Stories
Como comerciante, quiero borrar un cliente para no tenerlo en mi sistema pero mantener la opción de restaurarlo si lo necesito.
Como comerciante, quiero borrar una transacción para corregir errores y que esto se refleje en los cálculos del saldo sin perder el registro por completo.
Como comerciante, quiero deshacer un borrado reciente para restaurar un cliente o transacción a su estado previo.
Descripción
Este feature introduce un mecanismo de borrado seguro y recuperable en la aplicación FiApp. Los registros de clientes y transacciones se ocultarán, pero se conservarán internamente para su posible recuperación posterior. Esto evitará la pérdida de datos por eliminaciones accidentales y permitirá una sincronización correcta entre dispositivos.

Comportamiento Requerido
Para Clientes
Borrado Lógico: Cuando un cliente es borrado, se oculta de todas las vistas pero permanece en la base de datos con el campo deleted_at establecido.
Deshacer Borrado: Se proporciona una opción "Deshacer" que restaura el cliente a su estado previo.
Restricción de Deuda: Solo se puede borrar un cliente si no tiene deuda activa.
Conteo Freemium: El conteo de clientes para el plan freemium (7 clientes) NO incluirá clientes borrados.
Para Transacciones
Borrado Lógico: Cuando una transacción es borrada, se oculta de todas las vistas y recalcula el saldo sin considerarla.
Deshacer Borrado: Se proporciona una opción "Deshacer" que restaura la transacción a su estado previo.
Criterios de Aceptación
Clientes
Borrado Lógico:

Al borrar un cliente, el registro se oculta de la lista de clientes.
El cliente no es eliminado físicamente de la base de datos; se establece el campo deleted_at.
Deshacer Borrado:

La opción "Deshacer" restaura el cliente a su estado previo, removiendo el campo deleted_at.
Después de deshacer el borrado, el cliente debe aparecer nuevamente en la lista de clientes.
Restricción de Deuda:

Un cliente no puede ser borrado si tiene deuda activa.
Se muestra un mensaje de error indicando que el cliente tiene deuda y no puede ser borrado.
Conteo Freemium:

El conteo de clientes para el plan freemium (7 clientes) NO incluirá clientes borrados en su cálculo.
Si se borra un cliente, la cuenta de clientes disponibles para el plan freemium debe ajustarse automáticamente.
Transacciones
Borrado Lógico:

Al borrar una transacción, el registro se oculta de las listas y vistas relevantes.
La transacción no es eliminada físicamente de la base de datos; se establece el campo deleted_at.
El saldo calculado debe reflejar correctamente la ausencia de esta transacción.
Deshacer Borrado:

La opción "Deshacer" restaura la transacción a su estado previo, removiendo el campo deleted_at.
Después de deshacer el borrado, la transacción debe aparecer nuevamente en las listas y vistas relevantes.
El saldo calculado debe ajustarse automáticamente para incluir nuevamente esta transacción.
Escenarios
Borrado Lógico de Cliente
Scenario: Un cliente puede ser borrado lógicamente

Given:

Existe un cliente sin deuda activa en la lista de clientes.
El usuario está autenticado como OWNER.
When:

El usuario selecciona el cliente y presiona el botón "Borrar".
Then:

El cliente se oculta de la lista de clientes.
El cliente permanece en la base de datos con deleted_at establecido.
Deshacer Borrado de Cliente
Scenario: Un cliente borrado puede ser deshecho

Given:

Existe un cliente que fue borrado lógicamente.
El usuario está autenticado como OWNER.
When:

El usuario selecciona el cliente y presiona el botón "Deshacer".
Then:

El cliente se restaura a su estado previo, removiendo deleted_at.
El cliente aparece nuevamente en la lista de clientes.
Restricción de Deuda al Borrar Cliente
Scenario: Un cliente con deuda activa no puede ser borrado

Given:

Existe un cliente con deuda activa.
El usuario está autenticado como OWNER.
When:

El usuario selecciona el cliente y presiona el botón "Borrar".
Then:

Se muestra un mensaje de error indicando que el cliente tiene deuda y no puede ser borrado.
El cliente permanece en la lista de clientes sin cambios.
Borrado Lógico de Transacción
Scenario: Una transacción puede ser borrada lógicamente

Given:

Existe una transacción registrada en la lista de transacciones.
El usuario está autenticado como OWNER.
When:

El usuario selecciona la transacción y presiona el botón "Borrar".
Then:

La transacción se oculta de las listas de transacciones.
La transacción permanece en la base de datos con deleted_at establecido.
El saldo calculado se actualiza para reflejar la ausencia de esta transacción.
Deshacer Borrado de Transacción
Scenario: Una transacción borrada puede ser deshecha

Given:

Existe una transacción que fue borrada lógicamente.
El usuario está autenticado como OWNER.
When:

El usuario selecciona la transacción y presiona el botón "Deshacer".
Then:

La transacción se restaura a su estado previo, removiendo deleted_at.
La transacción aparece nuevamente en las listas de transacciones.
El saldo calculado se actualiza para incluir nuevamente esta transacción.
Casos Borde

Cierra la app antes de Deshacer:
- Escenario: Un cliente o transacción es borrado y el usuario cierra la 
  aplicación antes de usar "Deshacer".
- Comportamiento Esperado: El borrado queda permanente-lógico. El registro 
  permanece oculto con su marca de borrado y NO es recuperable desde la 
  interfaz hasta que exista la papelera visible (fuera de alcance).

Intenta Borrar Cliente con Deuda:

Escenario: Un cliente con deuda activa intenta ser borrado.
Comportamiento Esperado: Se muestra un mensaje de error indicando que el cliente tiene deuda y no puede ser borrado. El cliente permanece en la lista de clientes sin cambios.
Deshace el Borrado de una Transacción:

Escenario: Una transacción es borrada lógicamente y luego deshacida.
Comportamiento Esperado: La transacción se restaura a su estado previo, removiendo deleted_at. El saldo calculado se actualiza para incluir nuevamente esta transacción. La transacción aparece nuevamente en las listas de transacciones.