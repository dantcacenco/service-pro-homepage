// Template 10: Seasonal Discount (Promotional template focused on sales)
export const template10 = {
  id: 'template-10',
  name: 'Seasonal Discount',
  category: 'Promotional',
  description: 'Promotional template focused on sales and discounts',
  thumbnail: '/templates/10.png',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #F0F4F8;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 30px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF;">
          <!-- Promotional Banner -->
          <tr>
            <td style="padding: 0; background: linear-gradient(135deg, #DC143C 0%, #8B0000 100%); text-align: center;">
              <div style="padding: 15px; background-color: rgba(255, 255, 255, 0.1); border-bottom: 2px dashed rgba(255, 255, 255, 0.3);">
                <p style="margin: 0; color: #FFFFFF; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">🎉 Limited Time Offer</p>
              </div>
              <div style="padding: 50px 40px;">
                <h1 style="margin: 0 0 20px; color: #FFFFFF; font-size: 56px; font-weight: 900; line-height: 1; text-shadow: 3px 3px 6px rgba(0,0,0,0.3);">WINTER SALE</h1>
                <div style="background-color: #FFD700; color: #8B0000; display: inline-block; padding: 20px 40px; margin: 0 0 20px; transform: rotate(-2deg); box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
                  <div style="font-size: 72px; font-weight: 900; line-height: 1; letter-spacing: -2px;">50%</div>
                  <div style="font-size: 24px; font-weight: 800; text-transform: uppercase;">OFF</div>
                </div>
                <p style="margin: 0; color: #FFE4E1; font-size: 20px; font-weight: 600;">All Services • This Weekend Only!</p>
              </div>
            </td>
          </tr>

          <!-- Urgency Timer -->
          <tr>
            <td style="padding: 0;">
              <div style="background-color: #2C2C2C; padding: 20px; text-align: center;">
                <p style="margin: 0 0 15px; color: #FFD700; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Sale Ends In:</p>
                <table role="presentation" style="margin: 0 auto;">
                  <tr>
                    <td style="padding: 0 15px; text-align: center;">
                      <div style="background-color: #DC143C; padding: 15px 20px; border-radius: 8px;">
                        <div style="color: #FFFFFF; font-size: 32px; font-weight: 900; line-height: 1;">2</div>
                        <div style="color: #FFE4E1; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-top: 5px;">Days</div>
                      </div>
                    </td>
                    <td style="color: #FFD700; font-size: 24px; font-weight: 700;">:</td>
                    <td style="padding: 0 15px; text-align: center;">
                      <div style="background-color: #DC143C; padding: 15px 20px; border-radius: 8px;">
                        <div style="color: #FFFFFF; font-size: 32px; font-weight: 900; line-height: 1;">14</div>
                        <div style="color: #FFE4E1; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-top: 5px;">Hours</div>
                      </div>
                    </td>
                    <td style="color: #FFD700; font-size: 24px; font-weight: 700;">:</td>
                    <td style="padding: 0 15px; text-align: center;">
                      <div style="background-color: #DC143C; padding: 15px 20px; border-radius: 8px;">
                        <div style="color: #FFFFFF; font-size: 32px; font-weight: 900; line-height: 1;">35</div>
                        <div style="color: #FFE4E1; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-top: 5px;">Mins</div>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #2C2C2C; font-size: 28px; font-weight: 800; text-align: center;">Huge Savings on All Services!</h2>
              <p style="margin: 0 0 30px; color: #555555; font-size: 16px; line-height: 1.6; text-align: center;">Don't miss out on our biggest sale of the year. Save 50% on every service we offer!</p>
            </td>
          </tr>

          <!-- Service Cards -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <!-- Row 1 -->
                <tr>
                  <td style="width: 50%; padding: 10px 10px 10px 0;">
                    <div style="background-color: #FFF9E6; border: 2px solid #FFD700; padding: 20px; border-radius: 10px; height: 100%;">
                      <div style="font-size: 36px; margin-bottom: 10px;">🔧</div>
                      <h3 style="margin: 0 0 8px; color: #DC143C; font-size: 20px; font-weight: 800;">Plumbing</h3>
                      <p style="margin: 0 0 10px; color: #666666; font-size: 14px; line-height: 1.5;">Repairs, installations, maintenance</p>
                      <div style="text-decoration: line-through; color: #999999; font-size: 16px; margin-bottom: 5px;">$200</div>
                      <div style="color: #DC143C; font-size: 28px; font-weight: 900;">$100</div>
                    </div>
                  </td>
                  <td style="width: 50%; padding: 10px 0 10px 10px;">
                    <div style="background-color: #FFF9E6; border: 2px solid #FFD700; padding: 20px; border-radius: 10px; height: 100%;">
                      <div style="font-size: 36px; margin-bottom: 10px;">⚡</div>
                      <h3 style="margin: 0 0 8px; color: #DC143C; font-size: 20px; font-weight: 800;">Electrical</h3>
                      <p style="margin: 0 0 10px; color: #666666; font-size: 14px; line-height: 1.5;">Wiring, fixtures, panel upgrades</p>
                      <div style="text-decoration: line-through; color: #999999; font-size: 16px; margin-bottom: 5px;">$300</div>
                      <div style="color: #DC143C; font-size: 28px; font-weight: 900;">$150</div>
                    </div>
                  </td>
                </tr>
                <!-- Row 2 -->
                <tr>
                  <td style="width: 50%; padding: 10px 10px 10px 0;">
                    <div style="background-color: #FFF9E6; border: 2px solid #FFD700; padding: 20px; border-radius: 10px; height: 100%;">
                      <div style="font-size: 36px; margin-bottom: 10px;">❄️</div>
                      <h3 style="margin: 0 0 8px; color: #DC143C; font-size: 20px; font-weight: 800;">HVAC</h3>
                      <p style="margin: 0 0 10px; color: #666666; font-size: 14px; line-height: 1.5;">Heating & cooling services</p>
                      <div style="text-decoration: line-through; color: #999999; font-size: 16px; margin-bottom: 5px;">$250</div>
                      <div style="color: #DC143C; font-size: 28px; font-weight: 900;">$125</div>
                    </div>
                  </td>
                  <td style="width: 50%; padding: 10px 0 10px 10px;">
                    <div style="background-color: #FFF9E6; border: 2px solid #FFD700; padding: 20px; border-radius: 10px; height: 100%;">
                      <div style="font-size: 36px; margin-bottom: 10px;">🎨</div>
                      <h3 style="margin: 0 0 8px; color: #DC143C; font-size: 20px; font-weight: 800;">Painting</h3>
                      <p style="margin: 0 0 10px; color: #666666; font-size: 14px; line-height: 1.5;">Interior & exterior painting</p>
                      <div style="text-decoration: line-through; color: #999999; font-size: 16px; margin-bottom: 5px;">$400</div>
                      <div style="color: #DC143C; font-size: 28px; font-weight: 900;">$200</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bonus Offer -->
          <tr>
            <td style="padding: 30px 40px;">
              <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 25px; border-radius: 10px; text-align: center; box-shadow: 0 5px 20px rgba(255, 165, 0, 0.3);">
                <div style="background-color: #DC143C; color: #FFFFFF; display: inline-block; padding: 8px 20px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 15px;">Bonus Offer</div>
                <h3 style="margin: 0 0 10px; color: #2C2C2C; font-size: 24px; font-weight: 900;">FREE SERVICE CALL</h3>
                <p style="margin: 0; color: #4A3500; font-size: 16px; font-weight: 600;">with any service booked this weekend ($89 value)</p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center;">
              <a href="#" style="display: inline-block; padding: 22px 60px; background-color: #DC143C; color: #FFFFFF; text-decoration: none; font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; border-radius: 50px; box-shadow: 0 8px 25px rgba(220, 20, 60, 0.4);">Claim Your Discount Now!</a>
              <p style="margin: 20px 0 0; color: #DC143C; font-size: 14px; font-weight: 700;">⚡ Offer expires Sunday at midnight</p>
            </td>
          </tr>

          <!-- Terms -->
          <tr>
            <td style="padding: 30px 40px; background-color: #F9F9F9; border-top: 1px solid #E0E0E0;">
              <p style="margin: 0; color: #999999; font-size: 11px; line-height: 1.6; text-align: center;">*Offer valid for new bookings only. Cannot be combined with other offers. Minimum service charge applies. Valid through December 31, 2024.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #2C2C2C; text-align: center;">
              <p style="margin: 0 0 10px; color: #FFFFFF; font-size: 18px; font-weight: 700;">All-Pro Services</p>
              <p style="margin: 0 0 5px; color: #AAAAAA; font-size: 14px;">Call Now: (555) SAVE-NOW</p>
              <p style="margin: 0; color: #AAAAAA; font-size: 14px;">deals@allproservices.com</p>
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
