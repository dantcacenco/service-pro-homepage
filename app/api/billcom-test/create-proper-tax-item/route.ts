// Create a PROPER tax item with itemType = 6
import { NextRequest, NextResponse } from 'next/server';

const BILLCOM_CONFIG = {
  devKey: process.env.BILLCOM_DEV_KEY!,
  username: process.env.BILLCOM_USERNAME!,
  password: process.env.BILLCOM_PASSWORD!,
  orgId: process.env.BILLCOM_ORG_ID!,
  apiUrl: 'https://api.bill.com/api'
};

export async function POST(request: NextRequest) {
  try {
    console.log('Creating proper tax item...');
    
    // Authenticate
    const loginResponse = await fetch(`${BILLCOM_CONFIG.apiUrl}/v2/Login.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        userName: BILLCOM_CONFIG.username,
        password: BILLCOM_CONFIG.password,
        devKey: BILLCOM_CONFIG.devKey,
        orgId: BILLCOM_CONFIG.orgId,
      }).toString(),
    });

    const loginData = await loginResponse.json();
    const sessionId = loginData.response_data.sessionId;

    // Create tax item with correct type
    const itemObj = {
      entity: 'Item',
      type: '6',  // CRITICAL: 6 = Tax item (not itemType!)
      name: 'NC Sales Tax',
      description: 'North Carolina Sales Tax (will be updated per county)',
      price: 0,
      percentage: 7.0,  // Default 7%
      isActive: '1'
    };

    console.log('Creating Item with:', JSON.stringify(itemObj, null, 2));

    const response = await fetch(`${BILLCOM_CONFIG.apiUrl}/v2/Crud/Create/Item.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        devKey: BILLCOM_CONFIG.devKey,
        sessionId: sessionId,
        data: JSON.stringify({ obj: itemObj })
      }).toString(),
    });

    const data = await response.json();

    if (data.response_status !== 0) {
      return NextResponse.json({
        success: false,
        error: data.response_data?.error_message || 'Failed to create tax item',
        fullResponse: data
      }, { status: 500 });
    }

    const newTaxItem = data.response_data;

    return NextResponse.json({
      success: true,
      message: '✅ Tax item created successfully!',
      taxItem: {
        id: newTaxItem.id,
        name: newTaxItem.name,
        itemType: newTaxItem.itemType,
        percentage: newTaxItem.percentage
      },
      nextSteps: [
        '1. Copy the ID below:',
        `   ${newTaxItem.id}`,
        '',
        '2. Update .env.local:',
        `   BILLCOM_TAX_ITEM_ID=${newTaxItem.id}`,
        '',
        '3. Restart server',
        '',
        '4. Test simplified endpoint'
      ]
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
