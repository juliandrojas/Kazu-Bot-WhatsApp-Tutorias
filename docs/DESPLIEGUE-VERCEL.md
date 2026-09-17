# Despliegue del bot con Vercel

Vercel es un buen lugar para el webhook y la lógica corta del bot. Evolution API no debe desplegarse allí porque mantiene la conexión con WhatsApp y necesita un proceso persistente. Instálala en un servidor que ejecute Docker, como un VPS.

## Arquitectura recomendada

```text
Persona en WhatsApp
        ↓
Evolution API en un VPS
        ↓ webhook HTTPS
Bot desplegado en Vercel
        ↕
Base de datos persistente
```

Vercel ejecuta una función por petición y puede reducir las instancias a cero si no hay tráfico. Por esa razón no debe almacenar el avance de las conversaciones solo en memoria o en archivos locales. [Vercel Functions](https://vercel.com/docs/functions)

## Cambios necesarios antes de desplegar

El servidor actual usa Express y escribe las conversaciones en `data/conversations.json`. Para Vercel necesitamos dos cambios:

El proyecto ya incluye ambos cambios:

1. `api/webhook/evolution.js` es la Vercel Function de `POST /webhook/evolution`; `vercel.json` conserva esa URL pública sin el prefijo `/api`.
2. El estado se guarda en Redis REST mediante Vercel KV o Upstash, no en el sistema de archivos efímero de Vercel.

No uses el sistema de archivos como base de datos en Vercel. Una petición puede ejecutarse en una instancia distinta de la anterior y los archivos no constituyen almacenamiento persistente para la aplicación.

## Variables de entorno en Vercel

En el proyecto de Vercel, abre **Settings → Environment Variables** y crea estas variables:

| Variable | Ejemplo | Secreta |
| --- | --- | --- |
| `EVOLUTION_API_URL` | `https://api.tudominio.com` | No necesariamente |
| `EVOLUTION_API_KEY` | Clave privada de Evolution API | Sí |
| `EVOLUTION_INSTANCE` | `tutorias` | No necesariamente |
| `TUTOR_PRICE` | `COP 45.000 por hora` | No |
| `TUTOR_LOCATION` | Dirección de la tutoría | No |
| `TUTOR_LOCATION_LINK` | Enlace de Google Maps | No |
| `KV_REST_API_URL` | URL REST de Vercel KV / Upstash | Sí |
| `KV_REST_API_TOKEN` | Token REST de Vercel KV / Upstash | Sí |

Nunca pegues secretos en el repositorio ni los envíes por WhatsApp o capturas de pantalla.

## Proceso de despliegue

1. Sube el proyecto a GitHub.
2. En Vercel selecciona **Add New → Project** e importa el repositorio. Detectará Node.js automáticamente; no establezcas un directorio raíz distinto.
3. En **Storage**, crea o conecta un store **Vercel KV** (o usa una base Upstash Redis REST). Vercel añade `KV_REST_API_URL` y `KV_REST_API_TOKEN` automáticamente; con Upstash añádelas manualmente.
4. Añade las tres variables de Evolution API y `TUTOR_PRICE` para los entornos Production, Preview y Development. No subas `.env`.
5. Despliega el proyecto y copia el dominio que Vercel te entregue.
6. Configura en Evolution API el webhook `MESSAGES_UPSERT` con esta URL:

   ```text
   https://tu-proyecto.vercel.app/webhook/evolution
   ```

7. Comprueba `https://tu-proyecto.vercel.app/health`, que debe responder `{"ok":true,"runtime":"vercel"}`, y envía un mensaje de prueba desde otro número de WhatsApp.

## Respuesta rápida del webhook

Evolution API espera una respuesta HTTP exitosa. La función del webhook debe contestar con código `200` rápidamente; después puede enviar la respuesta a WhatsApp. Mantén estas tareas pequeñas y evita cálculos largos dentro de una sola petición.

Vercel permite configurar una duración máxima para las funciones, pero para este bot normalmente bastan segundos. [Configuración de duración](https://vercel.com/docs/functions/configuring-functions/duration)

## Lista de verificación antes de publicar

- [ ] El repositorio no contiene `.env` ni claves privadas.
- [ ] La instancia de Evolution API está conectada al número correcto.
- [ ] El webhook usa HTTPS y apunta a la ruta correcta.
- [ ] Se activó el evento `MESSAGES_UPSERT`.
- [ ] La base de datos guarda y recupera una conversación por número de contacto.
- [ ] Se probó con un número distinto al número del bot.
- [ ] Se revisaron los logs de Vercel y de Evolution API ante un error.
