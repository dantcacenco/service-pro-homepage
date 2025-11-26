// Enhanced sync verification endpoint
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId');
  const verifyWithBillcom = searchParams.get('verify') === 'true';
  
  const supabase = await createClient();
  
  // Get customer from database
  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId || '')
    .single();

  if (error || !customer) {
    return NextResponse.json({
      error: 'Customer not found in database'
    }, { status: 404 });
  }

  // Basic sync status from database
  let syncStatus = {
    synced: !!customer.billcom_id,
    billcomId: customer.billcom_id,
    syncedAt: customer.billcom_sync_at,
    customerName: customer.name,
    customerEmail: customer.email,
    verified: false,
    verificationDetails: null as any
  };

  // If requested, verify with Bill.com
  if (verifyWithBillcom && customer.billcom_id) {
    const config = {
      devKey: process.env.BILLCOM_DEV_KEY,
      username: process.env.BILLCOM_USERNAME,
      password: process.env.BILLCOM_PASSWORD,
      orgId: process.env.BILLCOM_ORG_ID,
      apiUrl: process.env.BILLCOM_API_URL || 'https://app02.us.bill.com/api',
    };

    try {
      // Authenticate
      const authResponse = await fetch(`${config.apiUrl}/v2/Login.json`, {
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
      
      if (authData.response_status === 0) {
        const sessionId = authData.response_data.sessionId;
        const apiEndpoint = authData.response_data.apiEndPoint || 'https://api.bill.com/api/v2';
        
        // Verify customer exists in Bill.com
        const verifyResponse = await fetch(`${apiEndpoint}/Crud/Read/Customer.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: new URLSearchParams({
            devKey: config.devKey!,
            sessionId: sessionId,
            data: JSON.stringify({
              id: customer.billcom_id
            })
          }).toString(),
        });
        
        const verifyData = await verifyResponse.json();
        
        if (verifyData.response_status === 0 && verifyData.response_data) {
          const billcomCustomer = verifyData.response_data;
          
          // Check if names match
          const namesMatch = billcomCustomer.name === customer.name;
          const emailsMatch = billcomCustomer.email === customer.email;
          
          syncStatus.verified = true;
          syncStatus.verificationDetails = {
            existsInBillcom: true,
            billcomName: billcomCustomer.name,
            billcomEmail: billcomCustomer.email,
            billcomActive: billcomCustomer.isActive === '1',
            namesMatch: namesMatch,
            emailsMatch: emailsMatch,
            isValidSync: namesMatch && emailsMatch,
            warning: !namesMatch ? 
              `Name mismatch: DB has "${customer.name}" but Bill.com has "${billcomCustomer.name}"` : 
              !emailsMatch ? 
              `Email mismatch: DB has "${customer.email}" but Bill.com has "${billcomCustomer.email}"` : 
              null
          };
          
          // If names don't match, it's not properly synced
          if (!namesMatch) {
            syncStatus.synced = false;
          }
        } else {
          syncStatus.verified = true;
          syncStatus.verificationDetails = {
            existsInBillcom: false,
            error: 'Bill.com ID not found',
            isValidSync: false,
            warning: 'Customer marked as synced but does not exist in Bill.com'
          };
          syncStatus.synced = false;
        }
      }
    } catch (error: any) {
      syncStatus.verificationDetails = {
        error: 'Failed to verify with Bill.com',
        message: error.message
      };
    }
  }

  return NextResponse.json(syncStatus);
}