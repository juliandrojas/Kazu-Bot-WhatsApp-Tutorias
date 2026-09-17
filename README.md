# Kazu Bot — tutorías por WhatsApp

Este proyecto es un bot inicial para WhatsApp conectado a **Evolution API**. Guía a cada persona de forma ordenada: contacto → necesidad → material → recomendación → tarifa → disponibilidad → confirmación → ubicación.

## Cómo funciona, en lenguaje simple

WhatsApp no llama directamente a nuestro código. Evolution API mantiene la conexión con WhatsApp y, ante cada mensaje, hace una petición HTTP a la ruta `POST /webhook/evolution` de este proyecto. A eso se le llama **webhook**.

El servidor identifica al contacto, lee en qué paso está y guarda el avance en `data/conversations.json`. Después pide a Evolution API que envíe la siguiente pregunta. Así, cada número puede estar en una etapa distinta sin mezclarse con los demás.

`inicio`, `hola` o `menu` reinician una conversación. Los grupos y los mensajes enviados por tu propio número se ignoran para prevenir bucles.

## Instalación local

1. Instala [Node.js 20 o superior](https://nodejs.org/).
2. En la carpeta del proyecto ejecuta:

   ```bash
   npm install
   ```

3. Copia `.env.example` y nómbralo `.env`. Completa la URL, API key e instancia de Evolution API; también ajusta la tarifa y ubicación.
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
- `.env`: tarifa, dirección y enlace a Maps; nunca publiques este archivo.
- `src/evolution.js`: adaptación a una versión distinta de Evolution API.

## Antes de usarlo con clientes

Esta primera versión conserva las conversaciones en un archivo local: es adecuada para aprendizaje y una única instancia del servidor. Para producción conviene pasar ese estado a Redis o una base de datos, añadir autenticación/verificación del webhook y conectar la confirmación a un calendario real.

Documentación útil: [webhooks de Evolution API](https://docs.evolutionfoundation.com.br/en/evolution-api/configuration/webhooks) y [envío de texto](https://github.com/evolution-foundation/evolution-docs/blob/main/docs/05-Endpoints/00-send-plain-text.md).
