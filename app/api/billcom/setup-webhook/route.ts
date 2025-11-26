import { NextRequest, NextResponse } from 'next/server';

/**
 * Setup Bill.com Webhook Subscription
 *
 * This API route creates a webhook subscription for invoice payment events.
 * It uses the correct v3 API with connect-events base URL.
 */

const BILLCOM_USERNAME = process.env.BILLCOM_USERNAME || process.env.BILLCOM_EMAIL;
const BILLCOM_PASSWORD = process.env.BILLCOM_PASSWORD;
const BILLCOM_ORG_ID = process.env.BILLCOM_ORG_ID;
const BILLCOM_DEV_KEY = process.env.BILLCOM_DEV_KEY;
const WEBHOOK_URL = 'https://fairairhc.service-pro.app/api/billcom/webhook';

/**
 * Login to Bill.com v3 API
 */
async function loginToBillcom() {
  const response = await fetch('https://gateway.prod.bill.com/connect/v3/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: BILLCOM_USERNAME,
      password: BILLCOM_PASSWORD,
      organizationId: BILLCOM_ORG_ID,
      devKey: BILLCOM_DEV_KEY,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Login failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.sessionId;
}

/**
 * Get events catalog
 */
async function getEventsCatalog(sessionId: string) {
  const response = await fetch('https://gateway.prod.bill.com/connect-events/v3/events/catalog', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'devKey': BILLCOM_DEV_KEY!,
      'sessionId': sessionId,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to get events catalog:', error);
    return null;
  }

  return await response.json();
}

/**
 * List existing webhook subscriptions
 */
async function listSubscriptions(sessionId: string) {
  const response = await fetch('https://gateway.prod.bill.com/connect-events/v3/subscriptions', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'devKey': BILLCOM_DEV_KEY!,
      'sessionId': sessionId,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to list subscriptions:', error);
    return [];
  }

  const data = await response.json();
  return data.subscriptions || [];
}

/**
 * Create webhook subscription
 */
async function createSubscription(sessionId: string) {
  const idempotentKey = crypto.randomUUID();

  const response = await fetch('https://gateway.prod.bill.com/connect-events/v3/subscriptions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'devKey': BILLCOM_DEV_KEY!,
      'sessionId': sessionId,
      'X-Idempotent-Key': idempotentKey,
    },
    body: JSON.stringify({
      name: 'Service Pro - Payment & AP Events',
      status: { enabled: true },
      events: [
        // Payment events (AVAILABLE - for invoice payments)
        { type: 'payment.updated', version: '1' },
        { type: 'payment.failed', version: '1' },
        // Bill events (AVAILABLE - for vendor bills)
        { type: 'bill.created', version: '1' },
        { type: 'bill.updated', version: '1' },
        { type: 'bill.archived', version: '1' },
        // Vendor events (AVAILABLE - for CRM sync)
        { type: 'vendor.created', version: '1' },
        { type: 'vendor.updated', version: '1' },
        // NOTE: Invoice/customer events NOT available in webhook beta yet
        // Using cron polling for invoice status updates instead
      ],
      notificationUrl: WEBHOOK_URL,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create subscription: ${response.status} - ${error}`);
  }

  return await response.json();
}

/**
 * Send test event
 */
async function sendTestEvent(sessionId: string, subscriptionId: string) {
  const idempotentKey = crypto.randomUUID();

  const response = await fetch(
    `https://gateway.prod.bill.com/connect-events/v3/subscriptions/${subscriptionId}/test`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'devKey': BILLCOM_DEV_KEY!,
        'sessionId': sessionId,
        'X-Idempotent-Key': idempotentKey,
      },
    }
  );

  return response.ok;
}

export async function POST(request: NextRequest) {
  const logs: string[] = [];
  const log = (message: string) => {
    console.log(message);
    logs.push(message);
  };

  try {
    log('=== Bill.com Webhook Setup ===');
    log('');

    // Step 1: Login
    log('Step 1: Logging in...');
    const sessionId = await loginToBillcom();
    log('✅ Login successful');
    log('');

    // Step 2: Get events catalog
    log('Step 2: Fetching events catalog...');
    const catalog = await getEventsCatalog(sessionId);
    if (catalog) {
      log('✅ Events catalog retrieved');

      const allEvents = catalog.events || [];
      log(`   Total events available: ${allEvents.length}`);
      log('');

      // Show first 20 events to see what's available
      log('📋 Sample of available events:');
      allEvents.slice(0, 20).forEach((event: any) => {
        log(`   - ${event.type} (v${event.version})`);
      });
      log('');

      // Find invoice-related events
      const invoiceEvents = allEvents.filter((e: any) =>
        e.type?.toLowerCase().includes('invoice')
      );

      if (invoiceEvents.length > 0) {
        log('📋 Invoice-related events found:');
        invoiceEvents.forEach((event: any) => {
          log(`   - ${event.type} (v${event.version})`);
        });
        log('');
      } else {
        log('⚠️  No invoice events found in catalog');
        log('   This account may not have access to invoice webhooks');
        log('');
      }
    }

    // Step 3: List existing subscriptions
    log('Step 3: Checking for existing webhooks...');
    const subscriptions = await listSubscriptions(sessionId);

    const existingSubscription = subscriptions.find(
      (sub: any) => sub.notificationUrl === WEBHOOK_URL
    );

    if (existingSubscription) {
      log(`✅ Webhook already exists: ${existingSubscription.name}`);
      log(`   ID: ${existingSubscription.id}`);
      log(`   Status: ${existingSubscription.status?.enabled ? 'Enabled' : 'Disabled'}`);
      log('');

      // Send test event
      log('Step 4: Sending test event...');
      const testSent = await sendTestEvent(sessionId, existingSubscription.id);
      log(testSent ? '✅ Test event sent' : '⚠️ Test event may have failed');
      log('');

      return NextResponse.json({
        success: true,
        action: 'existing',
        subscription: existingSubscription,
        testSent,
        logs,
      });
    }

    // Step 4: Create new subscription
    log('Step 4: Creating webhook subscription...');
    log(`URL: ${WEBHOOK_URL}`);
    log('');

    const subscription = await createSubscription(sessionId);

    log('✅ Webhook created successfully!');
    log('');
    log('📋 Details:');
    log(`   ID: ${subscription.id}`);
    log(`   Name: ${subscription.name}`);
    log(`   Security Key: ${subscription.securityKey}`);
    log('');
    log('⚠️ IMPORTANT: Add to Vercel environment variables:');
    log(`   BILLCOM_WEBHOOK_SECRET=${subscription.securityKey}`);
    log('');

    // Step 5: Send test event
    log('Step 5: Sending test event...');
    const testSent = await sendTestEvent(sessionId, subscription.id);
    log(testSent ? '✅ Test event sent' : '⚠️ Test event may have failed');
    log('');

    return NextResponse.json({
      success: true,
      action: 'created',
      subscription,
      testSent,
      logs,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('');
    log(`❌ Setup failed: ${errorMessage}`);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        logs,
      },
      { status: 500 }
    );
  }
}

// Allow GET for testing
export async function GET(request: NextRequest) {
  return POST(request);
}
