import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();

        const projectData = payload.data;

        // Fetch client info if available
        let clientName = '-';
        let clientEmail = '-';
        let companyName = '-';

        if (projectData?.client_id) {
            const clients = await base44.asServiceRole.entities.Client.filter({ id: projectData.client_id });
            const client = clients?.[0];
            if (client) {
                companyName = client.company_name || '-';
                if (client.user_id) {
                    const users = await base44.asServiceRole.entities.User.filter({ id: client.user_id });
                    const user = users?.[0];
                    if (user) {
                        clientName = user.full_name || '-';
                        clientEmail = user.email || '-';
                    }
                }
            }
        }

        const projectTitle = projectData?.title || '-';
        const projectNumber = projectData?.project_number || '-';
        const shootDate = projectData?.shoot_date || '-';
        const address = projectData?.address || '-';
        const city = projectData?.city || '-';

        await base44.asServiceRole.integrations.Core.SendEmail({
            to: 'basmichelsite@gmail.com',
            from_name: 'Bas Michel Photography',
            subject: `Nieuw project aangemaakt: ${projectTitle}`,
            body: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#5C6B52;padding:32px 36px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Nieuw project aangemaakt</h1>
              <p style="margin:6px 0 0;color:#d4dccf;font-size:14px;">Bas Michel Photography</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 8px;font-size:15px;color:#1a1a1a;"><strong>Beste Bas,</strong></p>
              <p style="margin:0 0 24px;font-size:14px;color:#444;">Er is een nieuw project aangemaakt in het portaal. Hieronder staan de details:</p>

              <!-- Details table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:14px;">
                <tr style="border-bottom:1px solid #e5e7eb;">
                  <td style="padding:12px 16px;color:#888;width:140px;background:#fafafa;">Projectnummer</td>
                  <td style="padding:12px 16px;color:#1a1a1a;font-weight:600;">${projectNumber}</td>
                </tr>
                <tr style="border-bottom:1px solid #e5e7eb;">
                  <td style="padding:12px 16px;color:#888;background:#fafafa;">Project</td>
                  <td style="padding:12px 16px;color:#1a1a1a;font-weight:600;">${projectTitle}</td>
                </tr>
                <tr style="border-bottom:1px solid #e5e7eb;">
                  <td style="padding:12px 16px;color:#888;background:#fafafa;">Klant</td>
                  <td style="padding:12px 16px;color:#1a1a1a;font-weight:600;">${clientName}</td>
                </tr>
                <tr style="border-bottom:1px solid #e5e7eb;">
                  <td style="padding:12px 16px;color:#888;background:#fafafa;">Bedrijf</td>
                  <td style="padding:12px 16px;color:#1a1a1a;font-weight:600;">${companyName}</td>
                </tr>
                <tr style="border-bottom:1px solid #e5e7eb;">
                  <td style="padding:12px 16px;color:#888;background:#fafafa;">E-mail</td>
                  <td style="padding:12px 16px;color:#1a1a1a;font-weight:600;">${clientEmail}</td>
                </tr>
                <tr style="border-bottom:1px solid #e5e7eb;">
                  <td style="padding:12px 16px;color:#888;background:#fafafa;">Adres</td>
                  <td style="padding:12px 16px;color:#1a1a1a;font-weight:600;">${address}${city !== '-' ? ', ' + city : ''}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;color:#888;background:#fafafa;">Shootdatum</td>
                  <td style="padding:12px 16px;color:#1a1a1a;font-weight:600;">${shootDate}</td>
                </tr>
              </table>

              <!-- Button -->
              <div style="margin-top:28px;">
                <a href="https://app.base44.com/AdminProjects" style="display:inline-block;background-color:#5C6B52;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">Bekijk project</a>
              </div>


            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #f0f0f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaa;">Bas Michel Photography &bull; <a href="mailto:basmichelsite@gmail.com" style="color:#5C6B52;text-decoration:none;">basmichelsite@gmail.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
            `,
        });

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});