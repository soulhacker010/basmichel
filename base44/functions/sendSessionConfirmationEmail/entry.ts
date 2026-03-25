import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

    const { to, clientName, dateStr, timeStr, location, notes } = await req.json();

    if (!to || !clientName || !dateStr || !timeStr) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailHtml = `<!DOCTYPE html>
<html style="font-family: Georgia, serif;">
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 20px; background: #fff; color: #2d2d2d;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="border-bottom: 2px solid #5C6B52; padding-bottom: 24px; margin-bottom: 32px;">
      <h1 style="font-size: 22px; font-weight: 400; letter-spacing: 0.05em; color: #5C6B52; margin: 0;">BAS MICHEL FOTOGRAFIE</h1>
    </div>

    <h2 style="font-size: 20px; font-weight: 400; margin-bottom: 8px;">Sessie bevestiging</h2>
    <p style="color: #666; margin-bottom: 32px; font-size: 15px;">Beste ${clientName},<br/><br/>Er is een sessie ingepland voor uw project.</p>

    <div style="background: #f9f9f7; border-left: 3px solid #5C6B52; padding: 24px; border-radius: 4px; margin-bottom: 32px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #888; font-size: 13px; width: 120px;">DATUM</td><td style="padding: 8px 0; font-size: 15px;">${dateStr}</td></tr>
        <tr><td style="padding: 8px 0; color: #888; font-size: 13px;">TIJD</td><td style="padding: 8px 0; font-size: 15px;">${timeStr}</td></tr>
        <tr><td style="padding: 8px 0; color: #888; font-size: 13px;">LOCATIE</td><td style="padding: 8px 0; font-size: 15px;">${location || 'N/A'}</td></tr>
        ${notes ? `<tr><td style="padding: 8px 0; color: #888; font-size: 13px;">NOTITIES</td><td style="padding: 8px 0; font-size: 15px;">${notes}</td></tr>` : ''}
      </table>
    </div>

    <p style="color: #888; font-size: 13px; border-top: 1px solid #eee; padding-top: 24px;">Heeft u vragen? Neem gerust contact op.</p>
  </div>
</body>
</html>`;

    await base44.integrations.Core.SendEmail({
      to: to,
      subject: `Sessie bevestiging \u2013 ${location || 'Onbekende locatie'}`,
      body: emailHtml,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to send session confirmation email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});