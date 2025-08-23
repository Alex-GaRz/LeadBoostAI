# Reporte de Cambios - Formulario de Registro (Rama version1)

## Cambios Generales Realizados

- Se simplificó el flujo de registro de usuario:
  - El formulario inicial ya no solicita el nombre completo, solo correo y contraseña.
  - El formulario post-registro ahora solicita primero el nombre completo y luego el resto de los datos de la empresa y el rol del usuario.
- Se eliminaron campos innecesarios y se unificó la estructura de datos:
  - Solo se guardan dos campos principales para el usuario: `userName` (nombre completo) y `userRole` (rol/cargo).
  - Se eliminó el campo `personName` y se corrigió la duplicidad entre `userName` y `userRole`.
- Se mejoró la lógica para guardar correctamente el email y los datos relevantes en Firestore.
- Se ajustó la UI para que el nombre sea el primer dato solicitado en el formulario post-registro.

---

Este reporte resume los cambios principales aplicados sobre el flujo de registro y los formularios en la rama `version1`.
