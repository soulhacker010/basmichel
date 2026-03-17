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
            from_name: 'Bas Michel Fotografie',
            subject: `Nieuw project aangemaakt: ${projectTitle}`,
            body: `
                <p>Er is een nieuw project aangemaakt in het portaal.</p>
                <table style="border-collapse: collapse; margin: 16px 0;">
                    <tr>
                        <td style="padding: 4px 16px 4px 0; color: #666;">Projectnummer:</td>
                        <td style="padding: 4px 0;"><strong>${projectNumber}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 16px 4px 0; color: #666;">Projecttitel:</td>
                        <td style="padding: 4px 0;"><strong>${projectTitle}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 16px 4px 0; color: #666;">Klant:</td>
                        <td style="padding: 4px 0;"><strong>${clientName}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 16px 4px 0; color: #666;">Bedrijf:</td>
                        <td style="padding: 4px 0;"><strong>${companyName}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 16px 4px 0; color: #666;">E-mail klant:</td>
                        <td style="padding: 4px 0;"><strong>${clientEmail}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 16px 4px 0; color: #666;">Adres:</td>
                        <td style="padding: 4px 0;"><strong>${address}${city !== '-' ? ', ' + city : ''}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 16px 4px 0; color: #666;">Shootdatum:</td>
                        <td style="padding: 4px 0;"><strong>${shootDate}</strong></td>
                    </tr>
                </table>
                <p>Log in via het adminportaal om het project te bekijken en te beheren.</p>
            `,
        });

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});