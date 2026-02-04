import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, sessionId, sessionData, calendarEventId } = await req.json();

        const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");

        if (!accessToken) {
            return Response.json({ error: 'Google Calendar not connected' }, { status: 400 });
        }

        // Create or Update Session Event
        if (action === 'syncSessionEvent') {
            if (!sessionData || !sessionData.start_datetime) {
                return Response.json({ error: 'Session data with start_datetime is required' }, { status: 400 });
            }

            // Get session type for duration
            const sessionType = await base44.asServiceRole.entities.SessionType.get(sessionData.session_type_id);
            const durationMinutes = sessionType?.duration_minutes || 60;

            // Calculate end time based on duration
            const startDate = new Date(sessionData.start_datetime);
            const endDate = new Date(startDate.getTime() + (durationMinutes * 60 * 1000));

            // Get client name
            let clientName = 'Geen klant';
            if (sessionData.client_id) {
                const client = await base44.asServiceRole.entities.Client.get(sessionData.client_id);
                if (client) {
                    if (client.user_id) {
                        const user = await base44.asServiceRole.entities.User.get(client.user_id);
                        // Try full_name first, then first_name + last_name, then company_name
                        const fullName = user?.full_name ||
                            (user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : null) ||
                            user?.first_name || user?.last_name;
                        clientName = fullName || client.company_name || 'Onbekend';
                    } else {
                        clientName = client.company_name || 'Onbekend';
                    }
                }
            }

            const eventData = {
                summary: `${sessionType?.name || 'Sessie'} - ${clientName}`,
                description: `Type: ${sessionType?.name || 'Onbekend'}\nKlant: ${clientName}\nLocatie: ${sessionData.location || 'N/A'}\n${sessionData.notes ? `\nNotities: ${sessionData.notes}` : ''}`,
                start: {
                    dateTime: sessionData.start_datetime,
                    timeZone: 'Europe/Amsterdam',
                },
                end: {
                    dateTime: endDate.toISOString(),
                    timeZone: 'Europe/Amsterdam',
                },
                colorId: '10' // Green color for sessions
            };

            let response;
            if (calendarEventId) {
                // Update existing event
                response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${calendarEventId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(eventData)
                });
            } else {
                // Create new event
                response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(eventData)
                });
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Calendar API Error:', errorText);
                throw new Error(`Calendar API Error: ${response.status} ${errorText}`);
            }

            const event = await response.json();

            return Response.json({
                success: true,
                calendarEventId: event.id,
                htmlLink: event.htmlLink
            });
        }

        // Delete Session Event
        if (action === 'deleteSessionEvent') {
            if (!calendarEventId) {
                return Response.json({ error: 'Calendar Event ID is required' }, { status: 400 });
            }

            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${calendarEventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok && response.status !== 404) {
                throw new Error('Failed to delete calendar event');
            }

            return Response.json({ success: true });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Calendar Session Sync Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});