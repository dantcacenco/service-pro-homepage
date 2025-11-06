// Template 13: Review Request (Customer feedback request with star ratings)
export const template13 = {
  id: 'template-13',
  name: 'Review Request',
  category: 'Customer Feedback',
  description: 'Customer feedback request with star ratings',
  thumbnail: '/templates/13.png',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #FFF8F0;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
          <!-- Header -->
          <tr>
            <td style="padding: 50px 40px 40px; text-align: center; background: linear-gradient(135deg, #FF9A56 0%, #FF6B6B 100%);">
              <div style="font-size: 60px; margin-bottom: 15px;">⭐</div>
              <h1 style="margin: 0 0 15px; color: #FFFFFF; font-size: 32px; font-weight: 700;">How Did We Do?</h1>
              <p style="margin: 0; color: #FFE4D6; font-size: 16px; font-weight: 500;">Your feedback helps us serve you better</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 17px; line-height: 1.7;">Hi Jennifer,</p>
              <p style="margin: 0 0 30px; color: #333333; font-size: 17px; line-height: 1.7;">Thank you for choosing us for your recent plumbing service! We hope everything went smoothly and you're happy with the results.</p>
              <p style="margin: 0 0 35px; color: #333333; font-size: 17px; line-height: 1.7; font-weight: 600;">We'd love to hear about your experience!</p>
            </td>
          </tr>

          <!-- Star Rating Section -->
          <tr>
            <td style="padding: 0 40px 35px;">
              <div style="background-color: #FFF8F0; padding: 35px; border-radius: 10px; text-align: center;">
                <h2 style="margin: 0 0 25px; color: #FF6B6B; font-size: 22px; font-weight: 700;">Rate Your Experience</h2>

                <!-- Star Buttons -->
                <table role="presentation" style="margin: 0 auto 25px;">
                  <tr>
                    <td style="padding: 0 8px;">
                      <a href="#" style="display: block; text-decoration: none; font-size: 48px; color: #FFD700; transition: transform 0.2s;">⭐</a>
                    </td>
                    <td style="padding: 0 8px;">
                      <a href="#" style="display: block; text-decoration: none; font-size: 48px; color: #FFD700; transition: transform 0.2s;">⭐</a>
                    </td>
                    <td style="padding: 0 8px;">
                      <a href="#" style="display: block; text-decoration: none; font-size: 48px; color: #FFD700; transition: transform 0.2s;">⭐</a>
                    </td>
                    <td style="padding: 0 8px;">
                      <a href="#" style="display: block; text-decoration: none; font-size: 48px; color: #FFD700; transition: transform 0.2s;">⭐</a>
                    </td>
                    <td style="padding: 0 8px;">
                      <a href="#" style="display: block; text-decoration: none; font-size: 48px; color: #FFD700; transition: transform 0.2s;">⭐</a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0; color: #999999; font-size: 14px; font-style: italic;">Click a star to rate us</p>
              </div>
            </td>
          </tr>

          <!-- Service Details -->
          <tr>
            <td style="padding: 0 40px 35px;">
              <div style="border: 2px solid #FFE4D6; border-radius: 10px; padding: 25px;">
                <h3 style="margin: 0 0 20px; color: #FF6B6B; font-size: 18px; font-weight: 700; text-align: center;">Service Summary</h3>

                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="padding: 10px 0; color: #666666; font-size: 14px; width: 40%;">Service:</td>
                    <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: 600;">Kitchen Faucet Repair</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666666; font-size: 14px;">Date:</td>
                    <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: 600;">December 15, 2024</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666666; font-size: 14px;">Technician:</td>
                    <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: 600;">Robert Martinez</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Review Platforms -->
          <tr>
            <td style="padding: 0 40px 35px;">
              <h3 style="margin: 0 0 20px; color: #333333; font-size: 20px; font-weight: 700; text-align: center;">Leave a Review On:</h3>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; width: 50%;">
                    <a href="#" style="display: block; padding: 18px; background-color: #4267B2; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; text-align: center; border-radius: 8px;">
                      <span style="font-size: 20px; margin-right: 8px;">f</span> Facebook
                    </a>
                  </td>
                  <td style="padding: 10px; width: 50%;">
                    <a href="#" style="display: block; padding: 18px; background-color: #4285F4; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; text-align: center; border-radius: 8px;">
                      <span style="font-size: 20px; margin-right: 8px;">G</span> Google
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px; width: 50%;">
                    <a href="#" style="display: block; padding: 18px; background-color: #D32323; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; text-align: center; border-radius: 8px;">
                      <span style="font-size: 20px; margin-right: 8px;">★</span> Yelp
                    </a>
                  </td>
                  <td style="padding: 10px; width: 50%;">
                    <a href="#" style="display: block; padding: 18px; background-color: #FF6B6B; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; text-align: center; border-radius: 8px;">
                      <span style="font-size: 20px; margin-right: 8px;">📝</span> Our Website
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Incentive -->
          <tr>
            <td style="padding: 0 40px 35px;">
              <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 25px; border-radius: 10px; text-align: center;">
                <div style="font-size: 36px; margin-bottom: 10px;">🎁</div>
                <h3 style="margin: 0 0 10px; color: #5A3A00; font-size: 20px; font-weight: 800;">Leave a Review, Get 10% OFF</h3>
                <p style="margin: 0; color: #7D5200; font-size: 15px; font-weight: 600;">Your next service with us!</p>
              </div>
            </td>
          </tr>

          <!-- Testimonials -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <h3 style="margin: 0 0 25px; color: #333333; font-size: 18px; font-weight: 700; text-align: center;">Join Our Happy Customers</h3>

              <div style="background-color: #F9F9F9; padding: 20px; border-left: 4px solid #FF6B6B; margin-bottom: 15px; border-radius: 4px;">
                <div style="margin-bottom: 10px; color: #FFD700; font-size: 18px;">★★★★★</div>
                <p style="margin: 0 0 10px; color: #555555; font-size: 14px; font-style: italic; line-height: 1.6;">"Excellent service! The technician was professional, on time, and fixed the issue quickly."</p>
                <p style="margin: 0; color: #FF6B6B; font-size: 13px; font-weight: 600;">— Sarah T.</p>
              </div>

              <div style="background-color: #F9F9F9; padding: 20px; border-left: 4px solid #FF6B6B; border-radius: 4px;">
                <div style="margin-bottom: 10px; color: #FFD700; font-size: 18px;">★★★★★</div>
                <p style="margin: 0 0 10px; color: #555555; font-size: 14px; font-style: italic; line-height: 1.6;">"Best plumbing company I've ever used. Highly recommend!"</p>
                <p style="margin: 0; color: #FF6B6B; font-size: 13px; font-weight: 600;">— Michael R.</p>
              </div>
            </td>
          </tr>

          <!-- Alternative Feedback -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <p style="margin: 0 0 15px; color: #999999; font-size: 14px;">Had an issue with your service?</p>
              <a href="#" style="color: #FF6B6B; font-size: 15px; font-weight: 600; text-decoration: underline;">Contact us directly</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 35px 40px; background-color: #333333; text-align: center;">
              <p style="margin: 0 0 10px; color: #FFFFFF; font-size: 20px; font-weight: 700;">Thank You!</p>
              <p style="margin: 0 0 15px; color: #CCCCCC; font-size: 14px;">Your feedback means the world to us</p>
              <p style="margin: 0 0 5px; color: #999999; font-size: 13px;">Perfect Plumbing Pro</p>
              <p style="margin: 0; color: #999999; font-size: 13px;">(555) 789-0123 | reviews@perfectplumbing.com</p>
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
