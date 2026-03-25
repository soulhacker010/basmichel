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

        const { action, sessionId, sessionData, calendarEventId, timeMin, timeMax } = await req.json();

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
            let sessionType = null;
            if (sessionData.session_type_id) {
                try {
                    sessionType = await base44.asServiceRole.entities.SessionType.get(sessionData.session_type_id);
                } catch (e) {
                    console.warn('SessionType not found:', sessionData.session_type_id);
                }
            }
            const durationMinutes = sessionType?.duration_minutes || 60;

            // Pass the original datetime string directly (Amsterdam local time)
            const startISO = sessionData.start_datetime.replace(' ', 'T').slice(0, 19);
            if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(startISO)) {
                return Response.json({ error: 'Ongeldig start_datetime formaat' }, { status: 400 });
            }
            const endISO = sessionData.end_datetime
                ? (sessionData.end_datetime.includes('T') ? sessionData.end_datetime : `${sessionData.end_datetime}T00:00:00`)
                : new Date(new Date(startISO.replace(' ', 'T')).getTime() + durationMinutes * 60000).toISOString().slice(0, 19);

            // Get client name and company name
            let clientName = 'Geen klant';
            let companyName = null;
            if (sessionData.client_id) {
                let client = null;
                try { client = await base44.asServiceRole.entities.Client.get(sessionData.client_id); } catch(e) {}
                if (client) {
                    companyName = client.company_name || null;
                    if (client.user_id) {
                        try {
                            const clientUser = await base44.asServiceRole.entities.User.get(client.user_id);
                            const fullName = clientUser?.full_name ||
                                (clientUser?.first_name && clientUser?.last_name ? `${clientUser.first_name} ${clientUser.last_name}` : null) ||
                                clientUser?.first_name || clientUser?.last_name;
                            clientName = fullName || client.company_name || 'Onbekend';
                        } catch(e) {
                            clientName = client.company_name || 'Onbekend';
                        }
                    } else {
                        clientName = client.company_name || 'Onbekend';
                    }
                    // Use contact_name if available
                    if (client.contact_name) {
                        clientName = client.contact_name;
                    }
                }
            }

            // Build description
            const descriptionLines = [
                `Pakket: ${sessionType?.name || 'Onbekend'}`,
                companyName ? `Klant: ${clientName} (${companyName})` : `Klant: ${clientName}`,
                sessionData.notes ? `Notities: ${sessionData.notes}` : null,
            ].filter(Boolean).join('\n');

            const eventData = {
                summary: `${sessionData.location || 'Sessie'} - ${clientName}`,
                location: sessionData.location || '',
                description: descriptionLines,
                start: {
                    dateTime: startISO,
                    timeZone: 'Europe/Amsterdam',
                },
                end: {
                    dateTime: endISO,
                    timeZone: 'Europe/Amsterdam',
                },
                colorId: '10'
            };

            let response;
            if (calendarEventId) {
                response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${calendarEventId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(eventData)
                });
            } else {
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

        // Check Calendar Availability
        if (action === 'checkAvailability') {
            if (!timeMin || !timeMax) {
                return Response.json({ error: 'timeMin and timeMax are required' }, { status: 400 });
            }

            try {
                const params = new URLSearchParams({
                    timeMin: timeMin,
                    timeMax: timeMax,
                    singleEvents: 'true',
                    orderBy: 'startTime',
                    fields: 'items(summary,start,end,status,transparency)'
                });

                const response = await fetch(
                    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    return Response.json({
                        success: false,
                        busyTimes: [],
                        error: `Google Calendar API fout (${response.status}): ${errorText.substring(0, 200)}`
                    });
                }

                const data = await response.json();
                const events = data.items || [];

                const busyTimes = events
                    .filter((event) => event.status !== 'cancelled' && event.transparency !== 'transparent')
                    .map((event) => {
                        const isAllDay = !!event.start?.date && !event.start?.dateTime;
                        return {
                            summary: event.summary,
                            start: event.start?.dateTime || event.start?.date,
                            end: event.end?.dateTime || event.end?.date,
                            isAllDay: isAllDay
                        };
                    })
                    .filter((busy) => busy.start && busy.end);

                return Response.json({
                    success: true,
                    busyTimes: busyTimes
                });

            } catch (eventsError) {
                return Response.json({
                    success: false,
                    busyTimes: [],
                    error: `Calendar fout: ${String(eventsError)}`
                });
            }
        }

        // Bulk sync all sessions without a calendar event ID
        if (action === 'bulkSyncSessions') {
            if (user?.role !== 'admin') {
                return Response.json({ error: 'Forbidden' }, { status: 403 });
            }

            const allSessions = await base44.asServiceRole.entities.Session.list();
            const unsynced = allSessions.filter(s => !s.google_calendar_event_id && s.start_datetime);

            let synced = 0;
            let failed = 0;
            const errors = [];

            for (const session of unsynced) {
                try {
                    let sessionType = null;
                    if (session.session_type_id) {
                        try { sessionType = await base44.asServiceRole.entities.SessionType.get(session.session_type_id); } catch(e) {}
                    }
                    const durationMinutes = sessionType?.duration_minutes || 60;

                    const startISO = session.start_datetime.includes('T') ? session.start_datetime.slice(0, 19) : `${session.start_datetime}T00:00:00`;
                    let endISO;
                    if (session.end_datetime) {
                        endISO = session.end_datetime.includes('T') ? session.end_datetime.slice(0, 19) : `${session.end_datetime}T00:00:00`;
                    } else {
                        endISO = new Date(new Date(startISO).getTime() + durationMinutes * 60000).toISOString().slice(0, 19);
                    }

                    // Get client info
                    let bulkClientName = 'Geen klant';
                    let bulkCompanyName = null;
                    if (session.client_id) {
                        try {
                            const c = await base44.asServiceRole.entities.Client.get(session.client_id);
                            bulkCompanyName = c?.company_name || null;
                            bulkClientName = c?.contact_name || c?.company_name || 'Onbekend';
                            if (c?.user_id) {
                                const u = await base44.asServiceRole.entities.User.get(c.user_id);
                                if (u?.full_name) bulkClientName = c?.contact_name || u.full_name;
                            }
                        } catch(e) {}
                    }

                    const bulkDesc = [
                        `Pakket: ${sessionType?.name || 'Onbekend'}`,
                        bulkCompanyName ? `Klant: ${bulkClientName} (${bulkCompanyName})` : `Klant: ${bulkClientName}`,
                        session.notes ? `Notities: ${session.notes}` : null,
                    ].filter(Boolean).join('\n');

                    const eventData = {
                        summary: `${session.location || 'Sessie'} - ${bulkClientName}`,
                        location: session.location || '',
                        description: bulkDesc,
                        start: { dateTime: startISO, timeZone: 'Europe/Amsterdam' },
                        end: { dateTime: endISO, timeZone: 'Europe/Amsterdam' },
                        colorId: '10'
                    };

                    const resp = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(eventData)
                    });

                    if (!resp.ok) {
                        const errText = await resp.text();
                        errors.push(`Session ${session.id}: ${resp.status} ${errText.substring(0, 100)}`);
                        failed++;
                        continue;
                    }

                    const event = await resp.json();
                    await base44.asServiceRole.entities.Session.update(session.id, {
                        google_calendar_event_id: event.id
                    });
                    synced++;
                } catch(err) {
                    errors.push(`Session ${session.id}: ${String(err)}`);
                    failed++;
                }
            }

            return Response.json({ success: true, total: unsynced.length, synced, failed, errors });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Calendar Session Sync Error:', error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        return Response.json({ error: `Server fout: ${errorMsg}` }, { status: 500 });
    }
});