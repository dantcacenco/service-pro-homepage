import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/connecteam/diagnostic
 *
 * DISABLED - ConnectTeam API requires premium subscription
 */
export async function GET(request: NextRequest) {
  console.log('🚫 [API] ConnectTeam diagnostic endpoint called - DISABLED (requires premium subscription)');

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    disabled: true,
    error: 'ConnectTeam API is disabled',
    message: 'ConnectTeam API requires a premium subscription. Please upgrade your ConnectTeam plan to enable API access and diagnostics.',
    tests: [
      {
        name: 'API Access',
        status: 'DISABLED',
        message: 'ConnectTeam API requires premium subscription',
      }
    ],
  }, { status: 503 });
}

/* DISABLED - Original code below requires premium ConnectTeam subscription

function analyzeStructure(data: any, maxDepth = 3, currentDepth = 0): any {
  if (currentDepth >= maxDepth) return 'MAX_DEPTH_REACHED';

  if (data === null) return 'null';
  if (data === undefined) return 'undefined';

  const type = typeof data;

  if (type !== 'object') return type;

  if (Array.isArray(data)) {
    return {
      type: 'array',
      length: data.length,
      sample: data.length > 0 ? analyzeStructure(data[0], maxDepth, currentDepth + 1) : 'empty',
    };
  }

  const structure: any = { type: 'object', keys: Object.keys(data) };

  for (const key of structure.keys.slice(0, 10)) {
    structure[key] = analyzeStructure(data[key], maxDepth, currentDepth + 1);
  }

  return structure;
}

function GET_ORIGINAL(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    tests: [],
  };

  try {
    // Get API credentials
    const apiKey = process.env.CONNECTEAM_API_KEY;
    const apiUrl = process.env.CONNECTEAM_API_URL;

    // Test 1: Check environment variables
    diagnostics.tests.push({
      name: 'Environment Variables',
      status: apiKey && apiUrl ? 'SUCCESS' : 'FAILED',
      data: {
        hasApiKey: !!apiKey,
        hasApiUrl: !!apiUrl,
        apiKeyLength: apiKey?.length || 0,
        apiUrl: apiUrl || 'NOT SET',
        apiKeyPreview: apiKey ? apiKey.substring(0, 8) + '...' : 'NOT SET',
      },
    });

    if (!apiKey || !apiUrl) {
      return NextResponse.json(diagnostics, { status: 500 });
    }

    // Test 2: Fetch Users/Employees
    try {
      const usersResponse = await fetch(`${apiUrl}/users/v1/users`, {
        method: 'GET',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
      });

      const usersText = await usersResponse.text();
      let usersData;
      try {
        usersData = JSON.parse(usersText);
      } catch (e) {
        usersData = usersText;
      }

      diagnostics.tests.push({
        name: 'GET /users/v1/users (Employees)',
        status: usersResponse.ok ? 'SUCCESS' : 'FAILED',
        httpStatus: usersResponse.status,
        httpStatusText: usersResponse.statusText,
        url: `${apiUrl}/users/v1/users`,
        headers: Object.fromEntries(usersResponse.headers.entries()),
        rawResponse: usersData,
        responseType: typeof usersData,
        responseKeys: typeof usersData === 'object' && usersData !== null ? Object.keys(usersData) : [],
        dataStructure: analyzeStructure(usersData),
      });
    } catch (error) {
      diagnostics.tests.push({
        name: 'GET /users/v1/users (Employees)',
        status: 'ERROR',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    // Test 3: Fetch Form Submissions (Form ID: 11221823)
    try {
      const formsResponse = await fetch(
        `${apiUrl}/forms/v1/forms/11221823/form-submissions?offset=0&limit=5`,
        {
          method: 'GET',
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      const formsText = await formsResponse.text();
      let formsData;
      try {
        formsData = JSON.parse(formsText);
      } catch (e) {
        formsData = formsText;
      }

      diagnostics.tests.push({
        name: 'GET /forms/v1/forms/11221823/form-submissions (First 5)',
        status: formsResponse.ok ? 'SUCCESS' : 'FAILED',
        httpStatus: formsResponse.status,
        httpStatusText: formsResponse.statusText,
        url: `${apiUrl}/forms/v1/forms/11221823/form-submissions?offset=0&limit=5`,
        headers: Object.fromEntries(formsResponse.headers.entries()),
        rawResponse: formsData,
        responseType: typeof formsData,
        responseKeys: typeof formsData === 'object' && formsData !== null ? Object.keys(formsData) : [],
        dataStructure: analyzeStructure(formsData),
      });
    } catch (error) {
      diagnostics.tests.push({
        name: 'GET /forms/v1/forms/11221823/form-submissions',
        status: 'ERROR',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    // Test 4: Try alternate employee endpoints
    const alternateEndpoints = [
      '/users/v1/employees',
      '/employees/v1/list',
      '/v1/users',
      '/team/v1/members',
    ];

    for (const endpoint of alternateEndpoints) {
      try {
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
          },
        });

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = text;
        }

        diagnostics.tests.push({
          name: `GET ${endpoint} (Test Alternate)`,
          status: response.ok ? 'SUCCESS' : 'FAILED',
          httpStatus: response.status,
          url: `${apiUrl}${endpoint}`,
          rawResponse: data,
          dataStructure: analyzeStructure(data),
        });
      } catch (error) {
        diagnostics.tests.push({
          name: `GET ${endpoint} (Test Alternate)`,
          status: 'ERROR',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json(diagnostics);

  } catch (error) {
    console.error('Diagnostic error:', error);
    diagnostics.tests.push({
      name: 'Overall Diagnostic',
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(diagnostics, { status: 500 });
  }
}
END OF DISABLED CODE */
