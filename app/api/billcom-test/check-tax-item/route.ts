// Diagnostic endpoint to list all tax items
import { NextRequest, NextResponse } from 'next/server';

const BILLCOM_CONFIG = {
  devKey: process.env.BILLCOM_DEV_KEY!,
  username: process.env.BILLCOM_USERNAME!,
  password: process.env.BILLCOM_PASSWORD!,
  orgId: process.env.BILLCOM_ORG_ID!,
  apiUrl: 'https://api.bill.com/api'
};

export async function GET(request: NextRequest) {
  try {
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

    // List all Items
    const response = await fetch(`${BILLCOM_CONFIG.apiUrl}/v2/List/Item.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        devKey: BILLCOM_CONFIG.devKey,
        sessionId: sessionId,
        data: JSON.stringify({
          start: 0,
          max: 999
        })
      }).toString(),
    });

    const data = await response.json();
    
    // Filter for tax items (itemType = 6) on client side
    const allItems = data.response_data || [];
    const taxItems = allItems.filter((item: any) => item.itemType === '6');
    const configuredItem = allItems.find((item: any) => item.id === process.env.BILLCOM_TAX_ITEM_ID);

    return NextResponse.json({
      success: data.response_status === 0,
      totalItems: allItems.length,
      taxItemsCount: taxItems.length,
      taxItems: taxItems,
      configuredId: process.env.BILLCOM_TAX_ITEM_ID,
      configuredItem: configuredItem || 'NOT FOUND',
      recommendation: taxItems.length === 0 
        ? 'No tax items exist. Need to create one with itemType: "6"'
        : 'Tax items exist. Use one of them.'
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
