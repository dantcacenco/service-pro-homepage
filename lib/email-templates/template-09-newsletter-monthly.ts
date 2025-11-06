// Template 9: Monthly Newsletter (Multi-section newsletter layout)
export const template09 = {
  id: 'template-09',
  name: 'Monthly Newsletter',
  category: 'Newsletter',
  description: 'Multi-section newsletter layout with multiple content blocks',
  thumbnail: '/templates/09.png',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, sans-serif; background-color: #F4F4F4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #F4F4F4;">
    <tr>
      <td style="padding: 20px;">
        <table role="presentation" style="max-width: 680px; margin: 0 auto; background-color: #FFFFFF;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; background-color: #1E88E5; text-align: center;">
              <h1 style="margin: 0 0 10px; color: #FFFFFF; font-size: 36px; font-weight: 700;">SERVICE PRO MONTHLY</h1>
              <p style="margin: 0; color: #BBDEFB; font-size: 16px; font-weight: 500;">Your Home Service Newsletter • December 2024</p>
            </td>
          </tr>

          <!-- Hero Article -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="width: 60%; padding: 40px 30px 40px 40px; vertical-align: top;">
                    <div style="background-color: #1E88E5; color: #FFFFFF; display: inline-block; padding: 6px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">Featured Story</div>
                    <h2 style="margin: 0 0 15px; color: #212121; font-size: 28px; font-weight: 700; line-height: 1.3;">Winter Prep: 10 Essential Home Maintenance Tips</h2>
                    <p style="margin: 0 0 20px; color: #666666; font-size: 15px; line-height: 1.6;">Don't let winter catch you off guard. Our comprehensive guide covers everything from furnace checks to pipe insulation.</p>
                    <a href="#" style="color: #1E88E5; font-size: 15px; font-weight: 600; text-decoration: none;">Read More →</a>
                  </td>
                  <td style="width: 40%; padding: 0;">
                    <div style="background-color: #BBDEFB; height: 280px; display: flex; align-items: center; justify-content: center; color: #1E88E5; font-size: 14px;">[Hero Image]</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Section Divider -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h3 style="margin: 0; color: #212121; font-size: 24px; font-weight: 700; text-align: center; padding-bottom: 20px; border-bottom: 3px solid #1E88E5;">Latest Updates</h3>
            </td>
          </tr>

          <!-- 3-Column Articles -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <!-- Article 1 -->
                  <td style="width: 33.33%; padding-right: 15px; vertical-align: top;">
                    <div style="background-color: #E3F2FD; height: 150px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; color: #1E88E5; font-size: 12px;">[Image]</div>
                    <div style="background-color: #FFC107; display: inline-block; padding: 4px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px;">HVAC</div>
                    <h4 style="margin: 0 0 10px; color: #212121; font-size: 16px; font-weight: 700; line-height: 1.4;">New Energy-Efficient Systems</h4>
                    <p style="margin: 0 0 12px; color: #666666; font-size: 13px; line-height: 1.5;">Save up to 40% on heating costs with our latest installations.</p>
                    <a href="#" style="color: #1E88E5; font-size: 13px; font-weight: 600; text-decoration: none;">Learn More →</a>
                  </td>

                  <!-- Article 2 -->
                  <td style="width: 33.33%; padding: 0 7.5px; vertical-align: top;">
                    <div style="background-color: #E3F2FD; height: 150px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; color: #1E88E5; font-size: 12px;">[Image]</div>
                    <div style="background-color: #4CAF50; color: #FFFFFF; display: inline-block; padding: 4px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px;">TIPS</div>
                    <h4 style="margin: 0 0 10px; color: #212121; font-size: 16px; font-weight: 700; line-height: 1.4;">DIY Gutter Cleaning Guide</h4>
                    <p style="margin: 0 0 12px; color: #666666; font-size: 13px; line-height: 1.5;">Step-by-step instructions for safe and effective cleaning.</p>
                    <a href="#" style="color: #1E88E5; font-size: 13px; font-weight: 600; text-decoration: none;">Learn More →</a>
                  </td>

                  <!-- Article 3 -->
                  <td style="width: 33.33%; padding-left: 15px; vertical-align: top;">
                    <div style="background-color: #E3F2FD; height: 150px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; color: #1E88E5; font-size: 12px;">[Image]</div>
                    <div style="background-color: #E91E63; color: #FFFFFF; display: inline-block; padding: 4px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px;">PROMO</div>
                    <h4 style="margin: 0 0 10px; color: #212121; font-size: 16px; font-weight: 700; line-height: 1.4;">Holiday Special Rates</h4>
                    <p style="margin: 0 0 12px; color: #666666; font-size: 13px; line-height: 1.5;">Book before Dec 31 and save 25% on all services.</p>
                    <a href="#" style="color: #1E88E5; font-size: 13px; font-weight: 600; text-decoration: none;">Learn More →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer Spotlight -->
          <tr>
            <td style="padding: 40px; background-color: #FFF3E0;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="width: 100px; vertical-align: top; padding-right: 25px;">
                    <div style="width: 80px; height: 80px; background-color: #FF9800; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 32px; font-weight: 700;">JD</div>
                  </td>
                  <td style="vertical-align: top;">
                    <div style="color: #FF9800; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Customer Spotlight</div>
                    <p style="margin: 0 0 15px; color: #424242; font-size: 17px; line-height: 1.6; font-style: italic;">"The team was professional, efficient, and went above and beyond. Our new kitchen is absolutely stunning!"</p>
                    <p style="margin: 0; color: #FF9800; font-size: 14px; font-weight: 700;">— Jane Doe, Satisfied Customer</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Quick Links -->
          <tr>
            <td style="padding: 40px;">
              <h3 style="margin: 0 0 25px; color: #212121; font-size: 22px; font-weight: 700; text-align: center;">Quick Links</h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 50%; padding: 12px; text-align: center;">
                    <a href="#" style="display: block; padding: 15px; background-color: #1E88E5; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 5px;">Book Service</a>
                  </td>
                  <td style="width: 50%; padding: 12px; text-align: center;">
                    <a href="#" style="display: block; padding: 15px; background-color: #4CAF50; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 5px;">Get Quote</a>
                  </td>
                </tr>
                <tr>
                  <td style="width: 50%; padding: 12px; text-align: center;">
                    <a href="#" style="display: block; padding: 15px; background-color: #FF9800; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 5px;">View Promotions</a>
                  </td>
                  <td style="width: 50%; padding: 12px; text-align: center;">
                    <a href="#" style="display: block; padding: 15px; background-color: #9C27B0; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 5px;">Contact Us</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 40px; background-color: #263238; text-align: center;">
              <p style="margin: 0 0 15px; color: #FFFFFF; font-size: 20px; font-weight: 700;">SERVICE PRO</p>
              <p style="margin: 0 0 5px; color: #90A4AE; font-size: 14px;">123 Main Street, Your City, ST 12345</p>
              <p style="margin: 0 0 20px; color: #90A4AE; font-size: 14px;">(555) 123-4567 | info@servicepro.com</p>

              <div style="margin: 25px 0;">
                <a href="#" style="display: inline-block; margin: 0 10px; color: #90A4AE; font-size: 24px; text-decoration: none;">f</a>
                <a href="#" style="display: inline-block; margin: 0 10px; color: #90A4AE; font-size: 24px; text-decoration: none;">t</a>
                <a href="#" style="display: inline-block; margin: 0 10px; color: #90A4AE; font-size: 24px; text-decoration: none;">in</a>
              </div>

              <p style="margin: 0; color: #546E7A; font-size: 12px;">
                <a href="#" style="color: #546E7A; text-decoration: underline;">Unsubscribe</a> |
                <a href="#" style="color: #546E7A; text-decoration: underline;">Update Preferences</a>
              </p>
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
