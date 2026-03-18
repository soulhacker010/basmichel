import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// This function is called daily to send invoice reminders for unpaid invoices that are 14 days old.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Use service role since this is a scheduled/admin task
    const allInvoices = await base44.asServiceRole.entities.ProjectInvoice.list();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let remindedCount = 0;

    for (const invoice of allInvoices) {
      // Only process invoices that are sent (verzonden) and not yet paid
      if (invoice.status !== 'verzonden') continue;

      // Only send reminder if not already sent (use reminder_sent field on project)
      const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
      if (!dueDate) continue;
      dueDate.setHours(0, 0, 0, 0);

      // Check if due date has passed (overdue) or is today
      if (dueDate > today) continue;

      // Check if reminder was already sent
      if (invoice.reminder_sent) continue;

      // Get client email
      let clientEmail = invoice.client_email || '';
      let clientName = invoice.client_name || 'klant';

      // Also try to get email from user linked to client
      if (!clientEmail && invoice.client_id) {
        try {
          const clients = await base44.asServiceRole.entities.Client.filter({ id: invoice.client_id });
          if (clients?.length > 0) {
            const client = clients[0];
            if (client.user_id) {
              const users = await base44.asServiceRole.entities.User.filter({ id: client.user_id });
              if (users?.length > 0) {
                clientEmail = users[0].email || '';
                clientName = users[0].full_name || clientName;
              }
            }
          }
        } catch (_) {}
      }

      if (!clientEmail) continue;

      const invoiceNumber = invoice.invoice_number || '-';
      const totalAmount = invoice.total_amount ? `€ ${invoice.total_amount.toFixed(2)}` : '-';
      const dueDateFormatted = dueDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: clientEmail,
        from_name: 'Bas Michel Fotografie',
        subject: `Herinnering: openstaande factuur ${invoiceNumber}`,
        body: `
          <p>Beste ${clientName},</p>
          <p>Dit is een vriendelijke herinnering dat onderstaande factuur nog openstaat.</p>
          <table style="border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 4px 16px 4px 0; color: #666;">Factuurnummer:</td>
              <td style="padding: 4px 0;"><strong>${invoiceNumber}</strong></td>
            </tr>
            <tr>
              <td style="padding: 4px 16px 4px 0; color: #666;">Bedrag:</td>
              <td style="padding: 4px 0;"><strong>${totalAmount}</strong></td>
            </tr>
            <tr>
              <td style="padding: 4px 16px 4px 0; color: #666;">Vervaldatum:</td>
              <td style="padding: 4px 0;"><strong>${dueDateFormatted}</strong></td>
            </tr>
          </table>
          <p>Log in via het portaal om de factuur te bekijken en te betalen.</p>
          <p><em>Dit is een automatische e-mail — reageren heeft geen effect.</em></p>
          <p>Met vriendelijke groet,<br/>Bas Michel Fotografie</p>
        `
      });

      // Mark reminder as sent
      await base44.asServiceRole.entities.ProjectInvoice.update(invoice.id, { reminder_sent: true });
      remindedCount++;
    }

    return Response.json({ success: true, remindedCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});