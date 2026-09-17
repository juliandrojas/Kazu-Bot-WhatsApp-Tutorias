# Guía para principiantes del bot de tutorías

Esta guía explica cómo funciona el bot, qué debes configurar y cómo modificarlo sin necesidad de haber creado antes un bot de WhatsApp.

## Qué construimos

El bot atiende a una persona mediante una conversación guiada. No intenta responder todo con inteligencia artificial: primero reúne la información necesaria para solicitar una tutoría de forma clara.

El recorrido es el siguiente:

```text
Contacto → Necesidad → Material → Recomendación → Tarifa → Disponibilidad → Confirmación → Ubicación
```

Cada contacto avanza de forma independiente. Si Ana escribe al mismo tiempo que Carlos, el bot conserva los datos de cada uno por separado.

## Conceptos básicos

### WhatsApp

Es el canal donde escribe el estudiante. El bot usa una instancia de WhatsApp conectada a Evolution API; no se comunica con WhatsApp directamente.

### Evolution API

Es el puente entre WhatsApp y nuestro código. Recibe un mensaje de WhatsApp y nos lo comunica. También recibe de nuestro código la orden de enviar una respuesta.

### Webhook

Un webhook es una dirección de internet a la que otro servicio manda información automáticamente. En este proyecto esa dirección es:

```text
POST /webhook/evolution
```

Cuando alguien escribe “Hola” al número conectado, Evolution API llama a esa ruta. El bot decide qué responder y manda el texto de vuelta por Evolution API.

### Variables de entorno

Son ajustes privados que no se escriben en el código: la clave de Evolution API, la dirección del servidor y el nombre de la instancia. Se guardan en `.env` localmente y en el panel de Vercel al desplegar.

No compartas ni subas el archivo `.env` a GitHub.

## El flujo de la conversación

| Etapa | Qué pregunta el bot | Para qué sirve |
| --- | --- | --- |
| Contacto | Nombre | Personalizar la atención y registrar la solicitud. |
| Necesidad | Materia, tema y fecha límite | Entender qué necesita estudiar la persona. |
| Material | Si tiene guía, fotos, PDF o apuntes | Saber si hay material para preparar la clase. |
| Recomendación | Si acepta una preparación propuesta | Alinear expectativas antes de hablar de pago. |
| Tarifa | Si desea continuar con el valor informado | Evitar pedir un horario sin conocer el costo. |
| Disponibilidad | Día y hora deseados | Recoger la propuesta de horario. |
| Confirmación | Si confirma el resumen | Reducir errores de materia, fecha u horario. |
| Ubicación | Dirección y enlace de Maps | Entregar los datos finales de la sesión. |

El estudiante puede escribir `inicio`, `hola` o `menu` para comenzar una solicitud nueva. Es útil si se equivoca o quiere pedir otra tutoría.

## Archivos importantes

| Archivo | Función |
| --- | --- |
| `src/conversation.js` | Contiene las preguntas, respuestas y reglas del flujo. |
| `src/server.js` | Recibe el webhook y coordina la respuesta. |
| `src/evolution.js` | Envía mensajes a Evolution API y lee los mensajes entrantes. |
| `src/supabase-store.js` | Guarda de forma persistente el paso y los datos de cada contacto en Supabase. |
| `.env.example` | Lista los valores que debes configurar sin exponer secretos. |
| `test/conversation.test.js` | Prueba el recorrido principal sin usar WhatsApp. |

## Preparación local

1. Instala Node.js 20 o superior.
2. Abre una terminal en la carpeta del proyecto.
3. Instala las dependencias:

   ```bash
   npm install
   ```

4. Crea un proyecto en Supabase y ejecuta `supabase/schema.sql` desde su SQL Editor.
5. Crea tu archivo de configuración a partir de `.env.example` y nómbralo `.env`.
6. Completa los valores de Evolution API, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y personaliza la tarifa.
7. Ejecuta las pruebas:

   ```bash
   npm test
   ```

8. Inicia el servidor:

   ```bash
   npm start
   ```

9. Comprueba que está vivo visitando `http://localhost:3000/health`. Debes recibir `{"ok":true}`.

## Personalizar el servicio

### Tarifa y ubicación

Cambia estos valores en `.env`:

```env
TUTOR_PRICE=COP 45.000 por hora
TUTOR_LOCATION=Carrera 7 # 72-41, Bogotá
TUTOR_LOCATION_LINK=https://maps.google.com/?q=4.655,-74.059
```

### Preguntas y textos

Abre `src/conversation.js`. Cada `case` representa una etapa. Por ejemplo, en `case STEPS.NEED` puedes sustituir la pregunta sobre la materia por una más específica para tu servicio.

Mantén las respuestas `sí` y `no` en las etapas de confirmación. Esas reglas evitan que el bot avance por error.

## Conectar con Evolution API

Primero debes crear una instancia y vincular en Evolution API el número de WhatsApp que usará el bot. Luego configura en esa instancia un webhook para eventos de mensajes entrantes (`MESSAGES_UPSERT`).

La dirección será:

```text
https://TU-DOMINIO/webhook/evolution
```

Tu URL debe ser pública y tener HTTPS. `localhost` funciona para probar el servidor, pero Evolution API no puede acceder a él desde internet. Para pruebas temporales puedes usar un túnel; para producción debes usar un despliegue público.

La documentación de Evolution API describe los webhooks y el envío de mensajes de texto:

- [Configuración de webhooks](https://docs.evolutionfoundation.com.br/en/evolution-api/configuration/webhooks)
- [Enviar un mensaje de texto](https://github.com/evolution-foundation/evolution-docs/blob/main/docs/05-Endpoints/00-send-plain-text.md)

## Qué ocurre al enviar un archivo

La primera versión registra que la persona tiene material, pero no descarga ni analiza automáticamente los archivos. La persona debe enviar el archivo y luego escribir `listo`; el bot continúa con la recomendación.

Esto es intencional: recibir un archivo y analizarlo con IA son dos capacidades diferentes. Podemos añadir análisis de PDF, imágenes o un asistente de IA en una siguiente etapa.

## Límites de esta primera versión

El estado se guarda en Supabase, por lo que permanece disponible tras reinicios, despliegues y al usar varias copias del bot. La tabla conserva el contacto, necesidad, material, horario, confirmación y fechas, junto al paso actual de la conversación. Consulta la [guía de despliegue con Vercel](DESPLIEGUE-VERCEL.md).

También falta una agenda real: el bot recoge el horario solicitado, pero una persona debe validarlo. En una versión posterior podemos conectarlo a Google Calendar u otro calendario.
