/**
 * Bill.com Credentials Manager
 * Handles secure retrieval of Bill.com API credentials
 * Supports both environment variables (local dev) and database storage (production)
 */

import { createClient } from '@supabase/supabase-js';
import { decryptObject, encryptObject, isEncrypted } from '../encryption';

export interface BillcomCredentials {
  devKey: string;
  username: string;
  password: string;
  orgId: string;
  apiUrl?: string;
}

interface CredentialsResult {
  credentials: BillcomCredentials;
  source: 'env' | 'database';
}

/**
 * Get Supabase admin client for reading app_settings
 */
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Check if we should use database credentials
 */
async function shouldUseDatabaseCredentials(): Promise<boolean> {
  // Check environment flag first
  if (process.env.BILLCOM_USE_DATABASE_CREDENTIALS === 'true') {
    return true;
  }

  // Check database flag
  try {
    const supabase = getAdminClient();
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'billcom_use_database_credentials')
      .single();

    return data?.value === 'true';
  } catch {
    return false;
  }
}

/**
 * Get credentials from environment variables
 */
function getCredentialsFromEnv(): BillcomCredentials | null {
  const devKey = process.env.BILLCOM_DEV_KEY;
  const username = process.env.BILLCOM_USERNAME;
  const password = process.env.BILLCOM_PASSWORD;
  const orgId = process.env.BILLCOM_ORG_ID;

  if (!devKey || !username || !password || !orgId) {
    return null;
  }

  return {
    devKey,
    username,
    password,
    orgId,
    apiUrl: process.env.BILLCOM_API_URL || 'https://api.bill.com/api/v2',
  };
}

/**
 * Get credentials from database (encrypted)
 */
async function getCredentialsFromDatabase(): Promise<BillcomCredentials | null> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'billcom_credentials')
      .single();

    if (error || !data?.value) {
      return null;
    }

    // Check if value is encrypted or plain JSON
    const value = data.value;

    if (isEncrypted(value)) {
      return decryptObject<BillcomCredentials>(value);
    }

    // Try parsing as plain JSON (for backward compatibility)
    try {
      const parsed = JSON.parse(value);
      if (parsed.devKey && parsed.username && parsed.password && parsed.orgId) {
        return {
          ...parsed,
          apiUrl: parsed.apiUrl || 'https://api.bill.com/api/v2',
        };
      }
    } catch {
      // Not valid JSON
    }

    return null;
  } catch (error) {
    console.error('Error fetching credentials from database:', error);
    return null;
  }
}

/**
 * Main function: Get Bill.com credentials
 * Priority: Database (if flag set) → Environment variables → Error
 */
export async function getBillcomCredentials(): Promise<CredentialsResult> {
  // Check if we should use database credentials
  const useDatabase = await shouldUseDatabaseCredentials();

  if (useDatabase) {
    const dbCredentials = await getCredentialsFromDatabase();
    if (dbCredentials) {
      return { credentials: dbCredentials, source: 'database' };
    }
    // Fall back to env if database credentials not set
    console.warn('Database credentials flag set but no credentials found, falling back to env');
  }

  // Use environment variables
  const envCredentials = getCredentialsFromEnv();
  if (envCredentials) {
    return { credentials: envCredentials, source: 'env' };
  }

  throw new Error(
    'Bill.com credentials not found. Set environment variables or configure in Settings.'
  );
}

/**
 * Save credentials to database (encrypted)
 */
export async function saveBillcomCredentials(credentials: BillcomCredentials): Promise<void> {
  const supabase = getAdminClient();

  // Encrypt the credentials
  const encryptedValue = encryptObject(credentials);

  // Upsert to app_settings
  const { error } = await supabase.from('app_settings').upsert(
    {
      key: 'billcom_credentials',
      value: encryptedValue,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  if (error) {
    throw new Error(`Failed to save credentials: ${error.message}`);
  }
}

/**
 * Enable/disable database credentials usage
 */
export async function setUseDatabaseCredentials(enabled: boolean): Promise<void> {
  const supabase = getAdminClient();

  const { error } = await supabase.from('app_settings').upsert(
    {
      key: 'billcom_use_database_credentials',
      value: enabled ? 'true' : 'false',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  if (error) {
    throw new Error(`Failed to update setting: ${error.message}`);
  }
}

/**
 * Test Bill.com credentials by attempting login
 * Note: Login must use app02.us.bill.com, subsequent calls use api.bill.com
 */
export async function testBillcomCredentials(
  credentials: BillcomCredentials
): Promise<{ success: boolean; error?: string; sessionId?: string }> {
  try {
    // Login endpoint is always app02.us.bill.com/api/v2
    const loginUrl = 'https://app02.us.bill.com/api/v2';

    const response = await fetch(`${loginUrl}/Login.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        devKey: credentials.devKey,
        userName: credentials.username,
        password: credentials.password,
        orgId: credentials.orgId,
      }),
    });

    const data = await response.json();

    if (data.response_status === 0 && data.response_data?.sessionId) {
      return { success: true, sessionId: data.response_data.sessionId };
    }

    return {
      success: false,
      error: data.response_data?.error_message || data.response_message || 'Login failed',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Get current credentials status (for Settings UI)
 */
export async function getCredentialsStatus(): Promise<{
  hasEnvCredentials: boolean;
  hasDatabaseCredentials: boolean;
  usingDatabase: boolean;
  maskedUsername?: string;
}> {
  const envCreds = getCredentialsFromEnv();
  const dbCreds = await getCredentialsFromDatabase();
  const usingDb = await shouldUseDatabaseCredentials();

  return {
    hasEnvCredentials: !!envCreds,
    hasDatabaseCredentials: !!dbCreds,
    usingDatabase: usingDb,
    maskedUsername: usingDb
      ? dbCreds?.username
        ? `${dbCreds.username.slice(0, 3)}***`
        : undefined
      : envCreds?.username
        ? `${envCreds.username.slice(0, 3)}***`
        : undefined,
  };
}
