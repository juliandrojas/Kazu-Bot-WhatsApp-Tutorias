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

El bot usa Supabase tanto en Express como en Vercel; por eso no depende del sistema de archivos local. El proyecto incluye:

1. `api/webhook/evolution.js` es la Vercel Function de `POST /webhook/evolution`; `vercel.json` conserva esa URL pública sin el prefijo `/api`.
2. El estado se guarda en la tabla `conversations` de Supabase, con contacto, necesidad, material, horario, confirmación y fechas, además del estado del diálogo.

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
| `SUPABASE_URL` | URL del proyecto Supabase | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave `service_role` de Supabase | Sí |
| `WEBHOOK_SECRET` | Secreto compartido en `x-webhook-secret` | Sí |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Acceso al panel `/admin/` | Sí |
| `CRON_SECRET` | Protege la copia diaria | Sí |
| `GOOGLE_CALENDAR_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` | Integración estable con Google Calendar | Sí |

Nunca pegues secretos en el repositorio ni los envíes por WhatsApp o capturas de pantalla.

## Proceso de despliegue

1. Sube el proyecto a GitHub.
2. En Vercel selecciona **Add New → Project** e importa el repositorio. Detectará Node.js automáticamente; no establezcas un directorio raíz distinto.
3. En Supabase, abre **SQL Editor**, ejecuta el contenido de `supabase/schema.sql` y copia la **Project URL** y la clave secreta `service_role` desde **Settings → API**. Si ya habías creado la tabla, aplica primero `supabase/migrations/20260917120000_add_conversation_details.sql`.
4. Añade las variables de `.env.example` para los entornos Production, Preview y Development. En Evolution API configura el encabezado `x-webhook-secret` con el valor de `WEBHOOK_SECRET`. No subas `.env` ni expongas secretos en el navegador.
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
- [ ] Se aplicó la migración `20260918110000_add_operations_tables.sql`.
- [ ] `/admin/` solicita credenciales y carga solicitudes correctamente.
- [ ] Se probó una confirmación y se verificó el evento en Google Calendar.
