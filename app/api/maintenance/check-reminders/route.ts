import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  console.log('[Maintenance Reminders] API endpoint called');
  
  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Maintenance Reminders] Missing environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('[Maintenance Reminders] Missing Resend API key');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Create service client for database operations
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if maintenance reminders are globally enabled
    const { data: globalEnabled } = await serviceClient
      .from('app_settings')
      .select('value')
      .eq('key', 'maintenance_reminders_enabled')
      .single();

    if (globalEnabled?.value !== 'true') {
      console.log('[Maintenance Reminders] Globally disabled');
      return NextResponse.json({
        success: true,
        message: 'Maintenance reminders are globally disabled',
        processed: 0
      });
    }

    // Get email template
    const { data: templateData } = await serviceClient
      .from('app_settings')
      .select('value')
      .eq('key', 'maintenance_email_template')
      .single();

    const emailTemplate = templateData?.value || 'Maintenance is due. Please schedule an appointment.';

    // Find customers with due maintenance reminders
    const { data: dueCustomers, error: fetchError } = await serviceClient
      .from('customers')
      .select('*')
      .eq('maintenance_enabled', true)
      .lte('next_maintenance_due', new Date().toISOString())
      .not('next_maintenance_due', 'is', null);

    if (fetchError) {
      console.error('[Maintenance Reminders] Database error:', fetchError);
      console.error('Query details:', {
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
        code: fetchError.code
      });
      return NextResponse.json(
        { 
          error: 'Failed to fetch due customers',
          details: fetchError.message 
        },
        { status: 500 }
      );
    }

    if (!dueCustomers || dueCustomers.length === 0) {
      console.log('[Maintenance Reminders] No due reminders');
      return NextResponse.json({
        success: true,
        message: 'No maintenance reminders due',
        processed: 0
      });
    }

    console.log(`[Maintenance Reminders] Found ${dueCustomers.length} due reminders`);

    let sentCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    // Process each customer
    for (const customer of dueCustomers) {
      try {
        // Prepare email content
        const emailContent = emailTemplate
          .replace('{{customer_name}}', customer.name || 'Valued Customer')
          .replace('{{business_name}}', 'Fair Air HVAC');

        // Send email
        const { error: emailError } = await resend.emails.send({
          from: process.env.EMAIL_FROM || 'noreply@fairairhc.service-pro.app',
          to: customer.email,
          subject: 'HVAC Maintenance Reminder',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Maintenance Reminder</h2>
              <div style="white-space: pre-wrap; line-height: 1.6; color: #555;">
                ${emailContent}
              </div>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                This is an automated reminder. To update your preferences, please contact us.
              </p>
            </div>
          `,
          replyTo: process.env.REPLY_TO_EMAIL || process.env.BUSINESS_EMAIL
        });

        if (emailError) {
          throw emailError;
        }

        // Calculate next due date
        const nextDue = calculateNextDue(customer.maintenance_frequency);

        // Update customer record
        await serviceClient
          .from('customers')
          .update({
            last_maintenance_sent: new Date().toISOString(),
            next_maintenance_due: nextDue
          })
          .eq('id', customer.id);

        // Log success
        await serviceClient
          .from('maintenance_reminder_log')
          .insert({
            customer_id: customer.id,
            email_sent_to: customer.email,
            status: 'sent',
            next_scheduled: nextDue
          });

        sentCount++;
        console.log(`[Maintenance Reminders] Sent to ${customer.email}`);

      } catch (error: any) {
        // Log failure
        await serviceClient
          .from('maintenance_reminder_log')
          .insert({
            customer_id: customer.id,
            email_sent_to: customer.email,
            status: 'failed',
            error_message: error.message || 'Unknown error'
          });

        failedCount++;
        errors.push({
          customer: customer.email,
          error: error.message
        });
        console.error(`[Maintenance Reminders] Failed for ${customer.email}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${dueCustomers.length} reminders`,
      sent: sentCount,
      failed: failedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('[Maintenance Reminders] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate next due date
function calculateNextDue(frequency: string): string {
  const now = new Date();
  
  switch (frequency) {
    case '5_minutes':
      return new Date(now.getTime() + 5 * 60 * 1000).toISOString();
    case '6_months':
      const sixMonths = new Date(now);
      sixMonths.setMonth(sixMonths.getMonth() + 6);
      return sixMonths.toISOString();
    case '12_months':
      const oneYear = new Date(now);
      oneYear.setFullYear(oneYear.getFullYear() + 1);
      return oneYear.toISOString();
    default:
      const defaultSix = new Date(now);
      defaultSix.setMonth(defaultSix.getMonth() + 6);
      return defaultSix.toISOString();
  }
}
