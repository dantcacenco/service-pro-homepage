// Test Bill.com Authentication
import { NextResponse } from 'next/server';

export async function POST() {
  console.log('🔐 Testing Bill.com Authentication...');
  
  const config = {
    devKey: process.env.BILLCOM_DEV_KEY,
    username: process.env.BILLCOM_USERNAME,
    password: process.env.BILLCOM_PASSWORD,
    orgId: process.env.BILLCOM_ORG_ID,
    apiUrl: process.env.BILLCOM_API_URL || 'https://app.bill.com/api',
    apiEndpoint: process.env.BILLCOM_API_ENDPOINT || 'https://api.bill.com/api/v2',
  };

  console.log('Config check:', {
    hasDevKey: !!config.devKey,
    hasUsername: !!config.username,
    hasPassword: !!config.password,
    hasOrgId: !!config.orgId,
    apiUrl: config.apiUrl,
  });

  if (!config.devKey || !config.username || !config.password || !config.orgId) {
    return NextResponse.json({
      error: 'Missing Bill.com credentials in environment variables',
      missing: {
        devKey: !config.devKey,
        username: !config.username,
        password: !config.password,
        orgId: !config.orgId,
      }
    }, { status: 400 });
  }

  try {
    // Use the working production endpoint - app02.us.bill.com for this account
    const loginUrl = `${config.apiUrl}/v2/Login.json`;
    console.log('Attempting login to:', loginUrl);
    console.log('Using credentials:', {
      username: config.username,
      orgId: config.orgId,
      apiUrl: config.apiUrl,
    });

    // Production API uses form-encoded data
    const formData = new URLSearchParams({
      userName: config.username,  // Note: userName not username for v2
      password: config.password,
      devKey: config.devKey,
      orgId: config.orgId,
    });
    
    console.log('Request data (without password):', {
      userName: config.username,
      devKey: config.devKey?.substring(0, 8) + '***',
      orgId: config.orgId,
    });

    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response text (first 200 chars):', responseText.substring(0, 200));

    // Check if response is HTML (error page) or JSON
    const isHTML = responseText.trim().startsWith('<');
    
    if (isHTML) {
      console.error('Received HTML response instead of JSON');
      return NextResponse.json({
        error: 'Invalid response from Bill.com - received HTML instead of JSON',
        hint: 'This usually means the API URL is incorrect',
        responsePreview: responseText.substring(0, 200),
        triedUrl: loginUrl,
        status: response.status,
      }, { status: 500 });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', e);
      return NextResponse.json({
        error: 'Invalid JSON response from Bill.com',
        responseText: responseText.substring(0, 500),
        status: response.status,
      }, { status: 500 });
    }

    // Check for Bill.com API errors (v2 API format)
    if (data.response_status !== 0) {
      console.error('Bill.com API error:', data);
      return NextResponse.json({
        error: data.response_message || 'Authentication failed',
        details: data,
        status: 400,
      }, { status: 400 });
    }

    // Extract session data from response_data
    const sessionData = data.response_data;
    if (!sessionData || !sessionData.sessionId) {
      console.error('No session data in response:', data);
      return NextResponse.json({
        error: 'Invalid response structure from Bill.com',
        details: data,
        status: 500,
      }, { status: 500 });
    }

    // Note: In production, use proper session management
    // For this test endpoint, we just return the session data

    console.log('Authentication successful!');
    console.log('Session ID:', sessionData.sessionId);
    console.log('API Endpoint:', sessionData.apiEndPoint);

    return NextResponse.json({
      success: true,
      sessionId: sessionData.sessionId,
      apiEndPoint: sessionData.apiEndPoint,
      orgId: sessionData.orgId,
      usersId: sessionData.usersId,
      expiresIn: '30 minutes',
      data: data,
    });

  } catch (error: any) {
    console.error('Authentication error:', error);
    return NextResponse.json({
      error: 'Failed to authenticate with Bill.com',
      details: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}