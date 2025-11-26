import { NextResponse } from 'next/server';

/**
 * DEBUG ENDPOINT - View raw ConnectTeam API response
 * GET /api/connecteam/debug-raw-response
 */
export async function GET() {
  try {
    const CONNECTEAM_API_KEY = process.env.CONNECTEAM_API_KEY;
    const CONNECTEAM_API_URL = process.env.CONNECTEAM_API_URL || 'https://api.connecteam.com';
    const CONNECTEAM_FORM_ID = '11221823';

    if (!CONNECTEAM_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const url = `${CONNECTEAM_API_URL}/forms/v1/forms/${CONNECTEAM_FORM_ID}/form-submissions?offset=0&limit=1&sortBy=submissionDate&sortOrder=descending`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': CONNECTEAM_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `API error: ${response.status}`, details: errorText }, { status: response.status });
    }

    const data = await response.json();
    const submissions = data.data?.formSubmissions || [];
    
    if (submissions.length === 0) {
      return NextResponse.json({ message: 'No submissions found', fullResponse: data });
    }

    const firstSubmission = submissions[0];

    return NextResponse.json({
      message: 'Raw ConnectTeam submission structure',
      submission: firstSubmission,
      topLevelKeys: Object.keys(firstSubmission),
      hasManagerFields: !!firstSubmission.managerFields,
      managerFieldsStructure: firstSubmission.managerFields || 'NOT FOUND',
      answersCount: firstSubmission.answers?.length || 0,
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch', details: String(error) }, { status: 500 });
  }
}
