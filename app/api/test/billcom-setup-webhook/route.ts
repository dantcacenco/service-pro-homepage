import { NextRequest, NextResponse } from 'next/server';

/**
 * Setup Bill.com Webhook Subscription
 *
 * Creates or updates webhook subscription for all invoice events
 * POST /api/test/billcom-setup-webhook
 */

const BILLCOM_API_URL = 'https://gateway.prod.bill.com/connect/v3';
const BILLCOM_WEBHOOK_API_URL = 'https://gateway.prod.bill.com/connect-events';
const BILLCOM_DEV_KEY = process.env.BILLCOM_DEV_KEY || '01CACUSCGRAVXGOA4193';
const BILLCOM_USERNAME = process.env.BILLCOM_USERNAME;
const BILLCOM_PASSWORD = process.env.BILLCOM_PASSWORD;
const BILLCOM_ORG_ID = process.env.BILLCOM_ORG_ID;
const WEBHOOK_URL = process.env.NEXT_PUBLIC_BASE_URL + '/api/billcom/webhook';

export async function POST(request: NextRequest) {
  const logs: string[] = [];

  try {
    logs.push('=== Bill.com Webhook Setup ===');
    logs.push('');

    // Step 1: Login
    logs.push('Step 1: Logging in...');
    const loginResponse = await fetch(`${BILLCOM_API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: BILLCOM_USERNAME,
        password: BILLCOM_PASSWORD,
        organizationId: BILLCOM_ORG_ID,
        devKey: BILLCOM_DEV_KEY
      })
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok || !loginData.sessionId) {
      const errorMsg = loginData.error?.message || loginData.message || JSON.stringify(loginData);
      throw new Error(`Login failed: ${errorMsg}`);
    }

    const sessionId = loginData.sessionId;
    logs.push(`✅ Login successful`);
    logs.push('');

    // Step 2: Check for existing webhook
    logs.push('Step 2: Checking for existing webhooks...');
    const existingResponse = await fetch(`${BILLCOM_WEBHOOK_API_URL}/subscriptions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'devKey': BILLCOM_DEV_KEY,
        'sessionId': sessionId
      }
    });

    const existingData = await existingResponse.json();
    const existingWebhook = existingData.subscriptions?.find((sub: any) => sub.url === WEBHOOK_URL);

    if (existingWebhook) {
      logs.push(`✅ Webhook already exists (ID: ${existingWebhook.id})`);
      logs.push(`   Active: ${existingWebhook.isActive}`);
      logs.push(`   Events: ${existingWebhook.events?.join(', ')}`);
      logs.push('');

      // Delete and recreate to ensure all events are subscribed
      logs.push('Step 3: Deleting old webhook to recreate with all events...');
      const deleteResponse = await fetch(`${BILLCOM_WEBHOOK_API_URL}/subscriptions/${existingWebhook.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'devKey': BILLCOM_DEV_KEY,
          'sessionId': sessionId
        }
      });

      if (deleteResponse.ok) {
        logs.push('✅ Old webhook deleted');
      } else {
        logs.push('⚠️  Could not delete old webhook, will try to create new one anyway');
      }
      logs.push('');
    }

    // Step 3: Create new webhook subscription with ALL invoice events
    logs.push('Step 4: Creating webhook subscription...');
    logs.push(`URL: ${WEBHOOK_URL}`);
    logs.push('');

    const webhookData = {
      url: WEBHOOK_URL,
      events: [
        'invoice.created',
        'invoice.updated',
        'invoice.sent',
        'invoice.paid',
        'invoice.partially_paid',
        'invoice.voided',
        'invoice.deleted',
        'payment.created',
        'payment.updated',
        'payment.succeeded',
        'payment.failed'
      ],
      isActive: true,
      description: 'Fair Air HC - Invoice and Payment Tracking'
    };

    const createResponse = await fetch(`${BILLCOM_WEBHOOK_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'devKey': BILLCOM_DEV_KEY,
        'sessionId': sessionId
      },
      body: JSON.stringify(webhookData)
    });

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      const errorMsg = createData.error?.message || createData.message || JSON.stringify(createData);
      throw new Error(`Failed to create webhook: ${errorMsg}`);
    }

    logs.push('✅ Webhook subscription created!');
    logs.push(`   Subscription ID: ${createData.id}`);
    logs.push(`   URL: ${createData.url}`);
    logs.push(`   Active: ${createData.isActive}`);
    logs.push(`   Events subscribed: ${createData.events?.join(', ')}`);
    if (createData.secret) {
      logs.push(`   Secret: ${createData.secret.substring(0, 20)}...`);
      logs.push('   ⚠️  Save this secret to BILLCOM_WEBHOOK_SECRET env var!');
    }
    logs.push('');

    logs.push('=== Setup Complete ===');
    logs.push('');
    logs.push('📌 Next Steps:');
    logs.push('1. Webhook is now active and will receive ALL invoice events');
    logs.push('2. This includes manual "Mark as Paid" actions');
    logs.push('3. Test by marking another invoice as paid');
    logs.push('4. Check Vercel logs: vercel logs --follow');

    return NextResponse.json({
      success: true,
      subscription: {
        id: createData.id,
        url: createData.url,
        events: createData.events,
        secret: createData.secret
      },
      logs
    });

  } catch (error) {
    logs.push('');
    logs.push(`❌ Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      logs
    }, { status: 500 });
  }
}
