/** Crea eventos en Google Calendar usando una cuenta de servicio o refresh token OAuth. */
export async function createCalendarEvent({ calendarId, accessToken, clientId, clientSecret, refreshToken, request }) {
  if (!calendarId || !request.scheduledAt) return null;
  const token = accessToken || await refreshAccessToken({ clientId, clientSecret, refreshToken });
  if (!token) return null;
  const start = new Date(request.scheduledAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary: `Tutoría: ${request.name ?? 'Estudiante'}`,
      description: `Tema: ${request.need ?? 'Sin especificar'}\nContacto: ${request.contact ?? 'Sin especificar'}\nMaterial: ${request.material ?? 'Sin adjuntos'}`,
      start: { dateTime: start.toISOString(), timeZone: 'America/Bogota' },
      end: { dateTime: end.toISOString(), timeZone: 'America/Bogota' }
    })
  });
  if (!response.ok) throw new Error(`Google Calendar respondió ${response.status}`);
  return response.json();
}

async function refreshAccessToken({ clientId, clientSecret, refreshToken }) {
  if (!clientId || !clientSecret || !refreshToken) return null;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' })
  });
  if (!response.ok) throw new Error(`No se pudo renovar el acceso a Google Calendar (${response.status})`);
  return (await response.json()).access_token;
}
