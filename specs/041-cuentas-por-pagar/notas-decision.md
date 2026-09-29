# Notas de Decision - Feature 041

- **[UX] UI de Historial:** Se descarto 'Pagina Completa'. Se opto por 'Bottom Sheet Modal' (Opcion B) tras evaluar prototipo. Motivo: Interaccion mas moderna, requiere menos clics, y mantiene al comerciante en el contexto visual de la lista de proveedores.
- **[PRODUCTO] Feedback de campo (Doña Yudith):** El usuario acostumbra enviar foto del soporte de pago (pantallazo de Nequi o foto de factura fisica) al proveedor.
- **[ARQUITECTURA] Limite Tecnico de WhatsApp:** Se descarto integrar envio de fotos via web (wa.me) porque no lo soporta. Se posterga para el backlog usar APIs nativas (Capacitor Share).
- **[UX] Formateo Numerico en Input:** El usuario reporta incomodidad al digitar montos altos sin separadores de miles en el pop-up nativo. Se decide mantener el `type="number"` por velocidad del teclado, pero se añade al backlog tecnico la creacion de un componente Modal Numpad Personalizado que aplique mascaras de moneda en tiempo real (Currency Mask).
