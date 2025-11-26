// Debug Bill.com Authentication - Try multiple approaches
import { NextResponse } from 'next/server';

export async function POST() {
  console.log('🔍 DEBUG: Testing Bill.com Authentication with multiple approaches...');
  
  const config = {
    devKey: process.env.BILLCOM_DEV_KEY,
    username: process.env.BILLCOM_USERNAME,
    password: process.env.BILLCOM_PASSWORD,
    orgId: process.env.BILLCOM_ORG_ID,
    configuredUrl: process.env.BILLCOM_API_URL || 'https://gateway.stage.bill.com',
  };

  const results: any[] = [];

  // Test 1: Try PRODUCTION API v2 (api.bill.com)
  const productionV2Url = 'https://api.bill.com';
  try {
    console.log('Test 1: Trying production v2 API:', productionV2Url);
    const formData = new URLSearchParams({
      userName: config.username!,
      password: config.password!,
      devKey: config.devKey!,
      orgId: config.orgId!,
    });
    
    const response = await fetch(`${productionV2Url}/v2/Login.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    const text = await response.text();
    console.log('Production v2 response:', text.substring(0, 200));
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { rawText: text.substring(0, 500), isHTML: text.trim().startsWith('<') };
    }

    results.push({
      test: 'Production API v2 (api.bill.com)',
      url: `${productionV2Url}/v2/Login.json`,
      status: response.status,
      success: response.ok,
      response: data,
    });
  } catch (error: any) {
    results.push({
      test: 'Production API v2 (api.bill.com)',
      url: productionV2Url,
      error: error.message,
    });
  }

  // Test 2: Try app.bill.com endpoint
  const appBillUrl = 'https://app.bill.com';
  try {
    console.log('Test 2: Trying app.bill.com:', appBillUrl);
    const formData = new URLSearchParams({
      userName: config.username!,
      password: config.password!,
      devKey: config.devKey!,
      orgId: config.orgId!,
    });
    
    const response = await fetch(`${appBillUrl}/api/v2/Login.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { rawText: text.substring(0, 500), isHTML: text.trim().startsWith('<') };
    }

    results.push({
      test: 'App.bill.com API',
      url: `${appBillUrl}/api/v2/Login.json`,
      status: response.status,
      success: response.ok,
      response: data,
    });
  } catch (error: any) {
    results.push({
      test: 'App.bill.com API',
      url: appBillUrl,
      error: error.message,
    });
  }

  // Test 3: Try gateway.bill.com with v2 API
  const gatewayUrl = 'https://gateway.bill.com';
  try {
    console.log('Test 3: Trying gateway.bill.com v2:', gatewayUrl);
    const formData = new URLSearchParams({
      userName: config.username!,
      password: config.password!,
      devKey: config.devKey!,
      orgId: config.orgId!,
    });
    
    const response = await fetch(`${gatewayUrl}/api/v2/Login.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { rawText: text.substring(0, 500) };
    }

    results.push({
      test: 'Gateway.bill.com v2 API',
      url: `${gatewayUrl}/api/v2/Login.json`,
      status: response.status,
      success: response.ok,
      response: data,
    });
  } catch (error: any) {
    results.push({
      test: 'Gateway.bill.com v2 API',
      error: error.message,
    });
  }

  // Test 4: Try with just username/password (no devKey) to test basic auth
  try {
    console.log('Test 4: Trying basic auth without devKey');
    const formData = new URLSearchParams({
      userName: config.username!,
      password: config.password!,
      orgId: config.orgId!,
    });
    
    const response = await fetch(`https://api.bill.com/v2/Login.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { rawText: text.substring(0, 500), isHTML: text.trim().startsWith('<') };
    }

    results.push({
      test: 'Basic Auth (no devKey)',
      url: 'https://api.bill.com/v2/Login.json',
      status: response.status,
      success: response.ok,
      response: data,
      note: 'Testing if account works without API key',
    });
  } catch (error: any) {
    results.push({
      test: 'Basic Auth (no devKey)',
      error: error.message,
    });
  }

  // Test 5: Check if production API is reachable
  try {
    console.log('Test 5: Production API connectivity test');
    const response = await fetch(`https://api.bill.com/`, {
      method: 'GET',
    });

    const text = await response.text();
    results.push({
      test: 'Production API Connectivity',
      url: `https://api.bill.com/`,
      status: response.status,
      response: text.substring(0, 200),
      isHTML: text.trim().startsWith('<'),
    });
  } catch (error: any) {
    results.push({
      test: 'Production API Connectivity',
      error: error.message,
    });
  }

  // Find successful authentication
  const successful = results.find(r => r.success);
  
  return NextResponse.json({
    success: !!successful,
    message: successful 
      ? `Authentication successful using: ${successful.test}` 
      : 'All authentication attempts failed',
    credentials: {
      hasDevKey: !!config.devKey,
      devKeyStart: config.devKey?.substring(0, 8),
      username: config.username,
      orgId: config.orgId,
      configuredUrl: config.configuredUrl,
    },
    results: results,
  });
}