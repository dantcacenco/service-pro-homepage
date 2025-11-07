import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

/**
 * Get Groq client instance (lazy initialization for Vercel builds)
 */
function getGroqClient() {
  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

interface RankedTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  html: string;
  rank: number;
}

interface BusinessInfo {
  businessName: string;
  industry: string;
  email: string;
  brandColor?: string;
  industrySpecific?: {
    serviceTypes?: string[];
    emergencyService?: boolean;
    beforeAfterPhotos?: boolean;
    seasonalServices?: string[];
    installationTimeline?: string;
    energyRatings?: boolean;
    maintenancePlans?: boolean;
  };
}

interface GenerateTemplatesRequest {
  rankedTemplates: RankedTemplate[];
  businessInfo: BusinessInfo;
}

interface GeneratedTemplate {
  html: string;
  name: string;
  description: string;
}

interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

interface LayoutPattern {
  type: string;
  hasHeader: boolean;
  hasSidebar: boolean;
  columnCount: number;
}

interface Typography {
  headingFont: string;
  bodyFont: string;
  headingSizes: string[];
  bodySize: string;
  lineHeight: string;
}

interface SpacingPattern {
  padding: string;
  margin: string;
  cellPadding: string;
}

interface VisualStyle {
  overall: string;
  imageUsage: string;
  buttonStyle: string;
  borders: string;
}

interface TemplateAnalysis {
  colorSchemes: ColorScheme[];
  layoutPatterns: LayoutPattern[];
  typography: Typography;
  spacingPatterns: SpacingPattern;
  visualStyle: VisualStyle;
}

/**
 * Extract color values from HTML using regex
 */
function extractColors(html: string): string[] {
  const colorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\([^)]+\)|rgba\([^)]+\)/g;
  const colors = html.match(colorRegex) || [];
  // Remove duplicates and sort by frequency
  const colorFrequency = colors.reduce((acc, color) => {
    acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.keys(colorFrequency)
    .sort((a, b) => colorFrequency[b] - colorFrequency[a])
    .slice(0, 10);
}

/**
 * Analyze top 5 ranked templates to extract design patterns
 */
async function analyzeTemplates(templates: RankedTemplate[]): Promise<TemplateAnalysis> {
  const topTemplates = templates.slice(0, 5);

  // Extract colors from each template
  const allColors = topTemplates.flatMap(t => extractColors(t.html));
  const uniqueColors = [...new Set(allColors)];

  // Build analysis prompt
  const analysisPrompt = `Analyze these top 5 email templates and extract design patterns.

Templates:
${topTemplates.map((t, i) => `
${i + 1}. ${t.name} (${t.category})
HTML: ${t.html.substring(0, 1000)}...
`).join('\n')}

Extracted colors: ${uniqueColors.join(', ')}

Provide a JSON analysis with:
1. Color scheme (primary, secondary, accent, background, text colors)
2. Layout pattern (type: table-based/single-column/split/grid, structure details)
3. Typography (font families, sizes, weights, line heights)
4. Spacing patterns (padding, margins, cell spacing)
5. Visual style (minimal/bold/elegant/playful, image usage, button style, borders)

Return ONLY valid JSON in this exact format:
{
  "colorScheme": {
    "primary": "#hexcode",
    "secondary": "#hexcode",
    "accent": "#hexcode",
    "background": "#hexcode",
    "text": "#hexcode"
  },
  "layoutPattern": {
    "type": "table-based",
    "hasHeader": true,
    "hasSidebar": false,
    "columnCount": 1
  },
  "typography": {
    "headingFont": "Arial, sans-serif",
    "bodyFont": "Arial, sans-serif",
    "headingSizes": ["24px", "18px"],
    "bodySize": "14px",
    "lineHeight": "1.5"
  },
  "spacingPattern": {
    "padding": "20px",
    "margin": "0 auto",
    "cellPadding": "10px"
  },
  "visualStyle": {
    "overall": "professional",
    "imageUsage": "moderate",
    "buttonStyle": "rounded",
    "borders": "subtle"
  }
}`;

  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert email template designer. Analyze email templates and return only valid JSON. No markdown, no explanations, just JSON.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.3,
      max_tokens: 2048,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';

    // Clean up response - remove markdown code blocks if present
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const analysis = JSON.parse(cleanedResponse);

    return {
      colorSchemes: [analysis.colorScheme],
      layoutPatterns: [analysis.layoutPattern],
      typography: analysis.typography,
      spacingPatterns: analysis.spacingPattern,
      visualStyle: analysis.visualStyle,
    };
  } catch (error) {
    console.error('Error analyzing templates:', error);

    // Fallback to basic analysis if AI fails
    return {
      colorSchemes: [{
        primary: uniqueColors[0] || '#3B82F6',
        secondary: uniqueColors[1] || '#60A5FA',
        accent: uniqueColors[2] || '#F59E0B',
        background: '#FFFFFF',
        text: '#1F2937',
      }],
      layoutPatterns: [{
        type: 'table-based',
        hasHeader: true,
        hasSidebar: false,
        columnCount: 1,
      }],
      typography: {
        headingFont: 'Arial, sans-serif',
        bodyFont: 'Arial, sans-serif',
        headingSizes: ['24px', '18px'],
        bodySize: '14px',
        lineHeight: '1.5',
      },
      spacingPatterns: {
        padding: '20px',
        margin: '0 auto',
        cellPadding: '10px',
      },
      visualStyle: {
        overall: 'professional',
        imageUsage: 'moderate',
        buttonStyle: 'rounded',
        borders: 'subtle',
      },
    };
  }
}

/**
 * Generate new email templates based on analysis and business info
 */
async function generateTemplates(
  analysis: TemplateAnalysis,
  businessInfo: BusinessInfo
): Promise<GeneratedTemplate[]> {
  const colorScheme = analysis.colorSchemes[0];
  const brandColor = businessInfo.brandColor || colorScheme.primary;

  // Build industry-specific context
  let industryContext = '';
  if (businessInfo.industrySpecific) {
    const specific = businessInfo.industrySpecific;
    if (specific.serviceTypes) {
      industryContext += `\nService types: ${specific.serviceTypes.join(', ')}`;
    }
    if (specific.emergencyService) {
      industryContext += '\nOffers 24/7 emergency service';
    }
    if (specific.seasonalServices) {
      industryContext += `\nSeasonal services: ${specific.seasonalServices.join(', ')}`;
    }
  }

  const generationPrompt = `Generate 3 unique HTML email templates for a ${businessInfo.industry} business called "${businessInfo.businessName}".

Design Analysis from User Preferences:
- Color Scheme: Primary ${colorScheme.primary}, Secondary ${colorScheme.secondary}, Accent ${colorScheme.accent}
- Brand Color: ${brandColor}
- Layout Type: ${analysis.layoutPatterns[0].type}
- Visual Style: ${analysis.visualStyle.overall}
- Typography: Heading ${analysis.typography.headingFont}, Body ${analysis.typography.bodyFont}
- Spacing: Padding ${analysis.spacingPatterns.padding}
${industryContext}

CRITICAL REQUIREMENTS:
1. Use ONLY inline CSS (no external stylesheets or <style> tags)
2. Use table-based layouts for email compatibility
3. Include proper DOCTYPE and meta tags
4. Make buttons clickable with mailto: or tel: links
5. Use the brand color (${brandColor}) as the primary action color
6. Match the visual style: ${analysis.visualStyle.overall}
7. Include industry-specific content for ${businessInfo.industry}
8. Make it mobile-responsive using max-width and media queries

Generate 3 different template types:
1. Welcome Email - greet new customers, introduce services
2. Service Promotion - highlight a specific service or seasonal offer
3. Follow-up/Thank You - post-service appreciation with review request

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "templates": [
    {
      "name": "Welcome to [Business]",
      "description": "Brief description",
      "html": "<!DOCTYPE html><html>...</html>"
    },
    {
      "name": "Template 2 Name",
      "description": "Brief description",
      "html": "<!DOCTYPE html><html>...</html>"
    },
    {
      "name": "Template 3 Name",
      "description": "Brief description",
      "html": "<!DOCTYPE html><html>...</html>"
    }
  ]
}`;

  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert email template designer specializing in service industry businesses. Generate production-ready HTML email templates with inline CSS only. Return only valid JSON, no markdown.'
        },
        {
          role: 'user',
          content: generationPrompt
        }
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.7,
      max_tokens: 8192,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';

    // Clean up response - remove markdown code blocks if present
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const result = JSON.parse(cleanedResponse);

    return result.templates || [];
  } catch (error) {
    console.error('Error generating templates:', error);

    // Return fallback templates if generation fails
    return [
      {
        name: `Welcome to ${businessInfo.businessName}`,
        description: 'A professional welcome email for new customers',
        html: generateFallbackTemplate(businessInfo, brandColor, 'welcome'),
      },
      {
        name: `${businessInfo.industry.charAt(0).toUpperCase() + businessInfo.industry.slice(1)} Service Special`,
        description: 'Promote your services with this eye-catching email',
        html: generateFallbackTemplate(businessInfo, brandColor, 'promotion'),
      },
    ];
  }
}

/**
 * Generate a fallback template if AI generation fails
 */
function generateFallbackTemplate(
  businessInfo: BusinessInfo,
  brandColor: string,
  type: 'welcome' | 'promotion'
): string {
  const title = type === 'welcome'
    ? `Welcome to ${businessInfo.businessName}!`
    : `Special Offer from ${businessInfo.businessName}`;

  const content = type === 'welcome'
    ? `Thank you for choosing ${businessInfo.businessName}. We're excited to serve you with the best ${businessInfo.industry} services in your area.`
    : `Don't miss out on our limited-time offer! Contact us today to schedule your ${businessInfo.industry} service.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: ${brandColor}; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">${businessInfo.businessName}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1F2937; font-size: 24px;">${title}</h2>
              <p style="margin: 0 0 20px; color: #4B5563; font-size: 16px; line-height: 1.6;">${content}</p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td style="border-radius: 4px; background-color: ${brandColor};">
                    <a href="mailto:${businessInfo.email}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">Contact Us</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                Have questions? Reply to this email or contact us at ${businessInfo.email}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #6B7280; font-size: 12px;">
                &copy; ${new Date().getFullYear()} ${businessInfo.businessName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * POST /api/generate-templates
 * Generate personalized email templates based on ranked preferences
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
    const body: GenerateTemplatesRequest = await request.json();

    if (!body.rankedTemplates || !Array.isArray(body.rankedTemplates)) {
      return NextResponse.json(
        { error: 'rankedTemplates array is required' },
        { status: 400 }
      );
    }

    if (!body.businessInfo || !body.businessInfo.businessName) {
      return NextResponse.json(
        { error: 'businessInfo with businessName is required' },
        { status: 400 }
      );
    }

    console.log('Analyzing templates...');
    // Step 1: Analyze top 5 templates
    const analysis = await analyzeTemplates(body.rankedTemplates);

    console.log('Generating templates...');
    // Step 2: Generate new templates
    const templates = await generateTemplates(analysis, body.businessInfo);

    // Validate generated templates
    if (!templates || templates.length === 0) {
      throw new Error('No templates were generated');
    }

    return NextResponse.json({
      templates,
      analysis: {
        colorScheme: analysis.colorSchemes[0],
        layoutPattern: analysis.layoutPatterns[0],
        visualStyle: analysis.visualStyle.overall,
      }
    });

  } catch (error: unknown) {
    console.error('Error in generate-templates:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        error: 'Failed to generate templates',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
