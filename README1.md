# Configuración manual necesaria para el formulario post-registro y Firestore

## 1. Reglas de Seguridad de Firestore

Asegúrate de que las reglas de Firestore permitan que los usuarios autenticados puedan actualizar su propio documento en la colección `clients`.

Ejemplo recomendado:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clients/{userId} {
      allow read, write, create, update: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

- Esto permite que cada usuario autenticado lea y escriba únicamente su propio documento.
- Aplica estas reglas en la consola de Firebase: Firestore Database > Rules.

---

## 2. Habilitar Firestore y Authentication

- Ve a la [Consola de Firebase](https://console.firebase.google.com/).
- Activa Firestore Database (modo test o con reglas seguras como las de arriba).
- Activa el método de autenticación que uses (Email/Password, Google, etc).

---

## 3. Configuración de Firebase en tu proyecto

- Asegúrate de que el archivo `src/firebase/firebaseConfig.ts` tenga los datos reales de tu proyecto Firebase.
- El archivo `src/firebase/firestoreService.ts` debe estar correctamente importado y usado en tu formulario.

---

## 4. Consideraciones adicionales

- Si usas otros campos personalizados, revisa que el modelo de datos en Firestore acepte esos campos.
- Si tienes problemas de permisos, revisa la consola de Firebase para ver los errores de seguridad.

---

¿Dudas? Consulta la documentación oficial de [Firebase Firestore Rules](https://firebase.google.com/docs/firestore/security/get-started?hl=es).
