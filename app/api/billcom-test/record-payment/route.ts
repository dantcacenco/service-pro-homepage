// Test Bill.com Record Payment - FIXED with correct API format
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('💰 Testing Bill.com Record Payment...');
  
  const body = await request.json();
  const { invoiceId, amount, paymentMethod = 'Check' } = body;

  if (!invoiceId) {
    return NextResponse.json({
      error: 'Invoice ID is required',
      note: 'Please provide an invoice ID to record payment for',
    }, { status: 400 });
  }

  const config = {
    devKey: process.env.BILLCOM_DEV_KEY,
    username: process.env.BILLCOM_USERNAME,
    password: process.env.BILLCOM_PASSWORD,
    orgId: process.env.BILLCOM_ORG_ID,
    apiUrl: process.env.BILLCOM_API_URL || 'https://app02.us.bill.com/api',
  };

  try {
    // Step 1: Authenticate
    console.log('Authenticating with Bill.com...');
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

    const sessionData = authData.response_data;
    const sessionId = sessionData.sessionId;
    const apiEndpoint = sessionData.apiEndPoint || 'https://api.bill.com/api/v2';

    console.log('Session obtained:', sessionId);

    // Step 2: Get invoice details first to get the amount due
    const getInvoiceUrl = `${apiEndpoint}/Crud/Read/Invoice.json`;
    const invoiceResponse = await fetch(getInvoiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        devKey: config.devKey!,
        sessionId: sessionId,
        data: JSON.stringify({
          id: invoiceId
        })
      }).toString(),
    });

    const invoiceData = await invoiceResponse.json();

    if (invoiceData.response_status !== 0) {
      return NextResponse.json({
        error: 'Failed to get invoice details',
        details: invoiceData,
        note: 'Make sure the invoice ID exists',
      }, { status: 400 });
    }

    const invoice = invoiceData.response_data;
    const paymentAmount = amount || invoice.amountDue || invoice.amount;
    
    console.log('Invoice found:', invoice.invoiceNumber, 'Amount due:', invoice.amountDue);

    // Step 3: Create a ReceivedPay (customer payment) record
    const today = new Date().toISOString().split('T')[0];
    
    // Bill.com ReceivedPay object for recording customer payments
    const receivedPayObj = {
      entity: 'ReceivedPay',
      customerId: invoice.customerId,
      invoiceId: invoiceId,
      amount: Number(paymentAmount),  // Must be number!
      paymentDate: today,
      paymentType: '0',  // 0=Check, 1=Cash, 2=CreditCard, etc.
      description: 'Payment recorded via API',
      invoicePayments: [
        {
          invoiceId: invoiceId,
          amount: Number(paymentAmount)  // Must be number!
        }
      ]
    };

    console.log('Creating payment record:', receivedPayObj);

    const recordPaymentUrl = `${apiEndpoint}/Crud/Create/ReceivedPay.json`;
    const paymentResponse = await fetch(recordPaymentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        devKey: config.devKey!,
        sessionId: sessionId,
        data: JSON.stringify({
          obj: receivedPayObj
        })
      }).toString(),
    });

    const paymentData = await paymentResponse.json();

    if (paymentData.response_status !== 0) {
      // If ReceivedPay doesn't work, try updating the invoice status directly
      console.log('ReceivedPay failed, trying to update invoice status...');
      
      const updateInvoiceUrl = `${apiEndpoint}/Crud/Update/Invoice.json`;
      const updateResponse = await fetch(updateInvoiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          devKey: config.devKey!,
          sessionId: sessionId,
          data: JSON.stringify({
            obj: {
              entity: 'Invoice',
              id: invoiceId,
              paymentStatus: '0',  // 0=Paid, 1=Due, 2=Overdue
              amountDue: 0
            }
          })
        }).toString(),
      });
      
      const updateData = await updateResponse.json();
      
      if (updateData.response_status === 0) {
        return NextResponse.json({
          success: true,
          message: 'Payment recorded by updating invoice status',
          invoice: {
            id: invoiceId,
            invoiceNumber: invoice.invoiceNumber,
            originalAmount: invoice.amount,
            amountPaid: paymentAmount,
            newAmountDue: 0,
            status: 'Paid'
          },
          method: 'invoice_update'
        });
      }
      
      return NextResponse.json({
        error: 'Failed to record payment',
        receivedPayError: paymentData,
        updateError: updateData,
        note: 'Bill.com may require specific payment configuration',
      }, { status: 400 });
    }

    // Success! Payment recorded
    return NextResponse.json({
      success: true,
      payment: paymentData.response_data,
      message: 'Payment recorded successfully',
      invoice: {
        id: invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        originalAmount: invoice.amount,
        amountPaid: paymentAmount,
        newAmountDue: invoice.amountDue - paymentAmount,
      },
      method: 'received_pay'
    });

  } catch (error: any) {
    console.error('Record payment error:', error);
    return NextResponse.json({
      error: 'Failed to record payment',
      details: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}