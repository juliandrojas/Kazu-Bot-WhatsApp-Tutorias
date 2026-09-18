# Kazu Bot — tutorías por WhatsApp

Este proyecto es un bot inicial para WhatsApp conectado a **Evolution API**. Guía a cada persona de forma ordenada: contacto → necesidad → material → recomendación → tarifa → disponibilidad → confirmación. Usa listas de WhatsApp para decisiones frecuentes, registra adjuntos y avisa al tutor cuando se confirma una solicitud.

## Documentación

- [Guía para principiantes](docs/GUIA-PARA-PRINCIPIANTES.md): explicación de WhatsApp, webhooks y cada paso del bot.
- [Despliegue con Vercel](docs/DESPLIEGUE-VERCEL.md): arquitectura recomendada, base de datos y variables de entorno.

## Cómo funciona, en lenguaje simple

WhatsApp no llama directamente a nuestro código. Evolution API mantiene la conexión con WhatsApp y, ante cada mensaje, hace una petición HTTP a la ruta `POST /webhook/evolution` de este proyecto. A eso se le llama **webhook**. En Vercel esa ruta se reescribe a una función serverless en `api/webhook/evolution.js`.

El servidor identifica al contacto, lee en qué paso está y guarda el avance en Supabase. Después pide a Evolution API que envíe la siguiente pregunta. Así, cada número puede estar en una etapa distinta sin mezclarse con los demás, incluso después de reiniciar o desplegar una actualización.

`inicio`, `hola` o `menu` reinician una conversación. Los grupos y los mensajes enviados por tu propio número se ignoran para prevenir bucles.

## Instalación local

1. Instala [Node.js 20 o superior](https://nodejs.org/).
2. En la carpeta del proyecto ejecuta:

   ```bash
   npm install
   ```

3. Crea un proyecto en Supabase, ejecuta [`supabase/schema.sql`](supabase/schema.sql) en su SQL Editor y copia su URL y clave `service_role`. Luego copia `.env.example` como `.env`, completa las credenciales de Evolution API y Supabase, y ajusta la tarifa.
4. Comprueba la lógica sin conectarte a WhatsApp:

   ```bash
   npm test
   ```

5. Inicia el bot:

   ```bash
   npm start
   ```

6. Visita `http://localhost:3000/health`; debe mostrar `{"ok":true}`.

## Conectar Evolution API

Para que Evolution API pueda llegar a tu computador, la URL del webhook debe ser pública y usar HTTPS. Para desarrollo puedes exponer el puerto 3000 con Cloudflare Tunnel o ngrok; para producción usa un dominio/servidor con HTTPS.

En tu instancia de Evolution API configura el evento de mensajes entrantes (`MESSAGES_UPSERT`) apuntando a:

```
https://TU-DOMINIO/webhook/evolution
```

El formato de eventos puede variar algo entre versiones. El bot acepta el formato habitual con `data.key` y también el formato directo con `key`. El envío usa `POST /message/sendText/{instancia}`, con cabecera `apikey`, como documenta Evolution API.

## Dónde modificar el comportamiento

- `src/conversation.js`: mensajes, preguntas y reglas de cada etapa.
- `.env`: tarifa y credenciales de Evolution API; nunca publiques este archivo.
- `src/evolution.js`: adaptación a una versión distinta de Evolution API.

## Despliegue en Vercel

El bot usa Supabase en local y en producción para que el estado sobreviva entre reinicios y funciones serverless. Consulta la [guía de Vercel](docs/DESPLIEGUE-VERCEL.md) para importar el repositorio de GitHub, definir variables y configurar Evolution API.

## Antes de usarlo con clientes

Supabase almacena por contacto el nombre, necesidad, material, metadatos de los adjuntos, horario, confirmación y fechas, además del estado que permite reanudar el diálogo. Define `TUTOR_NOTIFY_NUMBER` para recibir las solicitudes confirmadas y ajusta `TUTOR_START_HOUR`/`TUTOR_END_HOUR` si tu jornada cambia. Los archivos permanecen en WhatsApp: la base solo conserva sus metadatos para que cada solicitud sea fácil de revisar. Añade autenticación/verificación del webhook y conecta la confirmación a un calendario real antes de atender clientes.

Documentación útil: [webhooks de Evolution API](https://docs.evolutionfoundation.com.br/en/evolution-api/configuration/webhooks) y [envío de texto](https://github.com/evolution-foundation/evolution-docs/blob/main/docs/05-Endpoints/00-send-plain-text.md).
