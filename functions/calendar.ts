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

        const { action, projectId, projectTitle, shootDate, calendarEventId } = await req.json();

        // 1. Get Access Token for Google Calendar
        // Assuming the connector key is 'googlecalendar' based on standard naming
        const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");

        if (!accessToken) {
            return Response.json({ error: 'Google Calendar not connected' }, { status: 400 });
        }

        // 2. Sync Event (Create or Update)
        if (action === 'syncEvent') {
            if (!shootDate) {
                return Response.json({ error: 'Shoot date is required' }, { status: 400 });
            }

            const eventData = {
                summary: `Shoot: ${projectTitle}`,
                description: `Project ID: ${projectId}\nDirect link: ${req.headers.get('origin')}/EditorProjects?id=${projectId}`,
                start: {
                    dateTime: new Date(shootDate).toISOString(), // Ensure ISO format
                },
                end: {
                    // Default to 4 hours duration if not specified
                    dateTime: new Date(new Date(shootDate).getTime() + (4 * 60 * 60 * 1000)).toISOString(),
                }
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
                // OPTIONAL: Check availability before creating (Simple Conflict Block)
                const timeMin = new Date(shootDate).toISOString();
                const timeMax = new Date(new Date(shootDate).getTime() + (4 * 60 * 60 * 1000)).toISOString();

                const busyRes = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ timeMin, timeMax, items: [{ id: 'primary' }] })
                });

                if (busyRes.ok) {
                    const busyData = await busyRes.json();
                    if (busyData.calendars.primary.busy && busyData.calendars.primary.busy.length > 0) {
                        return Response.json({ error: 'Conflict: Calendar is busy at this time.' }, { status: 409 });
                    }
                }

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

            // Return the event ID so the frontend can save it to the project
            return Response.json({
                success: true,
                calendarEventId: event.id,
                htmlLink: event.htmlLink
            });
        }


        // 4. Delete Event (Cancellation)
        if (action === 'deleteEvent') {
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

            if (!response.ok && response.status !== 404) { // Ignore 404 if already deleted
                throw new Error('Failed to delete calendar event');
            }

            return Response.json({ success: true });
        }

        // 3. Check Availability (Prevent Conflict)
        if (action === 'checkAvailability') {
            const timeMin = new Date(shootDate).toISOString();
            const timeMax = new Date(new Date(shootDate).getTime() + (24 * 60 * 60 * 1000)).toISOString(); // Check the whole day

            const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    timeMin,
                    timeMax,
                    items: [{ id: 'primary' }]
                })
            });

            if (!response.ok) {
                throw new Error('Failed to check availability');
            }

            const data = await response.json();
            const busySlots = data.calendars.primary.busy;

            return Response.json({
                success: true,
                busySlots
            });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Calendar Sync Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
