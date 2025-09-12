# Instrucciones para el correcto funcionamiento de la aplicación

A continuación se detallan los cambios realizados y las instrucciones necesarias para que la aplicación funcione correctamente.

## Cambios realizados

1.  **Cambio de la ruta de subida de imágenes**: Se ha modificado la ruta donde se almacenan las imágenes subidas por los usuarios. La nueva ruta es `clients/{user.uid}/campaigns/{campaign_id}/user_uploads/{image_name}`. Se han actualizado todas las referencias a la ruta anterior para que la aplicación siga funcionando correctamente.

2.  **Implementación del botón "Duplicar Campaña"**: Se ha añadido la funcionalidad al botón "Duplicar Campaña" en el dashboard. Ahora, al hacer clic en este botón, se creará una copia exacta de la campaña, incluyendo los datos del formulario, los datos de salida y las imágenes. La nueva campaña se abrirá en una nueva pestaña y se mostrará un mensaje de éxito.

3.  **Desactivación del botón "Publicar Campaña"**: El botón "Publicar Campaña" ha sido desactivado y no es visible para los usuarios.

4.  **Añadido el botón "Descargar Anuncio"**: Se ha añadido un nuevo botón "Descargar Anuncio" en el dashboard, que permite a los usuarios descargar la imagen generada por la IA.

## Instrucciones manuales

Para que los cambios funcionen correctamente, es necesario tener en cuenta lo siguiente:

1.  **Configuración de Firebase**: Asegúrate de que tu proyecto de Firebase está correctamente configurado y que las reglas de seguridad de Firebase Storage permiten la escritura en la nueva ruta de subida de imágenes (`clients/{user.uid}/campaigns/{campaign_id}/user_uploads/{image_name}`).

2.  **Variables de entorno**: Verifica que todas las variables de entorno necesarias para la conexión con Firebase y otros servicios están correctamente configuradas en tu archivo `.env` o en el sistema de configuración de tu entorno.

3.  **Dependencias**: Asegúrate de tener todas las dependencias del proyecto instaladas. Puedes hacerlo ejecutando el siguiente comando en la raíz del proyecto:

    ```bash
    npm install
    ```

4.  **Ejecutar la aplicación**: Una vez que hayas verificado los puntos anteriores, puedes ejecutar la aplicación con el siguiente comando:

    ```bash
    npm run dev
    ```

Si sigues estas instrucciones, la aplicación debería funcionar correctamente con los nuevos cambios implementados.
