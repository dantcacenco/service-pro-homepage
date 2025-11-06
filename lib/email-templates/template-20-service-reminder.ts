// Template 20: Service Reminder (Annual service reminder with corporate professional styling)
export const template20 = {
  id: 'template-20',
  name: 'Service Reminder',
  category: 'Maintenance',
  description: 'Annual service reminder with corporate professional styling',
  thumbnail: '/templates/20.png',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', 'Helvetica', sans-serif; background-color: #FAFBFC;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #FAFBFC;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 680px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E1E4E8;">
          <!-- Professional Header -->
          <tr>
            <td style="padding: 0; background-color: #0366D6;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="padding: 35px 40px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="width: 70%; vertical-align: middle;">
                          <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Annual Service Due</h1>
                        </td>
                        <td style="width: 30%; vertical-align: middle; text-align: right;">
                          <div style="background-color: #FFFFFF; padding: 12px 20px; border-radius: 4px; display: inline-block;">
                            <div style="color: #0366D6; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Account</div>
                            <div style="color: #24292E; font-size: 16px; font-weight: 700;">#45892</div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Alert Banner -->
          <tr>
            <td style="padding: 0;">
              <div style="background-color: #FFF8E1; border-left: 5px solid #FFC107; padding: 18px 40px;">
                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="width: 40px; vertical-align: middle; font-size: 24px;">⏰</td>
                    <td style="vertical-align: middle;">
                      <strong style="color: #F9A825; font-size: 15px; font-weight: 700;">Scheduled Maintenance Due:</strong>
                      <span style="color: #5D4037; font-size: 15px; margin-left: 10px;">December 30, 2024</span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #24292E; font-size: 16px; line-height: 1.6;">Dear Mr. Anderson,</p>

              <p style="margin: 0 0 25px; color: #586069; font-size: 16px; line-height: 1.7;">This is a friendly reminder that your annual HVAC system maintenance is due. Regular service helps ensure optimal performance, energy efficiency, and extends the life of your equipment.</p>

              <p style="margin: 0 0 30px; color: #586069; font-size: 16px; line-height: 1.7;">Based on your service history, we recommend scheduling your appointment within the next 30 days to maintain your warranty coverage and system efficiency.</p>
            </td>
          </tr>

          <!-- Service Details Card -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="border: 2px solid #E1E4E8; border-radius: 6px; overflow: hidden;">
                <!-- Card Header -->
                <div style="background-color: #F6F8FA; padding: 20px 25px; border-bottom: 1px solid #E1E4E8;">
                  <h2 style="margin: 0; color: #24292E; font-size: 20px; font-weight: 600;">Service Information</h2>
                </div>

                <!-- Card Body -->
                <div style="padding: 25px;">
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #E1E4E8;">
                        <table role="presentation" style="width: 100%;">
                          <tr>
                            <td style="width: 40%; color: #6A737D; font-size: 14px; font-weight: 600;">Service Type:</td>
                            <td style="width: 60%; color: #24292E; font-size: 14px;">Annual HVAC Maintenance</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #E1E4E8;">
                        <table role="presentation" style="width: 100%;">
                          <tr>
                            <td style="width: 40%; color: #6A737D; font-size: 14px; font-weight: 600;">Equipment:</td>
                            <td style="width: 60%; color: #24292E; font-size: 14px;">Carrier Central AC & Furnace</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #E1E4E8;">
                        <table role="presentation" style="width: 100%;">
                          <tr>
                            <td style="width: 40%; color: #6A737D; font-size: 14px; font-weight: 600;">Last Service:</td>
                            <td style="width: 60%; color: #24292E; font-size: 14px;">January 15, 2024</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #E1E4E8;">
                        <table role="presentation" style="width: 100%;">
                          <tr>
                            <td style="width: 40%; color: #6A737D; font-size: 14px; font-weight: 600;">Service Contract:</td>
                            <td style="width: 60%; color: #28A745; font-size: 14px; font-weight: 600;">✓ Active</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0;">
                        <table role="presentation" style="width: 100%;">
                          <tr>
                            <td style="width: 40%; color: #6A737D; font-size: 14px; font-weight: 600;">Service Fee:</td>
                            <td style="width: 60%;">
                              <span style="color: #28A745; font-size: 16px; font-weight: 700;">$0.00</span>
                              <span style="color: #6A737D; font-size: 13px; margin-left: 8px;">(Covered by contract)</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>
              </div>
            </td>
          </tr>

          <!-- What's Included -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h3 style="margin: 0 0 20px; color: #24292E; font-size: 18px; font-weight: 600;">What's Included in Your Service:</h3>

              <table role="presentation" style="width: 100%; background-color: #F6F8FA; border-radius: 6px; padding: 20px;">
                <tr>
                  <td style="width: 50%; padding: 10px; vertical-align: top;">
                    <div style="margin-bottom: 12px;">
                      <span style="color: #28A745; font-size: 16px; margin-right: 8px;">✓</span>
                      <span style="color: #24292E; font-size: 14px;">Complete system inspection</span>
                    </div>
                    <div style="margin-bottom: 12px;">
                      <span style="color: #28A745; font-size: 16px; margin-right: 8px;">✓</span>
                      <span style="color: #24292E; font-size: 14px;">Filter replacement</span>
                    </div>
                    <div style="margin-bottom: 12px;">
                      <span style="color: #28A745; font-size: 16px; margin-right: 8px;">✓</span>
                      <span style="color: #24292E; font-size: 14px;">Thermostat calibration</span>
                    </div>
                    <div>
                      <span style="color: #28A745; font-size: 16px; margin-right: 8px;">✓</span>
                      <span style="color: #24292E; font-size: 14px;">Refrigerant level check</span>
                    </div>
                  </td>
                  <td style="width: 50%; padding: 10px; vertical-align: top;">
                    <div style="margin-bottom: 12px;">
                      <span style="color: #28A745; font-size: 16px; margin-right: 8px;">✓</span>
                      <span style="color: #24292E; font-size: 14px;">Electrical connection test</span>
                    </div>
                    <div style="margin-bottom: 12px;">
                      <span style="color: #28A745; font-size: 16px; margin-right: 8px;">✓</span>
                      <span style="color: #24292E; font-size: 14px;">Condenser coil cleaning</span>
                    </div>
                    <div style="margin-bottom: 12px;">
                      <span style="color: #28A745; font-size: 16px; margin-right: 8px;">✓</span>
                      <span style="color: #24292E; font-size: 14px;">Blower motor lubrication</span>
                    </div>
                    <div>
                      <span style="color: #28A745; font-size: 16px; margin-right: 8px;">✓</span>
                      <span style="color: #24292E; font-size: 14px;">Safety controls verification</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Scheduling Options -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h3 style="margin: 0 0 20px; color: #24292E; font-size: 18px; font-weight: 600;">Convenient Scheduling Options:</h3>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 0 10px 15px 0; width: 50%;">
                    <a href="#" style="display: block; padding: 20px; background-color: #0366D6; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; text-align: center; border-radius: 6px;">
                      📅 Schedule Online
                    </a>
                  </td>
                  <td style="padding: 0 0 15px 10px; width: 50%;">
                    <a href="#" style="display: block; padding: 20px; background-color: #FFFFFF; color: #0366D6; text-decoration: none; font-size: 15px; font-weight: 600; text-align: center; border: 2px solid #0366D6; border-radius: 6px;">
                      📞 Call (555) 123-4567
                    </a>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 0;">
                    <a href="#" style="display: block; padding: 20px; background-color: #F6F8FA; color: #24292E; text-decoration: none; font-size: 15px; font-weight: 600; text-align: center; border: 1px solid #E1E4E8; border-radius: 6px;">
                      ✉️ Reply to This Email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #6A737D; font-size: 13px; text-align: center;">Preferred time slots available: Weekdays 8 AM - 6 PM | Saturdays 9 AM - 3 PM</p>
            </td>
          </tr>

          <!-- Benefits Banner -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background: linear-gradient(135deg, #0366D6 0%, #0256C2 100%); padding: 30px; border-radius: 8px; text-align: center;">
                <h3 style="margin: 0 0 15px; color: #FFFFFF; font-size: 22px; font-weight: 700;">Service Contract Benefits</h3>

                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="width: 33.33%; padding: 15px; text-align: center; border-right: 1px solid rgba(255, 255, 255, 0.2);">
                      <div style="font-size: 32px; margin-bottom: 8px;">💰</div>
                      <div style="color: #FFFFFF; font-size: 16px; font-weight: 700; margin-bottom: 5px;">Save 20%</div>
                      <div style="color: #C7E0FF; font-size: 12px;">On all repairs</div>
                    </td>
                    <td style="width: 33.33%; padding: 15px; text-align: center; border-right: 1px solid rgba(255, 255, 255, 0.2);">
                      <div style="font-size: 32px; margin-bottom: 8px;">🎯</div>
                      <div style="color: #FFFFFF; font-size: 16px; font-weight: 700; margin-bottom: 5px;">Priority</div>
                      <div style="color: #C7E0FF; font-size: 12px;">Service scheduling</div>
                    </td>
                    <td style="width: 33.33%; padding: 15px; text-align: center;">
                      <div style="font-size: 32px; margin-bottom: 8px;">🛡️</div>
                      <div style="color: #FFFFFF; font-size: 16px; font-weight: 700; margin-bottom: 5px;">Extended</div>
                      <div style="color: #C7E0FF; font-size: 12px;">Warranty coverage</div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Contact Section -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <div style="background-color: #F6F8FA; border: 1px solid #E1E4E8; border-radius: 6px; padding: 25px;">
                <h4 style="margin: 0 0 15px; color: #24292E; font-size: 16px; font-weight: 600;">Questions? We're Here to Help</h4>

                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="width: 50%; padding-right: 15px;">
                      <div style="margin-bottom: 10px;">
                        <span style="color: #6A737D; font-size: 13px; font-weight: 600;">Phone:</span>
                        <div style="color: #0366D6; font-size: 15px; font-weight: 600;">(555) 123-4567</div>
                      </div>
                      <div>
                        <span style="color: #6A737D; font-size: 13px; font-weight: 600;">Email:</span>
                        <div style="color: #0366D6; font-size: 15px; font-weight: 600;">service@techpro.com</div>
                      </div>
                    </td>
                    <td style="width: 50%; padding-left: 15px;">
                      <div style="margin-bottom: 10px;">
                        <span style="color: #6A737D; font-size: 13px; font-weight: 600;">Hours:</span>
                        <div style="color: #24292E; font-size: 14px;">Mon-Fri: 7 AM - 7 PM</div>
                      </div>
                      <div>
                        <span style="color: #6A737D; font-size: 13px; font-weight: 600;">Emergency:</span>
                        <div style="color: #D73A49; font-size: 14px; font-weight: 600;">24/7 Available</div>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #24292E; text-align: center;">
              <table role="presentation" style="width: 100%; margin-bottom: 20px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 5px; color: #FFFFFF; font-size: 20px; font-weight: 700;">TechPro Service Solutions</p>
                    <p style="margin: 0 0 15px; color: #959DA5; font-size: 13px;">Professional HVAC & Home Services</p>
                  </td>
                </tr>
              </table>

              <table role="presentation" style="width: 100%; border-top: 1px solid #444D56; padding-top: 20px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 5px; color: #959DA5; font-size: 13px;">1234 Service Drive, Suite 100 | Your City, ST 12345</p>
                    <p style="margin: 0 0 15px; color: #959DA5; font-size: 13px;">www.techproservices.com</p>
                    <p style="margin: 0; color: #6A737D; font-size: 12px;">
                      This is an automated reminder. Please do not reply directly to this email.<br>
                      <a href="#" style="color: #0366D6; text-decoration: underline;">Manage Email Preferences</a>
                    </p>
                  </td>
                </tr>
              </table>
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
