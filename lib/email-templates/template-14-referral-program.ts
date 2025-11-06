// Template 14: Referral Program (Referral rewards template)
export const template14 = {
  id: 'template-14',
  name: 'Referral Program',
  category: 'Marketing',
  description: 'Referral rewards template with incentive details',
  thumbnail: '/templates/14.png',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', Helvetica, sans-serif; background-color: #E8F4F8;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 15px; overflow: hidden; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);">
          <!-- Header with Illustration -->
          <tr>
            <td style="padding: 0; background: linear-gradient(135deg, #00B8D4 0%, #0097A7 100%); text-align: center;">
              <div style="padding: 50px 40px 40px;">
                <div style="font-size: 70px; margin-bottom: 20px;">🤝</div>
                <h1 style="margin: 0 0 15px; color: #FFFFFF; font-size: 38px; font-weight: 900; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">REFER A FRIEND</h1>
                <p style="margin: 0; color: #B2EBF2; font-size: 20px; font-weight: 600;">Get Rewarded for Sharing!</p>
              </div>

              <!-- Wave Effect -->
              <svg viewBox="0 0 1200 120" style="display: block; width: 100%; height: 60px;">
                <path d="M0,60 C300,90 600,30 900,60 L900,120 L0,120 Z" fill="#FFFFFF"/>
              </svg>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #00838F; font-size: 26px; font-weight: 700; text-align: center;">Share the Love, Earn Rewards!</h2>
              <p style="margin: 0 0 20px; color: #555555; font-size: 17px; line-height: 1.7; text-align: center;">Know someone who could use our services? Refer them and you'll both get amazing benefits!</p>
            </td>
          </tr>

          <!-- Rewards Section -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <div style="background: linear-gradient(135deg, #FFF9C4 0%, #FFF59D 100%); border-radius: 15px; padding: 35px; text-align: center; box-shadow: 0 4px 15px rgba(255, 235, 59, 0.3);">
                <div style="font-size: 50px; margin-bottom: 15px;">💰</div>
                <h3 style="margin: 0 0 10px; color: #F57F17; font-size: 28px; font-weight: 900;">You Get $100</h3>
                <p style="margin: 0 0 20px; color: #7D6608; font-size: 16px; font-weight: 600;">For every friend who books a service</p>

                <div style="margin: 20px 0; font-size: 30px; color: #F57F17;">+</div>

                <div style="font-size: 50px; margin-bottom: 15px;">🎁</div>
                <h3 style="margin: 0 0 10px; color: #F57F17; font-size: 28px; font-weight: 900;">They Get $50 OFF</h3>
                <p style="margin: 0; color: #7D6608; font-size: 16px; font-weight: 600;">Their first service with us</p>
              </div>
            </td>
          </tr>

          <!-- How It Works -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <h3 style="margin: 0 0 30px; color: #00838F; font-size: 24px; font-weight: 700; text-align: center;">How It Works</h3>

              <table role="presentation" style="width: 100%;">
                <!-- Step 1 -->
                <tr>
                  <td style="padding-bottom: 25px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="width: 70px; vertical-align: top;">
                          <div style="width: 60px; height: 60px; background-color: #00B8D4; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 28px; font-weight: 900; box-shadow: 0 4px 10px rgba(0, 184, 212, 0.3);">1</div>
                        </td>
                        <td style="vertical-align: top; padding-left: 15px;">
                          <h4 style="margin: 0 0 8px; color: #00838F; font-size: 18px; font-weight: 700;">Share Your Unique Link</h4>
                          <p style="margin: 0; color: #666666; font-size: 15px; line-height: 1.6;">Send your personal referral link to friends, family, or colleagues via email, text, or social media.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Step 2 -->
                <tr>
                  <td style="padding-bottom: 25px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="width: 70px; vertical-align: top;">
                          <div style="width: 60px; height: 60px; background-color: #00B8D4; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 28px; font-weight: 900; box-shadow: 0 4px 10px rgba(0, 184, 212, 0.3);">2</div>
                        </td>
                        <td style="vertical-align: top; padding-left: 15px;">
                          <h4 style="margin: 0 0 8px; color: #00838F; font-size: 18px; font-weight: 700;">They Book a Service</h4>
                          <p style="margin: 0; color: #666666; font-size: 15px; line-height: 1.6;">Your friend uses your link to book any service and automatically gets $50 off their first job.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Step 3 -->
                <tr>
                  <td>
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="width: 70px; vertical-align: top;">
                          <div style="width: 60px; height: 60px; background-color: #00B8D4; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 28px; font-weight: 900; box-shadow: 0 4px 10px rgba(0, 184, 212, 0.3);">3</div>
                        </td>
                        <td style="vertical-align: top; padding-left: 15px;">
                          <h4 style="margin: 0 0 8px; color: #00838F; font-size: 18px; font-weight: 700;">You Get Rewarded!</h4>
                          <p style="margin: 0; color: #666666; font-size: 15px; line-height: 1.6;">Once the service is completed, we'll send you $100 via check, PayPal, or credit to your account.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Unique Link -->
          <tr>
            <td style="padding: 0 40px 35px;">
              <div style="background-color: #E0F7FA; border: 2px dashed #00B8D4; border-radius: 10px; padding: 25px; text-align: center;">
                <p style="margin: 0 0 15px; color: #00838F; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Your Unique Referral Link</p>
                <div style="background-color: #FFFFFF; padding: 15px; border-radius: 8px; margin-bottom: 15px; font-family: 'Courier New', monospace; word-break: break-all;">
                  <a href="#" style="color: #00B8D4; font-size: 16px; font-weight: 600; text-decoration: none;">servicepro.com/ref/SARAH2024</a>
                </div>
                <a href="#" style="display: inline-block; padding: 12px 30px; background-color: #00B8D4; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 25px;">📋 Copy Link</a>
              </div>
            </td>
          </tr>

          <!-- Share Buttons -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <h3 style="margin: 0 0 20px; color: #00838F; font-size: 20px; font-weight: 700; text-align: center;">Share Now:</h3>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; width: 33.33%; text-align: center;">
                    <a href="#" style="display: block; padding: 15px; background-color: #1877F2; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 8px;">
                      <div style="font-size: 24px; margin-bottom: 5px;">📘</div>
                      Facebook
                    </a>
                  </td>
                  <td style="padding: 8px; width: 33.33%; text-align: center;">
                    <a href="#" style="display: block; padding: 15px; background-color: #25D366; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 8px;">
                      <div style="font-size: 24px; margin-bottom: 5px;">💬</div>
                      WhatsApp
                    </a>
                  </td>
                  <td style="padding: 8px; width: 33.33%; text-align: center;">
                    <a href="#" style="display: block; padding: 15px; background-color: #EA4335; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 8px;">
                      <div style="font-size: 24px; margin-bottom: 5px;">📧</div>
                      Email
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Stats/Social Proof -->
          <tr>
            <td style="padding: 30px 40px; background-color: #F5F5F5;">
              <h3 style="margin: 0 0 25px; color: #00838F; font-size: 20px; font-weight: 700; text-align: center;">Referral Program Impact</h3>

              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="width: 33.33%; text-align: center; padding: 15px;">
                    <div style="color: #00B8D4; font-size: 36px; font-weight: 900; margin-bottom: 5px;">2,450</div>
                    <div style="color: #666666; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Successful Referrals</div>
                  </td>
                  <td style="width: 33.33%; text-align: center; padding: 15px; border-left: 1px solid #DDDDDD; border-right: 1px solid #DDDDDD;">
                    <div style="color: #00B8D4; font-size: 36px; font-weight: 900; margin-bottom: 5px;">$245K</div>
                    <div style="color: #666666; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Rewards Paid Out</div>
                  </td>
                  <td style="width: 33.33%; text-align: center; padding: 15px;">
                    <div style="color: #00B8D4; font-size: 36px; font-weight: 900; margin-bottom: 5px;">98%</div>
                    <div style="color: #666666; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Happy Referrers</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 40px; text-align: center;">
              <a href="#" style="display: inline-block; padding: 20px 50px; background-color: #00B8D4; color: #FFFFFF; text-decoration: none; font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; border-radius: 50px; box-shadow: 0 6px 20px rgba(0, 184, 212, 0.4);">Start Referring Today!</a>
              <p style="margin: 20px 0 0; color: #999999; font-size: 13px;">Unlimited referrals • No expiration date</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 35px 40px; background-color: #00838F; text-align: center;">
              <p style="margin: 0 0 10px; color: #FFFFFF; font-size: 22px; font-weight: 700;">Service Pro</p>
              <p style="margin: 0 0 15px; color: #B2EBF2; font-size: 14px;">Helping neighbors help neighbors</p>
              <p style="margin: 0 0 5px; color: #80DEEA; font-size: 13px;">(555) 100-REFER</p>
              <p style="margin: 0; color: #80DEEA; font-size: 13px;">referrals@servicepro.com</p>
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
