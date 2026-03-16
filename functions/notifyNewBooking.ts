import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { data } = payload;

    // Fetch client info if available
    let clientName = 'Onbekend';
    let clientEmail = '';
    if (data?.client_id) {
      try {
        const clients = await base44.asServiceRole.entities.Client.filter({ id: data.client_id });
        if (clients?.length > 0) {
          clientName = clients[0].company_name || clients[0].contact_name || clientName;
          clientEmail = clients[0].invoice_admin_email || '';
        }
      } catch (_) {}
    }

    const serviceType = data?.service_type || 'Onbekend';
    const address = data?.address || '';
    const city = data?.city || '';
    const startDatetime = data?.start_datetime
      ? new Date(data.start_datetime).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam', dateStyle: 'full', timeStyle: 'short' })
      : 'Onbekend';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'basmichelsite@gmail.com',
      from_name: 'Bas Michel Fotografie',
      subject: `Nieuwe boeking – ${clientName}`,
      body: `
        <p>Hallo Bas,</p>
        <p>Er is een nieuwe boeking binnengekomen.</p>
        <p>
          <strong>Klant:</strong> ${clientName}${clientEmail ? ` (${clientEmail})` : ''}<br/>
          <strong>Dienst:</strong> ${serviceType}<br/>
          <strong>Datum:</strong> ${startDatetime}<br/>
          ${address ? `<strong>Adres:</strong> ${address}${city ? `, ${city}` : ''}<br/>` : ''}
          ${data?.notes ? `<strong>Opmerkingen:</strong> ${data.notes}` : ''}
        </p>
        <p>Je kunt de boeking bekijken in het admin portaal.</p>
        <p>Met vriendelijke groet,<br/>Bas Michel Fotografie</p>
      `
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});