/**
 * Bill.com Credentials Settings API
 * Admin-only endpoint for managing Bill.com API credentials
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getBillcomCredentials,
  saveBillcomCredentials,
  setUseDatabaseCredentials,
  testBillcomCredentials,
  getCredentialsStatus,
  type BillcomCredentials,
} from '@/lib/billcom/credentials';

/**
 * Check if user is admin/boss
 */
async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return profile?.role === 'boss' || profile?.role === 'admin';
  } catch {
    return false;
  }
}

/**
 * GET - Get current credentials status (not the actual credentials)
 */
export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const status = await getCredentialsStatus();

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error('Error getting credentials status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get status' },
      { status: 500 }
    );
  }
}

/**
 * POST - Save new credentials and optionally test them
 */
export async function POST(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, credentials, enableDatabaseCredentials } = body;

    // Action: Test credentials without saving
    if (action === 'test') {
      if (!credentials) {
        return NextResponse.json({ error: 'Credentials required for test' }, { status: 400 });
      }

      const testResult = await testBillcomCredentials(credentials as BillcomCredentials);
      return NextResponse.json({
        success: testResult.success,
        error: testResult.error,
        message: testResult.success ? 'Connection successful!' : 'Connection failed',
      });
    }

    // Action: Save credentials
    if (action === 'save') {
      if (!credentials) {
        return NextResponse.json({ error: 'Credentials required' }, { status: 400 });
      }

      const creds = credentials as BillcomCredentials;

      // Validate required fields
      if (!creds.devKey || !creds.username || !creds.password || !creds.orgId) {
        return NextResponse.json({ error: 'All credential fields are required' }, { status: 400 });
      }

      // Test credentials first
      const testResult = await testBillcomCredentials(creds);
      if (!testResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid credentials: ${testResult.error}`,
          },
          { status: 400 }
        );
      }

      // Save to database
      await saveBillcomCredentials(creds);

      // Enable database credentials if requested
      if (enableDatabaseCredentials) {
        await setUseDatabaseCredentials(true);
      }

      return NextResponse.json({
        success: true,
        message: 'Credentials saved successfully',
        usingDatabase: enableDatabaseCredentials ?? false,
      });
    }

    // Action: Toggle database credentials usage
    if (action === 'toggle-source') {
      const enabled = body.enabled === true;
      await setUseDatabaseCredentials(enabled);

      return NextResponse.json({
        success: true,
        message: enabled ? 'Now using database credentials' : 'Now using environment variables',
        usingDatabase: enabled,
      });
    }

    // Action: Get current credentials (masked)
    if (action === 'get-current') {
      try {
        const { credentials: creds, source } = await getBillcomCredentials();
        return NextResponse.json({
          success: true,
          source,
          credentials: {
            devKey: creds.devKey ? `${creds.devKey.slice(0, 4)}...${creds.devKey.slice(-4)}` : '',
            username: creds.username,
            password: '••••••••••',
            orgId: creds.orgId ? `${creds.orgId.slice(0, 4)}...${creds.orgId.slice(-4)}` : '',
            apiUrl: creds.apiUrl,
          },
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'No credentials configured',
        });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in credentials API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
