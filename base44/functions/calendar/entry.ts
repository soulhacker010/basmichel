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

        const { action, projectId, projectTitle, shootDate, shootTime, durationMinutes, clientName, location, calendarEventId } = await req.json();

        // 1. Get Access Token for Google Calendar
        // Assuming the connector key is 'googlecalendar' based on standard naming
        const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlecalendar");

        if (!accessToken) {
            return Response.json({ error: 'Google Calendar not connected' }, { status: 400 });
        }

        // 2. Sync Event (Create or Update)
        if (action === 'syncEvent') {
            if (!shootDate) {
                return Response.json({ error: 'Shoot date is required' }, { status: 400 });
            }

            // Parse the date and time properly for Europe/Amsterdam timezone
            // shootDate format: "2026-02-03" or "2026-02-03T22:22:00"
            // shootTime format: "22:22" (optional)
            let startDateTime = shootDate;
            if (shootTime && !shootDate.includes('T')) {
                startDateTime = `${shootDate}T${shootTime}:00`;
            } else if (!shootDate.includes('T')) {
                startDateTime = `${shootDate}T09:00:00`; // Default to 9am if no time
            }

            // Calculate end time based on duration (default 60 minutes if not specified)
            let duration = durationMinutes;
            if (!duration && projectId) {
                try {
                    const sessions = await base44.asServiceRole.entities.Session.filter({ project_id: projectId });
                    if (sessions.length > 0) {
                        const sessionTypeId = sessions[0].session_type_id;
                        if (sessionTypeId) {
                            const sessionType = await base44.asServiceRole.entities.SessionType.get(sessionTypeId);
                            duration = sessionType?.duration_minutes;
                        }
                    }
                } catch (e) {
                    console.error('Failed to fetch session duration:', e);
                }
            }
            duration = duration || 60;

            // Calculate end time by adding duration minutes to local datetime string
            // Do NOT use new Date().toISOString() — that converts to UTC and shifts the time
            const [datePart, timePart] = startDateTime.split('T');
            const [hours, minutes, seconds] = timePart.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + duration;
            const endHours = Math.floor(totalMinutes / 60) % 24;
            const endMins = totalMinutes % 60;
            const endDateTime = `${datePart}T${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:${String(seconds || 0).padStart(2, '0')}`;

            // Fetch client name, session type and notes from DB
            let resolvedClientName = clientName || 'N/A';
            let sessionTypeName = null;
            let clientNotes = null;
            if (projectId) {
                try {
                    const project = await base44.asServiceRole.entities.Project.get(projectId);
                    clientNotes = project?.client_notes || null;
                    if (project?.client_id) {
                        const client = await base44.asServiceRole.entities.Client.get(project.client_id);
                        if (client?.user_id) {
                            const clientUser = await base44.asServiceRole.entities.User.get(client.user_id);
                            resolvedClientName = clientUser?.full_name || client.company_name || resolvedClientName;
                        } else {
                            resolvedClientName = client?.company_name || resolvedClientName;
                        }
                        if (client?.company_name && resolvedClientName !== client.company_name) {
                            resolvedClientName = `${resolvedClientName} (${client.company_name})`;
                        }
                    }
                    // Get session type name
                    const sessions = await base44.asServiceRole.entities.Session.filter({ project_id: projectId });
                    if (sessions.length > 0 && sessions[0].session_type_id) {
                        const st = await base44.asServiceRole.entities.SessionType.get(sessions[0].session_type_id);
                        sessionTypeName = st?.name || null;
                    }
                } catch (e) {
                    console.error('Failed to fetch project details:', e);
                }
            }

            const descriptionParts = [
                `Klant: ${resolvedClientName}`,
                sessionTypeName ? `Pakket: ${sessionTypeName}` : null,
                clientNotes ? `Notities klant: ${clientNotes}` : null,
                `Direct link: https://basmichel.com/AdminProjectDetail?id=${projectId}`,
            ].filter(Boolean).join('\n');

            const eventData = {
                summary: projectTitle,
                location: location || '',
                description: descriptionParts,
                start: {
                    dateTime: startDateTime,
                    timeZone: 'Europe/Amsterdam', // Netherlands timezone
                },
                end: {
                    dateTime: endDateTime,
                    timeZone: 'Europe/Amsterdam',
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