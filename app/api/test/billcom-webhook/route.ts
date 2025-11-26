import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Test endpoint for Bill.com webhooks
 *
 * This endpoint receives webhook events from Bill.com and logs them
 * for testing purposes.
 *
 * URL: https://my-dashboard-app-tau.vercel.app/api/test/billcom-webhook
 */

// Store received webhooks in memory (for testing only)
let receivedWebhooks: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-billcom-signature');

    console.log('=== Bill.com Webhook Received ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Signature:', signature);
    console.log('Payload:', payload);

    // Parse payload
    const webhookData = JSON.parse(payload);

    // Verify signature if secret is configured
    const secret = process.env.BILLCOM_WEBHOOK_SECRET;
    if (secret && signature) {
      const hmac = crypto.createHmac('sha256', secret);
      const expectedSignature = 'sha256=' + hmac.update(payload).digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

      console.log('Signature valid:', isValid);

      if (!isValid) {
        console.error('❌ Invalid signature!');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Store webhook for retrieval
    receivedWebhooks.push({
      timestamp: new Date().toISOString(),
      signature,
      data: webhookData,
      headers: Object.fromEntries(request.headers.entries())
    });

    // Keep only last 10 webhooks
    if (receivedWebhooks.length > 10) {
      receivedWebhooks = receivedWebhooks.slice(-10);
    }

    console.log('✅ Webhook processed successfully');
    console.log('Event type:', webhookData.event);
    console.log('Data:', JSON.stringify(webhookData.data, null, 2));

    return NextResponse.json({
      received: true,
      event: webhookData.event,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return received webhooks for inspection
  return NextResponse.json({
    webhooksReceived: receivedWebhooks.length,
    webhooks: receivedWebhooks,
    endpoint: '/api/test/billcom-webhook',
    status: 'listening'
  });
}
