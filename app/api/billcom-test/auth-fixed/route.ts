// Fixed Bill.com Authentication
import { NextResponse } from 'next/server';

export async function POST() {
  console.log('🔐 Testing Bill.com Authentication (Fixed)...');
  
  const config = {
    devKey: process.env.BILLCOM_DEV_KEY,
    username: process.env.BILLCOM_USERNAME,
    password: process.env.BILLCOM_PASSWORD,
    orgId: process.env.BILLCOM_ORG_ID,
    // Use app.bill.com for authentication as documented
    apiUrl: process.env.BILLCOM_API_URL || 'https://app.bill.com/api',
  };

  console.log('Config check:', {
    hasDevKey: !!config.devKey,
    hasUsername: !!config.username,
    hasPassword: !!config.password,
    hasOrgId: !!config.orgId,
    orgId: config.orgId,
    apiUrl: config.apiUrl,
  });

  if (!config.devKey || !config.username || !config.password) {
    return NextResponse.json({
      error: 'Missing Bill.com credentials in environment variables',
      missing: {
        devKey: !config.devKey,
        username: !config.username,
        password: !config.password,
      }
    }, { status: 400 });
  }

  try {
    const loginUrl = `${config.apiUrl}/v2/Login.json`;
    console.log('Attempting login to:', loginUrl);
    
    // IMPORTANT: Don't send orgId if it's causing issues
    // Bill.com will use the default org for the user
    const formData = new URLSearchParams({
      userName: config.username,
      password: config.password,
      devKey: config.devKey,
      // Only include orgId if it's not the problematic one
      ...(config.orgId && config.orgId !== '00802NDQRPKOEFQ2uzy3' 
        ? { orgId: config.orgId } 
        : {})
    });
    
    console.log('Request data (without password):', {
      userName: config.username,
      devKey: config.devKey?.substring(0, 8) + '***',
      orgIdIncluded: formData.has('orgId'),
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
      
      // If we get an error about missing orgId, return helpful message
      if (data.response_message?.includes('Organization')) {
        return NextResponse.json({
          error: 'Organization issue detected',
          message: 'The Bill.com account may not be properly configured. Please check your Bill.com account settings.',
          details: data,
          suggestion: 'Try logging into Bill.com directly to verify your account is active and has an organization set up.',
        }, { status: 400 });
      }
      
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

    // Check if the returned orgId is all zeros (invalid)
    const isInvalidOrgId = sessionData.orgId === '00000000000000000000';
    
    // Note: In production, use proper session management
    // For this test endpoint, we just return the session data

    console.log('Authentication successful!');
    console.log('Session ID:', sessionData.sessionId);
    console.log('API Endpoint:', sessionData.apiEndPoint);
    console.log('Returned OrgId:', sessionData.orgId);
    
    if (isInvalidOrgId) {
      console.warn('⚠️ WARNING: Bill.com returned invalid orgId (all zeros)');
      console.warn('This may indicate an account configuration issue.');
    }

    return NextResponse.json({
      success: true,
      sessionId: sessionData.sessionId,
      apiEndPoint: sessionData.apiEndPoint,
      orgId: sessionData.orgId,
      usersId: sessionData.usersId,
      expiresIn: '30 minutes',
      data: data,
      warning: isInvalidOrgId ? 'Bill.com returned an invalid organization ID. This may cause API calls to fail.' : null,
      suggestion: isInvalidOrgId ? 'Please verify your Bill.com account is properly configured with an active organization.' : null,
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
