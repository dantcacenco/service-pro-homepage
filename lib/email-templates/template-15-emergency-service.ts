// Template 15: Emergency Service (24/7 emergency service with urgent styling)
export const template15 = {
  id: 'template-15',
  name: 'Emergency Service',
  category: 'Emergency',
  description: '24/7 emergency service template with urgent styling',
  thumbnail: '/templates/15.png',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #1A1A1A;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #1A1A1A;">
    <tr>
      <td style="padding: 30px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF;">
          <!-- Urgent Alert Banner -->
          <tr>
            <td style="padding: 0;">
              <div style="background-color: #FF0000; padding: 15px; text-align: center;">
                <table role="presentation" style="margin: 0 auto;">
                  <tr>
                    <td style="padding-right: 10px; font-size: 24px;">🚨</td>
                    <td>
                      <div style="color: #FFFFFF; font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">24/7 Emergency Service Available</div>
                    </td>
                    <td style="padding-left: 10px; font-size: 24px;">🚨</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Flashing Border Effect -->
          <tr>
            <td style="padding: 0;">
              <div style="height: 8px; background: repeating-linear-gradient(90deg, #FFD700 0px, #FFD700 30px, #FF0000 30px, #FF0000 60px);"></div>
            </td>
          </tr>

          <!-- Main Header -->
          <tr>
            <td style="padding: 50px 40px 40px; text-align: center; background-color: #2C2C2C;">
              <div style="font-size: 80px; margin-bottom: 20px; animation: pulse 1.5s infinite;">⚠️</div>
              <h1 style="margin: 0 0 15px; color: #FF0000; font-size: 42px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">EMERGENCY?</h1>
              <h2 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: 700;">We're Here to Help 24/7</h2>
            </td>
          </tr>

          <!-- Emergency Contact - Large CTA -->
          <tr>
            <td style="padding: 40px; background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%); text-align: center;">
              <p style="margin: 0 0 20px; color: #FFFFFF; font-size: 20px; font-weight: 700; text-transform: uppercase;">Call Now For Immediate Assistance</p>

              <a href="tel:555-911-HELP" style="display: block; padding: 30px; background-color: #FFD700; color: #CC0000; text-decoration: none; font-size: 48px; font-weight: 900; border-radius: 15px; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4); margin-bottom: 20px; letter-spacing: 2px;">
                📞 555-911-HELP
              </a>

              <p style="margin: 0; color: #FFE4E1; font-size: 16px; font-weight: 600;">Available 24 Hours • 7 Days a Week • 365 Days a Year</p>
            </td>
          </tr>

          <!-- Emergency Services -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 30px; color: #2C2C2C; font-size: 28px; font-weight: 800; text-align: center;">Emergency Services We Handle:</h2>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <!-- Service 1 -->
                <tr>
                  <td style="padding: 20px; background-color: #FFF3F3; border-left: 6px solid #FF0000; margin-bottom: 15px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="width: 60px; font-size: 40px; vertical-align: top;">💧</td>
                        <td style="vertical-align: top;">
                          <h3 style="margin: 0 0 8px; color: #CC0000; font-size: 20px; font-weight: 800;">Burst Pipes & Water Leaks</h3>
                          <p style="margin: 0; color: #555555; font-size: 15px; line-height: 1.5;">Fast response to prevent water damage</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr><td style="height: 15px;"></td></tr>

                <!-- Service 2 -->
                <tr>
                  <td style="padding: 20px; background-color: #FFF3F3; border-left: 6px solid #FF0000; margin-bottom: 15px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="width: 60px; font-size: 40px; vertical-align: top;">⚡</td>
                        <td style="vertical-align: top;">
                          <h3 style="margin: 0 0 8px; color: #CC0000; font-size: 20px; font-weight: 800;">Electrical Emergencies</h3>
                          <p style="margin: 0; color: #555555; font-size: 15px; line-height: 1.5;">Power outages, sparking outlets, panel issues</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr><td style="height: 15px;"></td></tr>

                <!-- Service 3 -->
                <tr>
                  <td style="padding: 20px; background-color: #FFF3F3; border-left: 6px solid #FF0000; margin-bottom: 15px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="width: 60px; font-size: 40px; vertical-align: top;">❄️</td>
                        <td style="vertical-align: top;">
                          <h3 style="margin: 0 0 8px; color: #CC0000; font-size: 20px; font-weight: 800;">AC/Heating Failure</h3>
                          <p style="margin: 0; color: #555555; font-size: 15px; line-height: 1.5;">No heat in winter, no AC in summer</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr><td style="height: 15px;"></td></tr>

                <!-- Service 4 -->
                <tr>
                  <td style="padding: 20px; background-color: #FFF3F3; border-left: 6px solid #FF0000;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="width: 60px; font-size: 40px; vertical-align: top;">🔥</td>
                        <td style="vertical-align: top;">
                          <h3 style="margin: 0 0 8px; color: #CC0000; font-size: 20px; font-weight: 800;">Gas Leaks & Safety Issues</h3>
                          <p style="margin: 0; color: #555555; font-size: 15px; line-height: 1.5;">Immediate response for safety hazards</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Why Choose Us -->
          <tr>
            <td style="padding: 40px; background-color: #F9F9F9;">
              <h3 style="margin: 0 0 25px; color: #2C2C2C; font-size: 24px; font-weight: 800; text-align: center;">Why Call Us in an Emergency?</h3>

              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="width: 50%; padding: 15px;">
                    <div style="text-align: center;">
                      <div style="font-size: 40px; margin-bottom: 10px;">⏱️</div>
                      <div style="color: #CC0000; font-size: 20px; font-weight: 800; margin-bottom: 5px;">30-Min Response</div>
                      <div style="color: #666666; font-size: 14px;">Average arrival time</div>
                    </div>
                  </td>
                  <td style="width: 50%; padding: 15px;">
                    <div style="text-align: center;">
                      <div style="font-size: 40px; margin-bottom: 10px;">👨‍🔧</div>
                      <div style="color: #CC0000; font-size: 20px; font-weight: 800; margin-bottom: 5px;">Licensed Experts</div>
                      <div style="color: #666666; font-size: 14px;">Certified technicians</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="width: 50%; padding: 15px;">
                    <div style="text-align: center;">
                      <div style="font-size: 40px; margin-bottom: 10px;">🚐</div>
                      <div style="color: #CC0000; font-size: 20px; font-weight: 800; margin-bottom: 5px;">Fully Stocked</div>
                      <div style="color: #666666; font-size: 14px;">Ready to fix on-site</div>
                    </div>
                  </td>
                  <td style="width: 50%; padding: 15px;">
                    <div style="text-align: center;">
                      <div style="font-size: 40px; margin-bottom: 10px;">✅</div>
                      <div style="color: #CC0000; font-size: 20px; font-weight: 800; margin-bottom: 5px;">Guaranteed Work</div>
                      <div style="color: #666666; font-size: 14px;">100% satisfaction</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Safety Notice -->
          <tr>
            <td style="padding: 30px 40px;">
              <div style="background-color: #FFF3CD; border: 3px solid #FFC107; padding: 25px; border-radius: 10px;">
                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="width: 60px; font-size: 50px; vertical-align: top;">⚠️</td>
                    <td style="vertical-align: top; padding-left: 15px;">
                      <h4 style="margin: 0 0 10px; color: #7D6608; font-size: 18px; font-weight: 800;">SAFETY FIRST</h4>
                      <p style="margin: 0; color: #7D6608; font-size: 14px; line-height: 1.7;">
                        <strong>Gas leak?</strong> Evacuate immediately and call from outside.<br>
                        <strong>Electrical emergency?</strong> Turn off power at the main breaker if safe.<br>
                        <strong>Water leak?</strong> Shut off main water valve to prevent damage.
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Final CTA -->
          <tr>
            <td style="padding: 40px; text-align: center; background-color: #2C2C2C;">
              <h3 style="margin: 0 0 25px; color: #FFFFFF; font-size: 26px; font-weight: 800;">Don't Wait - Call Now!</h3>
              <a href="tel:555-911-HELP" style="display: inline-block; padding: 22px 50px; background-color: #FF0000; color: #FFFFFF; text-decoration: none; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; border-radius: 50px; box-shadow: 0 8px 25px rgba(255, 0, 0, 0.5);">
                📞 555-911-HELP
              </a>
              <p style="margin: 25px 0 0; color: #CCCCCC; font-size: 14px;">Or text "EMERGENCY" to 555-0123</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #000000; text-align: center;">
              <p style="margin: 0 0 10px; color: #FF0000; font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Emergency Response Team</p>
              <p style="margin: 0 0 5px; color: #CCCCCC; font-size: 14px;">Serving your community since 1985</p>
              <p style="margin: 0; color: #999999; font-size: 13px;">Licensed • Bonded • Insured</p>
            </td>
          </tr>

          <!-- Bottom Alert Bar -->
          <tr>
            <td style="padding: 0;">
              <div style="background-color: #FFD700; padding: 12px; text-align: center;">
                <p style="margin: 0; color: #CC0000; font-size: 14px; font-weight: 900; text-transform: uppercase;">⚡ Fastest Response Time in the Area ⚡</p>
              </div>
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
