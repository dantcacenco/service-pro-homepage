// Test Bill.com Customer Operations
import { NextResponse } from 'next/server';

export async function GET() {
  console.log('📋 Listing Bill.com Customers...');

  const config = {
    devKey: process.env.BILLCOM_DEV_KEY,
    username: process.env.BILLCOM_USERNAME,
    password: process.env.BILLCOM_PASSWORD,
    orgId: process.env.BILLCOM_ORG_ID,
    apiUrl: process.env.BILLCOM_API_URL || 'https://app02.us.bill.com/api',
  };

  try {
    // Step 1: Authenticate
    const loginUrl = `${config.apiUrl}/v2/Login.json`;
    
    const authResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        userName: config.username!,
        password: config.password!,
        devKey: config.devKey!,
        orgId: config.orgId!,
      }).toString(),
    });

    const authData = await authResponse.json();

    if (authData.response_status !== 0) {
      return NextResponse.json({
        error: 'Authentication failed',
        details: authData,
      }, { status: 401 });
    }

    const sessionId = authData.response_data.sessionId;
    const apiEndpoint = authData.response_data.apiEndPoint || 'https://api.bill.com/api/v2';

    console.log('Session obtained, listing customers...');

    // Step 2: List all customers
    // First, try without any parameters to see what happens
    const listResponse = await fetch(`${apiEndpoint}/List/Customer.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        devKey: config.devKey!,
        sessionId: sessionId,
      }).toString(),
    });

    const listText = await listResponse.text();
    console.log('List response:', listText.substring(0, 500));

    let listData;
    try {
      listData = JSON.parse(listText);
    } catch (e) {
      // If parsing fails, try with pagination parameters
      console.log('First attempt failed, trying with pagination...');
      
      const paginatedResponse = await fetch(`${apiEndpoint}/List/Customer.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          devKey: config.devKey!,
          sessionId: sessionId,
          start: '0',
          max: '100',
        }).toString(),
      });

      const paginatedText = await paginatedResponse.text();
      listData = JSON.parse(paginatedText);
    }

    if (listData.response_status !== 0) {
      return NextResponse.json({
        error: 'Failed to list customers',
        details: listData,
        note: 'The List/Customer endpoint might require different parameters',
      }, { status: 400 });
    }

    const customers = listData.response_data || [];
    
    return NextResponse.json({
      success: true,
      totalCount: customers.length,
      customers: customers.slice(0, 10), // Return first 10 for display
      sample: customers.length > 0 ? {
        firstCustomer: {
          id: customers[0].id,
          name: customers[0].name,
          email: customers[0].email,
          companyName: customers[0].companyName,
        }
      } : null,
      message: `Found ${customers.length} customers in Bill.com`,
      note: 'Showing first 10 customers. Full list available in response_data.',
    });

  } catch (error: any) {
    console.error('List customers error:', error);
    return NextResponse.json({
      error: 'Failed to list customers',
      details: error.message,
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('👤 Creating Bill.com Customer...');
  
  const body = await request.json();
  const { name, email, companyName, phone, address, city, state, zipCode } = body;

  const config = {
    devKey: process.env.BILLCOM_DEV_KEY,
    username: process.env.BILLCOM_USERNAME,
    password: process.env.BILLCOM_PASSWORD,
    orgId: process.env.BILLCOM_ORG_ID,
    apiUrl: process.env.BILLCOM_API_URL || 'https://app02.us.bill.com/api',
  };

  try {
    // Step 1: Authenticate
    const loginUrl = `${config.apiUrl}/v2/Login.json`;
    
    const authResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        userName: config.username!,
        password: config.password!,
        devKey: config.devKey!,
        orgId: config.orgId!,
      }).toString(),
    });

    const authData = await authResponse.json();

    if (authData.response_status !== 0) {
      return NextResponse.json({
        error: 'Authentication failed',
        details: authData,
      }, { status: 401 });
    }

    const sessionId = authData.response_data.sessionId;
    const apiEndpoint = authData.response_data.apiEndPoint || 'https://api.bill.com/api/v2';

    // Step 2: Create customer with all available fields
    const customerObj = {
      entity: 'Customer',
      isActive: '1',
      name: name || 'New Customer ' + Date.now(),
      email: email,
      companyName: companyName,
      firstName: name?.split(' ')[0],
      lastName: name?.split(' ')[1] || '',
      phone: phone,
      address1: address,
      city: city,
      state: state,
      zipCode: zipCode,
      // Additional fields that might be required
      customerAccountNumber: 'CUST-' + Date.now(),
      terms: 'Due on Receipt',
    };

    console.log('Creating customer with data:', customerObj);

    const createResponse = await fetch(`${apiEndpoint}/Crud/Create/Customer.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        devKey: config.devKey!,
        sessionId: sessionId,
        obj: JSON.stringify(customerObj),
      }).toString(),
    });

    const createText = await createResponse.text();
    console.log('Create response:', createText);

    let createData;
    try {
      createData = JSON.parse(createText);
    } catch (e) {
      return NextResponse.json({
        error: 'Invalid response from Bill.com',
        response: createText.substring(0, 500),
      }, { status: 400 });
    }

    if (createData.response_status !== 0) {
      // If creation fails due to duplicate, try to find the existing customer
      if (createData.response_message?.includes('duplicate') || 
          createData.response_message?.includes('already exists')) {
        
        console.log('Customer might exist, searching...');
        
        // Search for existing customer by email
        const searchResponse = await fetch(`${apiEndpoint}/List/Customer.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: new URLSearchParams({
            devKey: config.devKey!,
            sessionId: sessionId,
            filters: JSON.stringify([
              { field: 'email', op: '=', value: email }
            ]),
          }).toString(),
        });

        const searchData = await searchResponse.json();
        
        if (searchData.response_status === 0 && searchData.response_data?.length > 0) {
          const existingCustomer = searchData.response_data[0];
          return NextResponse.json({
            success: true,
            message: 'Customer already exists',
            customer: existingCustomer,
            isExisting: true,
          });
        }
      }

      return NextResponse.json({
        error: createData.response_message || 'Failed to create customer',
        details: createData,
        customerData: customerObj,
      }, { status: 400 });
    }

    // Success!
    const createdCustomer = createData.response_data;
    
    return NextResponse.json({
      success: true,
      message: 'Customer created successfully',
      customer: createdCustomer,
      isNew: true,
    });

  } catch (error: any) {
    console.error('Customer operation error:', error);
    return NextResponse.json({
      error: 'Failed to create customer',
      details: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
