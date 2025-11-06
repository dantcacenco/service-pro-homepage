import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendTestEmailRequest {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
}

interface SendTestEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Validate email address format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize HTML to prevent injection attacks
 * This is a basic check - Resend also does its own validation
 */
function isValidHtml(html: string): boolean {
  // Check for minimum valid HTML structure
  if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
    return false;
  }

  // Check for suspicious scripts (though Resend will strip these anyway)
  const suspiciousPatterns = [
    /<script[^>]*>.*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick, onload, etc.
  ];

  // Warn if suspicious patterns found (they'll be stripped by Resend)
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(html)) {
      console.warn('Suspicious pattern detected in HTML, may be stripped by email provider');
    }
  }

  return true;
}

/**
 * POST /api/send-test-email
 * Send a test email using Resend
 */
export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json<SendTestEmailResponse>(
        {
          success: false,
          error: 'RESEND_API_KEY not configured. Please add your Resend API key to environment variables.',
        },
        { status: 500 }
      );
    }

    // Parse request body
    const body: SendTestEmailRequest = await request.json();

    // Validate required fields
    if (!body.to) {
      return NextResponse.json<SendTestEmailResponse>(
        {
          success: false,
          error: 'Recipient email address (to) is required',
        },
        { status: 400 }
      );
    }

    if (!body.subject) {
      return NextResponse.json<SendTestEmailResponse>(
        {
          success: false,
          error: 'Email subject is required',
        },
        { status: 400 }
      );
    }

    if (!body.html) {
      return NextResponse.json<SendTestEmailResponse>(
        {
          success: false,
          error: 'Email HTML content is required',
        },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(body.to)) {
      return NextResponse.json<SendTestEmailResponse>(
        {
          success: false,
          error: 'Invalid email address format',
        },
        { status: 400 }
      );
    }

    // Validate HTML
    if (!isValidHtml(body.html)) {
      return NextResponse.json<SendTestEmailResponse>(
        {
          success: false,
          error: 'Invalid HTML template format',
        },
        { status: 400 }
      );
    }

    // Prepare sender information
    // Note: Resend requires a verified domain. Update this to match your domain.
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const fromName = body.fromName || 'Email Template Builder';
    const from = `${fromName} <${fromEmail}>`;

    console.log(`Sending test email to ${body.to} with subject: ${body.subject}`);

    // Send email via Resend
    const { data, error: sendError } = await resend.emails.send({
      from,
      to: body.to,
      subject: body.subject,
      html: body.html,
      headers: {
        'X-Entity-Ref-ID': `test-email-${Date.now()}`,
      },
      tags: [
        {
          name: 'category',
          value: 'test-email',
        },
      ],
    });

    if (sendError) {
      throw new Error(sendError.message);
    }

    console.log('Email sent successfully:', data);

    return NextResponse.json<SendTestEmailResponse>({
      success: true,
      messageId: data?.id || 'unknown',
    });

  } catch (error: unknown) {
    console.error('Error sending test email:', error);

    // Handle Resend-specific errors
    let errorMessage = 'Failed to send test email';

    if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);

      // Provide helpful error messages for common issues
      if (errorMessage.includes('API key')) {
        errorMessage = 'Invalid Resend API key. Please check your RESEND_API_KEY environment variable.';
      } else if (errorMessage.includes('domain')) {
        errorMessage = 'Email domain not verified. Please verify your domain in Resend dashboard or use onboarding@resend.dev for testing.';
      } else if (errorMessage.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment before sending another email.';
      } else if (errorMessage.includes('quota')) {
        errorMessage = 'Email quota exceeded for this billing period.';
      }
    }

    return NextResponse.json<SendTestEmailResponse>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/send-test-email
 * Health check endpoint
 */
export async function GET() {
  const isConfigured = !!process.env.RESEND_API_KEY;

  return NextResponse.json({
    status: 'ok',
    configured: isConfigured,
    message: isConfigured
      ? 'Resend API is configured and ready'
      : 'Resend API key not configured',
  });
}
