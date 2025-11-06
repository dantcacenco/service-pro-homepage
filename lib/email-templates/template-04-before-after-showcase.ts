// Template 4: Before/After Showcase (Image-focused template for remodeling)
export const template04 = {
  id: 'template-04',
  name: 'Before/After Showcase',
  category: 'Remodeling',
  description: 'Image-focused template with large before/after photos',
  thumbnail: '/templates/04.png',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #F5F5F5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 30px 20px;">
        <table role="presentation" style="max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background-color: #2C3E50;">
              <h1 style="margin: 0 0 10px; color: #ffffff; font-size: 36px; font-weight: 700;">TRANSFORMATION COMPLETE</h1>
              <p style="margin: 0; color: #ECF0F1; font-size: 16px; font-weight: 400;">See the amazing results of your kitchen remodel</p>
            </td>
          </tr>

          <!-- Before/After Images -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <!-- Before -->
                  <td style="width: 50%; padding: 0; position: relative;">
                    <div style="background-color: #BDC3C7; height: 300px; position: relative;">
                      <div style="position: absolute; top: 20px; left: 20px; background-color: rgba(0,0,0,0.7); color: #ffffff; padding: 10px 20px; font-size: 18px; font-weight: 700; text-transform: uppercase;">Before</div>
                      <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #7F8C8D; font-size: 16px;">[Before Photo]</div>
                    </div>
                  </td>
                  <!-- After -->
                  <td style="width: 50%; padding: 0; position: relative;">
                    <div style="background-color: #3498DB; height: 300px; position: relative;">
                      <div style="position: absolute; top: 20px; right: 20px; background-color: #27AE60; color: #ffffff; padding: 10px 20px; font-size: 18px; font-weight: 700; text-transform: uppercase;">After</div>
                      <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ffffff; font-size: 16px;">[After Photo]</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Project Details -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #2C3E50; font-size: 28px; font-weight: 700; text-align: center;">Modern Kitchen Renovation</h2>
              <p style="margin: 0 0 30px; color: #555555; font-size: 16px; line-height: 1.7; text-align: center;">From outdated to outstanding - this complete kitchen transformation showcases our commitment to quality craftsmanship and stunning design.</p>

              <!-- Stats -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="width: 33.33%; text-align: center; padding: 20px; border-right: 1px solid #ECF0F1;">
                    <div style="font-size: 32px; font-weight: 700; color: #3498DB; margin-bottom: 5px;">12</div>
                    <div style="font-size: 14px; color: #7F8C8D; text-transform: uppercase; letter-spacing: 1px;">Days</div>
                  </td>
                  <td style="width: 33.33%; text-align: center; padding: 20px; border-right: 1px solid #ECF0F1;">
                    <div style="font-size: 32px; font-weight: 700; color: #27AE60; margin-bottom: 5px;">100%</div>
                    <div style="font-size: 14px; color: #7F8C8D; text-transform: uppercase; letter-spacing: 1px;">Satisfied</div>
                  </td>
                  <td style="width: 33.33%; text-align: center; padding: 20px;">
                    <div style="font-size: 32px; font-weight: 700; color: #E74C3C; margin-bottom: 5px;">5★</div>
                    <div style="font-size: 14px; color: #7F8C8D; text-transform: uppercase; letter-spacing: 1px;">Rating</div>
                  </td>
                </tr>
              </table>

              <!-- Features List -->
              <div style="background-color: #ECF0F1; padding: 30px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 20px; color: #2C3E50; font-size: 20px; font-weight: 700;">Project Highlights:</h3>
                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="width: 50%; padding: 8px 0;">
                      <span style="color: #27AE60; font-size: 18px; margin-right: 8px;">✓</span>
                      <span style="color: #555555; font-size: 15px;">Custom Cabinets</span>
                    </td>
                    <td style="width: 50%; padding: 8px 0;">
                      <span style="color: #27AE60; font-size: 18px; margin-right: 8px;">✓</span>
                      <span style="color: #555555; font-size: 15px;">Quartz Countertops</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="width: 50%; padding: 8px 0;">
                      <span style="color: #27AE60; font-size: 18px; margin-right: 8px;">✓</span>
                      <span style="color: #555555; font-size: 15px;">Designer Backsplash</span>
                    </td>
                    <td style="width: 50%; padding: 8px 0;">
                      <span style="color: #27AE60; font-size: 18px; margin-right: 8px;">✓</span>
                      <span style="color: #555555; font-size: 15px;">LED Lighting</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="width: 50%; padding: 8px 0;">
                      <span style="color: #27AE60; font-size: 18px; margin-right: 8px;">✓</span>
                      <span style="color: #555555; font-size: 15px;">Hardwood Flooring</span>
                    </td>
                    <td style="width: 50%; padding: 8px 0;">
                      <span style="color: #27AE60; font-size: 18px; margin-right: 8px;">✓</span>
                      <span style="color: #555555; font-size: 15px;">New Appliances</span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; font-weight: 600;">Ready to transform your space?</p>
              <a href="#" style="display: inline-block; padding: 18px 50px; background-color: #3498DB; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-radius: 5px;">Get Your Free Quote</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #2C3E50; padding: 30px 40px; text-align: center;">
              <p style="margin: 0 0 10px; color: #ffffff; font-size: 20px; font-weight: 700;">Premium Remodeling Co.</p>
              <p style="margin: 0 0 5px; color: #BDC3C7; font-size: 14px;">www.premiumremodeling.com | (555) 123-4567</p>
              <p style="margin: 0; color: #95A5A6; font-size: 12px;">Transforming homes since 1995</p>
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
