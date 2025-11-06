import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface EditTemplateRequest {
  html: string;
  editRequest: string;
}

interface EditTemplateResponse {
  html: string;
  changes: string;
}

/**
 * Parse natural language edit requests and apply them to HTML template
 */
async function editTemplate(html: string, editRequest: string): Promise<EditTemplateResponse> {
  const editPrompt = `You are an expert email template editor. You will receive an HTML email template and a natural language edit request. Your job is to modify the HTML according to the request while maintaining email compatibility.

CRITICAL REQUIREMENTS:
1. ONLY use inline CSS (no <style> tags, no external stylesheets)
2. Maintain table-based layout for email compatibility
3. Preserve all DOCTYPE and meta tags
4. Keep the overall structure intact unless specifically requested to change it
5. Ensure all colors are valid hex codes or rgb/rgba values
6. Make sure buttons remain clickable with proper href attributes
7. Keep the template mobile-responsive

Current HTML Template:
${html}

Edit Request: "${editRequest}"

Common edit patterns to recognize:
- "make header blue" → change header background-color to blue (#0000FF or appropriate shade)
- "larger text" → increase font-size in relevant elements
- "add logo at top" → add an img tag in the header with placeholder src
- "change button color to red" → modify button background-color to red
- "add more padding" → increase padding values
- "remove border" → set border: none or remove border styles
- "make it wider" → increase max-width or width values
- "center align" → add text-align: center
- "bold heading" → add font-weight: bold

Return a JSON object with:
1. "html" - the complete modified HTML template
2. "changes" - a brief description of what was changed (2-3 sentences)

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "html": "<!DOCTYPE html><html>...</html>",
  "changes": "Changed the header background color to blue (#3B82F6). Increased font size of main heading from 24px to 28px."
}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert email template editor. You modify HTML email templates based on natural language requests. Always maintain email compatibility with inline CSS and table layouts. Return only valid JSON, no markdown.'
        },
        {
          role: 'user',
          content: editPrompt
        }
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.3,
      max_tokens: 8192,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';

    // Clean up response - remove markdown code blocks if present
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const result = JSON.parse(cleanedResponse);

    // Validate that we got both html and changes
    if (!result.html || !result.changes) {
      throw new Error('Invalid response from AI: missing html or changes');
    }

    return {
      html: result.html,
      changes: result.changes,
    };
  } catch (error) {
    console.error('Error editing template:', error);

    // If AI edit fails, try some basic pattern matching as fallback
    const fallbackEdit = applyBasicEdits(html, editRequest);

    return {
      html: fallbackEdit.html,
      changes: fallbackEdit.changes,
    };
  }
}

/**
 * Fallback: Apply basic edits using pattern matching if AI fails
 */
function applyBasicEdits(html: string, editRequest: string): { html: string; changes: string } {
  let modifiedHtml = html;
  const changes: string[] = [];

  const lowerRequest = editRequest.toLowerCase();

  // Pattern: "make header [color]"
  if (lowerRequest.includes('header') && (lowerRequest.includes('blue') || lowerRequest.includes('red') || lowerRequest.includes('green'))) {
    const color = lowerRequest.includes('blue') ? '#3B82F6' :
                  lowerRequest.includes('red') ? '#EF4444' :
                  lowerRequest.includes('green') ? '#10B981' : '#3B82F6';

    // Find header td and replace background-color
    modifiedHtml = modifiedHtml.replace(
      /(background-color:\s*)[^;}"'>]+/gi,
      (match, prefix) => {
        // Only replace the first occurrence (likely the header)
        if (!changes.includes('header color')) {
          changes.push('header color');
          return prefix + color;
        }
        return match;
      }
    );
  }

  // Pattern: "larger text" or "bigger font"
  if (lowerRequest.includes('larger') || lowerRequest.includes('bigger')) {
    modifiedHtml = modifiedHtml.replace(
      /font-size:\s*(\d+)px/gi,
      (match, size) => {
        const newSize = Math.floor(parseInt(size) * 1.2);
        changes.push(`increased font size to ${newSize}px`);
        return `font-size: ${newSize}px`;
      }
    );
  }

  // Pattern: "smaller text"
  if (lowerRequest.includes('smaller')) {
    modifiedHtml = modifiedHtml.replace(
      /font-size:\s*(\d+)px/gi,
      (match, size) => {
        const newSize = Math.floor(parseInt(size) * 0.85);
        changes.push(`decreased font size to ${newSize}px`);
        return `font-size: ${newSize}px`;
      }
    );
  }

  // Pattern: "change button color to [color]"
  if (lowerRequest.includes('button') && lowerRequest.includes('color')) {
    const color = lowerRequest.includes('blue') ? '#3B82F6' :
                  lowerRequest.includes('red') ? '#EF4444' :
                  lowerRequest.includes('green') ? '#10B981' :
                  lowerRequest.includes('orange') ? '#F59E0B' :
                  lowerRequest.includes('purple') ? '#8B5CF6' : '#3B82F6';

    // Find button/CTA styles and replace
    modifiedHtml = modifiedHtml.replace(
      /(<a[^>]*style="[^"]*)(background-color:\s*[^;}"']+)([^"]*")/gi,
      (match, prefix, bgColor, suffix) => {
        changes.push(`button color to ${color}`);
        return `${prefix}background-color: ${color}${suffix}`;
      }
    );
  }

  // Pattern: "add more padding"
  if (lowerRequest.includes('more padding') || lowerRequest.includes('increase padding')) {
    modifiedHtml = modifiedHtml.replace(
      /padding:\s*(\d+)px/gi,
      (match, padding) => {
        const newPadding = Math.floor(parseInt(padding) * 1.3);
        changes.push(`increased padding to ${newPadding}px`);
        return `padding: ${newPadding}px`;
      }
    );
  }

  // Pattern: "remove border"
  if (lowerRequest.includes('remove border') || lowerRequest.includes('no border')) {
    modifiedHtml = modifiedHtml.replace(
      /border:\s*[^;}"']+/gi,
      'border: none'
    );
    changes.push('removed borders');
  }

  const changesDescription = changes.length > 0
    ? `Applied the following changes: ${changes.join(', ')}.`
    : 'Made basic modifications to the template based on your request.';

  return {
    html: modifiedHtml,
    changes: changesDescription,
  };
}

/**
 * POST /api/edit-template
 * Edit an email template using natural language
 */
export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const body: EditTemplateRequest = await request.json();

    if (!body.html) {
      return NextResponse.json(
        { error: 'html template is required' },
        { status: 400 }
      );
    }

    if (!body.editRequest) {
      return NextResponse.json(
        { error: 'editRequest is required' },
        { status: 400 }
      );
    }

    // Validate HTML is not empty
    if (body.html.trim().length < 50) {
      return NextResponse.json(
        { error: 'html template appears to be invalid or too short' },
        { status: 400 }
      );
    }

    console.log('Editing template with request:', body.editRequest);

    // Edit the template
    const result = await editTemplate(body.html, body.editRequest);

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('Error in edit-template:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        error: 'Failed to edit template',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
