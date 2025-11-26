// Bill.com API Authentication with Sync Token
// More secure than username/password

const BILLCOM_SYNC_CONFIG = {
  apiUrl: 'https://app02.us.bill.com/api',
  devKey: process.env.BILLCOM_DEV_KEY || 'REDACTED_DEV_KEY',
  syncToken: process.env.BILLCOM_SYNC_TOKEN || '02NDQ-RPKOE-FQ2uz-y3XB7-KTDpR-vXJua-pUKql-8Zasr-v', // Service_Pro token
  password: process.env.BILLCOM_SYNC_PASSWORD || 'YOUR_PASSWORD_HERE', // Set this after creating password
  orgId: process.env.BILLCOM_ORG_ID || '00802NDQRPKOEFQ2uzy3'
};

// Authenticate using sync token
export async function authenticateWithSyncToken() {
  const response = await fetch(`${BILLCOM_SYNC_CONFIG.apiUrl}/v2/Login.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      devKey: BILLCOM_SYNC_CONFIG.devKey,
      syncToken: BILLCOM_SYNC_CONFIG.syncToken,
      password: BILLCOM_SYNC_CONFIG.password,
      orgId: BILLCOM_SYNC_CONFIG.orgId
    })
  });
  
  const result = await response.json();
  if (result.response_status === 0) {
    return result.response_data.sessionId;
  }
  throw new Error('Sync token authentication failed');
}

// Use this for all API calls instead of username/password auth