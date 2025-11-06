// Template 2: Minimalist Modern (Lots of white space, clean design)
export const template02 = {
  id: 'template-02',
  name: 'Minimalist Modern',
  category: 'General Service',
  description: 'Clean, spacious design with lots of breathing room',
  thumbnail: '/templates/02.png',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 80px 20px;">
        <table role="presentation" style="max-width: 500px; margin: 0 auto;">
          <!-- Logo -->
          <tr>
            <td style="text-align: center; padding-bottom: 60px;">
              <div style="width: 60px; height: 60px; background-color: #000000; margin: 0 auto;"></div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding-bottom: 40px;">
              <h1 style="margin: 0 0 30px; color: #000000; font-size: 32px; font-weight: 300; line-height: 1.4; letter-spacing: -0.5px;">Your project is ready for review</h1>
              <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.8; font-weight: 300;">We've completed the initial assessment and prepared a detailed proposal for your consideration.</p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom: 60px;">
              <a href="#" style="display: inline-block; padding: 16px 40px; background-color: #000000; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;">View Proposal</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="text-align: center; border-top: 1px solid #E5E5E5; padding-top: 40px;">
              <p style="margin: 0 0 8px; color: #999999; font-size: 12px; font-weight: 300;">SERVICE PRO</p>
              <p style="margin: 0; color: #CCCCCC; font-size: 11px; font-weight: 300;">Professional Services</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
};
