# Notas de Decision - Feature 041

- **[UX] UI de Historial:** Se eligio 'Pagina Completa' (navegacion clasica) en lugar de 'Modal'. Motivo: Mantener consistencia con el modulo de Fiados de clientes y otorgar espacio vertical para historiales largos.
- **[PRODUCTO] Feedback de campo (Doña Yudith):** El usuario acostumbra enviar foto del soporte de pago (pantallazo de Nequi o foto de factura fisica) al proveedor, junto con fotos de su propio cuaderno.
- **[ARQUITECTURA] Limite Tecnico de WhatsApp:** Se evaluo integrar la foto del soporte de pago ahora mismo. Se descarto temporalmente porque el intent web actual (`wa.me`) solo soporta texto. Para enviar imagenes a WhatsApp desde la app, sera necesario implementar el plugin nativo `Capacitor Share` en una fase posterior. El envio del saldo en texto ya reemplaza la necesidad de "tomarle foto al cuaderno".
