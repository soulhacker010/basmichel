import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { data } = payload;
    const userName = data?.full_name || data?.email || 'Onbekend';
    const userEmail = data?.email || '';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'basmichelsite@gmail.com',
      from_name: 'Bas Michel Fotografie',
      subject: `Nieuw account aangemaakt – ${userName}`,
      body: `
        <p>Hallo Bas,</p>
        <p>Er heeft zich een nieuwe gebruiker aangemeld op het platform.</p>
        <p><strong>Naam:</strong> ${userName}<br/>
        <strong>E-mail:</strong> ${userEmail}</p>
        <p>Je kunt de gebruiker bekijken in het admin portaal.</p>
        <p>Met vriendelijke groet,<br/>Bas Michel Fotografie</p>
      `
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});