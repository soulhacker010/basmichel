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
        const MOLLIE_API_KEY = Deno.env.get("MOLLIE_API_KEY");

        if (!MOLLIE_API_KEY) {
            return Response.json({ error: 'Mollie API key not configured' }, { status: 500 });
        }

        const contentType = req.headers.get('content-type') || '';
        let body: any = {};
        if (contentType.includes('application/json')) {
            body = await req.json();
        } else {
            const raw = await req.text();
            const params = new URLSearchParams(raw);
            body = Object.fromEntries(params.entries());
        }

        const { action } = body;

        // ==========================
        // ACTION: createPaymentLink
        // ==========================
        if (action === 'createPaymentLink') {
            const base44 = createClientFromRequest(req);
            const user = await base44.auth.me();

            if (!user) {
                return Response.json({ error: 'Unauthorized' }, { status: 401 });
            }

            const { invoiceId, amount, description, redirectUrl } = body;

            if (!invoiceId || !amount || !description) {
                return Response.json({ error: 'Missing required fields: invoiceId, amount, description' }, { status: 400 });
            }

            // Format amount as string with 2 decimals (Mollie requires "10.00" format)
            const formattedAmount = parseFloat(amount).toFixed(2);

            // Create payment link via Mollie API
            const fallbackWebhookUrl = `${new URL(req.url).origin}/functions/molliePayment`;
            const mollieResponse = await fetch('https://api.mollie.com/v2/payment-links', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${MOLLIE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: {
                        currency: 'EUR',
                        value: formattedAmount,
                    },
                    description: description,
                    redirectUrl: redirectUrl || undefined,
                    webhookUrl: body.webhookUrl || fallbackWebhookUrl,
                }),
            });

            const mollieData = await mollieResponse.json();

            if (!mollieResponse.ok) {
                console.error('Mollie API error:', mollieData);
                return Response.json({
                    error: `Mollie error: ${mollieData.detail || mollieData.title || 'Unknown error'}`,
                    status: mollieData.status,
                }, { status: mollieResponse.status });
            }

            // Get the payment link URL from Mollie response
            const paymentLink = mollieData._links?.paymentLink?.href || mollieData._links?.self?.href;

            // Update the ProjectInvoice with the payment link info
            try {
                await base44.asServiceRole.entities.ProjectInvoice.update(invoiceId, {
                    mollie_payment_link_id: mollieData.id,
                    mollie_payment_link_url: paymentLink,
                    status: 'verzonden',
                });
            } catch (updateError) {
                console.error('Failed to update invoice with payment link:', updateError);
                // Still return success since payment link was created
            }

            return Response.json({
                success: true,
                paymentLinkId: mollieData.id,
                paymentLinkUrl: paymentLink,
            }, {
                headers: { 'Access-Control-Allow-Origin': '*' },
            });
        }

        // ==========================
        // ACTION: checkPaymentStatus
        // ==========================
        if (action === 'checkPaymentStatus') {
            const base44 = createClientFromRequest(req);
            const user = await base44.auth.me();

            if (!user) {
                return Response.json({ error: 'Unauthorized' }, { status: 401 });
            }

            const { paymentLinkId, invoiceId } = body;

            if (!paymentLinkId) {
                return Response.json({ error: 'Missing paymentLinkId' }, { status: 400 });
            }

            // Get payment link status from Mollie
            const mollieResponse = await fetch(`https://api.mollie.com/v2/payment-links/${paymentLinkId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${MOLLIE_API_KEY}`,
                },
            });

            const mollieData = await mollieResponse.json();

            if (!mollieResponse.ok) {
                return Response.json({
                    error: `Mollie error: ${mollieData.detail || 'Unknown error'}`,
                }, { status: mollieResponse.status });
            }

            // Check if payment link has been paid
            // Mollie payment link statuses: "active", "paid"
            const isPaid = mollieData.paidAt !== null && mollieData.paidAt !== undefined;

            if (isPaid && invoiceId) {
                // Update invoice status to betaald
                try {
                    await base44.asServiceRole.entities.ProjectInvoice.update(invoiceId, {
                        status: 'betaald',
                        paid_date: new Date().toISOString(),
                    });
                } catch (updateError) {
                    console.error('Failed to update invoice status:', updateError);
                }
            }

            return Response.json({
                success: true,
                status: isPaid ? 'paid' : 'active',
                paidAt: mollieData.paidAt || null,
                paymentLinkUrl: mollieData._links?.paymentLink?.href,
            }, {
                headers: { 'Access-Control-Allow-Origin': '*' },
            });
        }

        // ==========================
        // ACTION: handleWebhook (called by Mollie when payment status changes)
        // ==========================
        if (action === 'handleWebhook' || (!action && body?.id)) {
            const { id } = body; // Mollie sends the payment link ID

            if (!id) {
                return Response.json({ error: 'No id provided' }, { status: 400 });
            }

            const mollieResponse = await fetch(`https://api.mollie.com/v2/payment-links/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${MOLLIE_API_KEY}`,
                },
            });

            const mollieData = await mollieResponse.json();

            if (!mollieResponse.ok) {
                console.error('Mollie webhook verification failed:', mollieData);
                return Response.json({ error: 'Failed to verify payment' }, { status: 500 });
            }

            const isPaid = mollieData.paidAt !== null && mollieData.paidAt !== undefined;

            if (isPaid) {
                try {
                    const base44 = createClientFromRequest(req);
                    const invoices = await base44.asServiceRole.entities.ProjectInvoice.filter({
                        mollie_payment_link_id: id,
                    });
                    const invoice = invoices?.[0];
                    if (invoice) {
                        await base44.asServiceRole.entities.ProjectInvoice.update(invoice.id, {
                            status: 'betaald',
                            paid_date: new Date().toISOString(),
                        });
                    }
                } catch (updateError) {
                    console.error('Failed to update invoice from webhook:', updateError);
                }
            }

            return new Response('OK', { status: 200 });
        }

        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

    } catch (error) {
        console.error('Mollie payment function error:', error);
        return Response.json({
            error: error.message || 'Internal server error',
        }, {
            status: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
        });
    }
});
