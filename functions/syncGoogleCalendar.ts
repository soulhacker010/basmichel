import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    // Get Google Calendar access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

    const calendarId = 'primary';
    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;

    if (event.type === 'create') {
      // Create new calendar event
      const client = await base44.asServiceRole.entities.Client.get(data.client_id);
      const project = data.project_id ? await base44.asServiceRole.entities.Project.get(data.project_id) : null;

      const eventData = {
        summary: `Shoot: ${project?.title || data.address || 'Booking'}`,
        description: `Client: ${client.company_name || client.contact_name}\nService: ${data.service_type}\n${data.notes || ''}`,
        start: {
          dateTime: data.start_datetime,
          timeZone: 'Europe/Amsterdam',
        },
        end: {
          dateTime: data.end_datetime,
          timeZone: 'Europe/Amsterdam',
        },
        location: data.address || '',
      };

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create calendar event: ${await response.text()}`);
      }

      const calendarEvent = await response.json();

      // Update booking with calendar event ID
      await base44.asServiceRole.entities.Booking.update(event.entity_id, {
        google_calendar_event_id: calendarEvent.id,
      });

      return Response.json({ success: true, eventId: calendarEvent.id });
    }

    if (event.type === 'update' && data.google_calendar_event_id) {
      // Update existing calendar event
      const client = await base44.asServiceRole.entities.Client.get(data.client_id);
      const project = data.project_id ? await base44.asServiceRole.entities.Project.get(data.project_id) : null;

      const eventData = {
        summary: `Shoot: ${project?.title || data.address || 'Booking'}`,
        description: `Client: ${client.company_name || client.contact_name}\nService: ${data.service_type}\n${data.notes || ''}`,
        start: {
          dateTime: data.start_datetime,
          timeZone: 'Europe/Amsterdam',
        },
        end: {
          dateTime: data.end_datetime,
          timeZone: 'Europe/Amsterdam',
        },
        location: data.address || '',
      };

      const response = await fetch(`${baseUrl}/${data.google_calendar_event_id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update calendar event: ${await response.text()}`);
      }

      return Response.json({ success: true });
    }

    if (event.type === 'delete' && old_data?.google_calendar_event_id) {
      // Delete calendar event
      const response = await fetch(`${baseUrl}/${old_data.google_calendar_event_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete calendar event: ${await response.text()}`);
      }

      return Response.json({ success: true });
    }

    return Response.json({ success: true, message: 'No action needed' });
  } catch (error) {
    console.error('Calendar sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});