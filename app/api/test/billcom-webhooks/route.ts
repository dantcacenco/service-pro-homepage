import { NextRequest, NextResponse } from 'next/server';

/**
 * Check Bill.com Webhook Subscriptions
 *
 * Lists all webhook subscriptions and recent events
 * GET /api/test/billcom-webhooks
 */

const BILLCOM_API_URL = 'https://gateway.prod.bill.com/connect/v3';
const BILLCOM_WEBHOOK_API_URL = 'https://gateway.prod.bill.com/connect-events';
const BILLCOM_DEV_KEY = process.env.BILLCOM_DEV_KEY || '01CACUSCGRAVXGOA4193';
const BILLCOM_USERNAME = process.env.BILLCOM_USERNAME;
const BILLCOM_PASSWORD = process.env.BILLCOM_PASSWORD;
const BILLCOM_ORG_ID = process.env.BILLCOM_ORG_ID;
const WEBHOOK_URL = process.env.NEXT_PUBLIC_BASE_URL + '/api/billcom/webhook';

export async function GET(request: NextRequest) {
  const logs: string[] = [];

  try {
    logs.push('=== Bill.com Webhook Status Check ===');
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

    // Step 2: Check webhook subscriptions
    logs.push('Step 2: Checking webhook subscriptions...');
    logs.push(`Target URL: ${WEBHOOK_URL}`);
    logs.push('');

    const webhooksResponse = await fetch(`${BILLCOM_WEBHOOK_API_URL}/subscriptions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'devKey': BILLCOM_DEV_KEY,
        'sessionId': sessionId
      }
    });

    const webhooksData = await webhooksResponse.json();

    if (webhooksData.subscriptions && webhooksData.subscriptions.length > 0) {
      logs.push(`✅ Found ${webhooksData.subscriptions.length} webhook subscription(s):`);
      logs.push('');

      webhooksData.subscriptions.forEach((sub: any, index: number) => {
        logs.push(`Subscription ${index + 1}:`);
        logs.push(`  ID: ${sub.id}`);
        logs.push(`  URL: ${sub.url}`);
        logs.push(`  Active: ${sub.isActive}`);
        logs.push(`  Events: ${sub.events?.join(', ') || 'None'}`);
        logs.push(`  Created: ${sub.createdAt || 'Unknown'}`);
        logs.push('');
      });

      // Check if our webhook URL is registered
      const ourWebhook = webhooksData.subscriptions.find((sub: any) => sub.url === WEBHOOK_URL);
      if (ourWebhook) {
        logs.push(`✅ Our webhook is registered!`);
        logs.push(`   Status: ${ourWebhook.isActive ? 'ACTIVE' : 'INACTIVE'}`);
      } else {
        logs.push(`⚠️  Our webhook URL (${WEBHOOK_URL}) is NOT registered`);
        logs.push(`   You need to create a webhook subscription`);
      }
    } else {
      logs.push('⚠️  No webhook subscriptions found');
      logs.push('   You need to create a webhook subscription to receive events');
    }

    logs.push('');
    logs.push('=== Check Complete ===');
    logs.push('');
    logs.push('📌 Note:');
    logs.push('Manual "Mark as Paid" actions in Bill.com do NOT trigger webhooks.');
    logs.push('Webhooks only fire for actual payment transactions (customer pays via link).');
    logs.push('');
    logs.push('To test webhooks:');
    logs.push('1. Send the invoice to an actual email');
    logs.push('2. Click "Pay" in the email');
    logs.push('3. Complete the payment flow');
    logs.push('4. Webhook will fire automatically');

    return NextResponse.json({
      success: true,
      webhookUrl: WEBHOOK_URL,
      subscriptions: webhooksData.subscriptions || [],
      logs
    });

  } catch (error) {
    logs.push('');
    logs.push(`❌ Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      logs
    }, { status: 500 });
  }
}
