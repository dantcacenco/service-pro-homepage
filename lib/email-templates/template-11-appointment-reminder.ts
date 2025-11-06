// Template 11: Appointment Reminder (Service appointment reminder)
export const template11 = {
  id: 'template-11',
  name: 'Appointment Reminder',
  category: 'Scheduling',
  description: 'Service appointment reminder with calendar integration',
  thumbnail: '/templates/11.png',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F7F9FC;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 580px; margin: 0 auto; background-color: #FFFFFF; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); border-radius: 8px; overflow: hidden;">
          <!-- Icon Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background-color: #667EEA;">
              <div style="width: 80px; height: 80px; background-color: #FFFFFF; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 40px;">📅</div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: 600;">Appointment Reminder</h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 25px; color: #4A5568; font-size: 16px; line-height: 1.6;">Hi Sarah,</p>
              <p style="margin: 0 0 35px; color: #4A5568; font-size: 16px; line-height: 1.6;">This is a friendly reminder about your upcoming service appointment.</p>

              <!-- Appointment Card -->
              <div style="background-color: #F7FAFC; border-left: 4px solid #667EEA; padding: 25px; margin-bottom: 30px; border-radius: 4px;">
                <h2 style="margin: 0 0 20px; color: #2D3748; font-size: 20px; font-weight: 600;">Appointment Details</h2>

                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 0; vertical-align: top;">
                      <table role="presentation">
                        <tr>
                          <td style="width: 30px; color: #667EEA; font-size: 20px; padding-right: 12px; vertical-align: top;">📋</td>
                          <td style="vertical-align: top;">
                            <div style="color: #718096; font-size: 13px; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.5px;">Service</div>
                            <div style="color: #2D3748; font-size: 16px; font-weight: 600;">Annual HVAC Maintenance</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; vertical-align: top;">
                      <table role="presentation">
                        <tr>
                          <td style="width: 30px; color: #667EEA; font-size: 20px; padding-right: 12px; vertical-align: top;">📅</td>
                          <td style="vertical-align: top;">
                            <div style="color: #718096; font-size: 13px; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.5px;">Date & Time</div>
                            <div style="color: #2D3748; font-size: 16px; font-weight: 600;">Thursday, December 21, 2024</div>
                            <div style="color: #667EEA; font-size: 16px; font-weight: 600; margin-top: 3px;">2:00 PM - 4:00 PM</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; vertical-align: top;">
                      <table role="presentation">
                        <tr>
                          <td style="width: 30px; color: #667EEA; font-size: 20px; padding-right: 12px; vertical-align: top;">👨‍🔧</td>
                          <td style="vertical-align: top;">
                            <div style="color: #718096; font-size: 13px; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.5px;">Technician</div>
                            <div style="color: #2D3748; font-size: 16px; font-weight: 600;">Mike Johnson</div>
                            <div style="color: #718096; font-size: 14px; margin-top: 3px;">Senior HVAC Specialist</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; vertical-align: top;">
                      <table role="presentation">
                        <tr>
                          <td style="width: 30px; color: #667EEA; font-size: 20px; padding-right: 12px; vertical-align: top;">📍</td>
                          <td style="vertical-align: top;">
                            <div style="color: #718096; font-size: 13px; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.5px;">Location</div>
                            <div style="color: #2D3748; font-size: 16px; font-weight: 600;">123 Oak Street</div>
                            <div style="color: #718096; font-size: 14px; margin-top: 3px;">Springfield, IL 62701</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Action Buttons -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 8px; width: 50%;">
                    <a href="#" style="display: block; padding: 14px 20px; background-color: #667EEA; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; text-align: center; border-radius: 6px;">Add to Calendar</a>
                  </td>
                  <td style="padding: 8px; width: 50%;">
                    <a href="#" style="display: block; padding: 14px 20px; background-color: #FFFFFF; color: #667EEA; text-decoration: none; font-size: 14px; font-weight: 600; text-align: center; border: 2px solid #667EEA; border-radius: 6px;">Get Directions</a>
                  </td>
                </tr>
              </table>

              <!-- Important Info -->
              <div style="background-color: #FEF5E7; border: 1px solid #F39C12; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 12px; color: #D68910; font-size: 16px; font-weight: 600;">⚠️ Please Note:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #7D6608; font-size: 14px; line-height: 1.8;">
                  <li>Please ensure someone 18+ is home during the appointment</li>
                  <li>Clear access to HVAC unit is required</li>
                  <li>Estimated service time: 2 hours</li>
                </ul>
              </div>

              <p style="margin: 0 0 20px; color: #4A5568; font-size: 15px; line-height: 1.6;">Need to reschedule? No problem! Just click the button below or give us a call.</p>
            </td>
          </tr>

          <!-- Reschedule/Cancel -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <a href="#" style="display: inline-block; padding: 14px 35px; background-color: #FFFFFF; color: #E53E3E; text-decoration: none; font-size: 15px; font-weight: 600; border: 2px solid #E53E3E; border-radius: 6px; margin-right: 10px;">Reschedule</a>
              <a href="#" style="display: inline-block; padding: 14px 35px; background-color: #FFFFFF; color: #718096; text-decoration: none; font-size: 15px; font-weight: 600; border: 2px solid #CBD5E0; border-radius: 6px;">Cancel</a>
            </td>
          </tr>

          <!-- Contact Info -->
          <tr>
            <td style="padding: 30px 40px; background-color: #F7FAFC; border-top: 1px solid #E2E8F0;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="width: 50%; padding-right: 15px;">
                    <div style="color: #718096; font-size: 13px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Questions?</div>
                    <div style="color: #2D3748; font-size: 16px; font-weight: 600;">📞 (555) 123-4567</div>
                  </td>
                  <td style="width: 50%; padding-left: 15px; text-align: right;">
                    <div style="color: #718096; font-size: 13px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Email Us</div>
                    <div style="color: #667EEA; font-size: 16px; font-weight: 600;">service@hvacpro.com</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #2D3748;">
              <p style="margin: 0 0 8px; color: #FFFFFF; font-size: 18px; font-weight: 600;">HVAC Pro Services</p>
              <p style="margin: 0; color: #A0AEC0; font-size: 13px;">Your comfort is our priority</p>
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
