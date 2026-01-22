import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { start_datetime, end_datetime } = await req.json();

    // Get Google Calendar access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

    const calendarId = 'primary';
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${encodeURIComponent(start_datetime)}&timeMax=${encodeURIComponent(end_datetime)}&singleEvents=true`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to check calendar: ${await response.text()}`);
    }

    const data = await response.json();
    const hasConflict = data.items && data.items.length > 0;

    return Response.json({ 
      available: !hasConflict,
      conflicts: data.items || []
    });
  } catch (error) {
    console.error('Availability check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});