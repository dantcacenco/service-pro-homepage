// Template 19: Welcome Customer (New customer onboarding welcome email)
export const template19 = {
  id: 'template-19',
  name: 'Welcome Customer',
  category: 'Onboarding',
  description: 'New customer onboarding welcome email',
  thumbnail: '/templates/19.png',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', Helvetica, sans-serif; background-color: #F0F2F5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 650px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
          <!-- Confetti Header -->
          <tr>
            <td style="padding: 0; background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); text-align: center; position: relative;">
              <div style="padding: 50px 40px;">
                <div style="font-size: 70px; margin-bottom: 20px;">🎊</div>
                <h1 style="margin: 0 0 15px; color: #FFFFFF; font-size: 40px; font-weight: 800;">Welcome Aboard!</h1>
                <p style="margin: 0; color: #E9D5FF; font-size: 18px; font-weight: 500;">We're thrilled to have you as a customer</p>
              </div>

              <!-- Wave Divider -->
              <svg viewBox="0 0 1200 100" style="display: block; width: 100%; height: 50px; margin-top: -1px;">
                <path d="M0,50 Q300,80 600,50 T1200,50 L1200,100 L0,100 Z" fill="#FFFFFF"/>
              </svg>
            </td>
          </tr>

          <!-- Main Welcome Message -->
          <tr>
            <td style="padding: 40px 45px 35px;">
              <h2 style="margin: 0 0 25px; color: #667EEA; font-size: 28px; font-weight: 700; text-align: center;">Thank You for Choosing Us!</h2>

              <p style="margin: 0 0 20px; color: #374151; font-size: 17px; line-height: 1.7;">Hi Jessica,</p>

              <p style="margin: 0 0 20px; color: #374151; font-size: 17px; line-height: 1.7;">Welcome to the ServiceMaster family! We're excited to begin this journey with you and can't wait to exceed your expectations.</p>

              <p style="margin: 0 0 25px; color: #374151; font-size: 17px; line-height: 1.7;">Your trust means everything to us, and we're committed to providing you with exceptional service every step of the way.</p>
            </td>
          </tr>

          <!-- What Happens Next -->
          <tr>
            <td style="padding: 0 45px 35px;">
              <div style="background-color: #F9FAFB; padding: 35px; border-radius: 10px; border-left: 5px solid #667EEA;">
                <h3 style="margin: 0 0 25px; color: #1F2937; font-size: 22px; font-weight: 700;">What Happens Next?</h3>

                <table role="presentation" style="width: 100%;">
                  <!-- Step 1 -->
                  <tr>
                    <td style="padding-bottom: 25px;">
                      <table role="presentation">
                        <tr>
                          <td style="width: 60px; vertical-align: top;">
                            <div style="width: 50px; height: 50px; background-color: #667EEA; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 22px; font-weight: 900;">1</div>
                          </td>
                          <td style="padding-left: 15px; vertical-align: top;">
                            <h4 style="margin: 0 0 8px; color: #1F2937; font-size: 18px; font-weight: 700;">Account Setup Complete</h4>
                            <p style="margin: 0; color: #6B7280; font-size: 15px; line-height: 1.6;">Your customer account is ready. Check your email for login credentials.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Step 2 -->
                  <tr>
                    <td style="padding-bottom: 25px;">
                      <table role="presentation">
                        <tr>
                          <td style="width: 60px; vertical-align: top;">
                            <div style="width: 50px; height: 50px; background-color: #667EEA; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 22px; font-weight: 900;">2</div>
                          </td>
                          <td style="padding-left: 15px; vertical-align: top;">
                            <h4 style="margin: 0 0 8px; color: #1F2937; font-size: 18px; font-weight: 700;">Welcome Call Scheduled</h4>
                            <p style="margin: 0; color: #6B7280; font-size: 15px; line-height: 1.6;">Our team will call you within 24 hours to introduce ourselves.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Step 3 -->
                  <tr>
                    <td>
                      <table role="presentation">
                        <tr>
                          <td style="width: 60px; vertical-align: top;">
                            <div style="width: 50px; height: 50px; background-color: #667EEA; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 22px; font-weight: 900;">3</div>
                          </td>
                          <td style="padding-left: 15px; vertical-align: top;">
                            <h4 style="margin: 0 0 8px; color: #1F2937; font-size: 18px; font-weight: 700;">First Appointment Confirmed</h4>
                            <p style="margin: 0; color: #6B7280; font-size: 15px; line-height: 1.6;">Wednesday, Dec 20 at 2:00 PM - We'll send a reminder!</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Quick Links -->
          <tr>
            <td style="padding: 0 45px 35px;">
              <h3 style="margin: 0 0 20px; color: #1F2937; font-size: 22px; font-weight: 700; text-align: center;">Quick Start Guide</h3>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 50%; padding: 10px;">
                    <a href="#" style="display: block; padding: 25px 20px; background-color: #EEF2FF; color: #667EEA; text-decoration: none; border-radius: 8px; text-align: center; border: 2px solid #C7D2FE;">
                      <div style="font-size: 36px; margin-bottom: 10px;">📱</div>
                      <div style="font-size: 16px; font-weight: 700; margin-bottom: 5px;">Download Our App</div>
                      <div style="font-size: 13px; color: #6B7280;">iOS & Android</div>
                    </a>
                  </td>
                  <td style="width: 50%; padding: 10px;">
                    <a href="#" style="display: block; padding: 25px 20px; background-color: #EEF2FF; color: #667EEA; text-decoration: none; border-radius: 8px; text-align: center; border: 2px solid #C7D2FE;">
                      <div style="font-size: 36px; margin-bottom: 10px;">👤</div>
                      <div style="font-size: 16px; font-weight: 700; margin-bottom: 5px;">Access Portal</div>
                      <div style="font-size: 13px; color: #6B7280;">Manage Services</div>
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="width: 50%; padding: 10px;">
                    <a href="#" style="display: block; padding: 25px 20px; background-color: #EEF2FF; color: #667EEA; text-decoration: none; border-radius: 8px; text-align: center; border: 2px solid #C7D2FE;">
                      <div style="font-size: 36px; margin-bottom: 10px;">📚</div>
                      <div style="font-size: 16px; font-weight: 700; margin-bottom: 5px;">Resource Center</div>
                      <div style="font-size: 13px; color: #6B7280;">Tips & Guides</div>
                    </a>
                  </td>
                  <td style="width: 50%; padding: 10px;">
                    <a href="#" style="display: block; padding: 25px 20px; background-color: #EEF2FF; color: #667EEA; text-decoration: none; border-radius: 8px; text-align: center; border: 2px solid #C7D2FE;">
                      <div style="font-size: 36px; margin-bottom: 10px;">💬</div>
                      <div style="font-size: 16px; font-weight: 700; margin-bottom: 5px;">Live Support</div>
                      <div style="font-size: 13px; color: #6B7280;">Chat With Us</div>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Special Welcome Offer -->
          <tr>
            <td style="padding: 0 45px 35px;">
              <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 35px; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                <div style="background-color: rgba(255, 255, 255, 0.9); display: inline-block; padding: 10px 25px; border-radius: 25px; margin-bottom: 20px;">
                  <span style="color: #059669; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Welcome Gift</span>
                </div>

                <h3 style="margin: 0 0 15px; color: #FFFFFF; font-size: 32px; font-weight: 900;">15% OFF</h3>
                <p style="margin: 0 0 20px; color: #D1FAE5; font-size: 17px; font-weight: 600;">Your First Service</p>

                <div style="background-color: rgba(255, 255, 255, 0.15); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                  <div style="color: #FFFFFF; font-size: 13px; font-weight: 600; margin-bottom: 5px;">Use Code:</div>
                  <div style="color: #FFFFFF; font-size: 28px; font-weight: 900; letter-spacing: 3px; font-family: 'Courier New', monospace;">WELCOME15</div>
                </div>

                <p style="margin: 0; color: #D1FAE5; font-size: 14px;">Valid for 30 days • Cannot be combined with other offers</p>
              </div>
            </td>
          </tr>

          <!-- Meet Your Team -->
          <tr>
            <td style="padding: 0 45px 35px;">
              <h3 style="margin: 0 0 25px; color: #1F2937; font-size: 22px; font-weight: 700; text-align: center;">Meet Your Dedicated Team</h3>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 50%; padding: 15px; text-align: center;">
                    <div style="width: 90px; height: 90px; background-color: #667EEA; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 36px; font-weight: 700;">AM</div>
                    <div style="color: #1F2937; font-size: 17px; font-weight: 700; margin-bottom: 5px;">Amy Martinez</div>
                    <div style="color: #667EEA; font-size: 14px; font-weight: 600; margin-bottom: 8px;">Account Manager</div>
                    <div style="color: #6B7280; font-size: 13px;">Your main point of contact</div>
                  </td>
                  <td style="width: 50%; padding: 15px; text-align: center;">
                    <div style="width: 90px; height: 90px; background-color: #764BA2; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 36px; font-weight: 700;">JL</div>
                    <div style="color: #1F2937; font-size: 17px; font-weight: 700; margin-bottom: 5px;">James Liu</div>
                    <div style="color: #764BA2; font-size: 14px; font-weight: 600; margin-bottom: 8px;">Lead Technician</div>
                    <div style="color: #6B7280; font-size: 13px;">Certified & experienced</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Important Info -->
          <tr>
            <td style="padding: 0 45px 35px;">
              <div style="background-color: #FEF3C7; border-left: 5px solid #F59E0B; padding: 25px; border-radius: 5px;">
                <h4 style="margin: 0 0 15px; color: #92400E; font-size: 18px; font-weight: 700;">📌 Important Information</h4>
                <ul style="margin: 0; padding-left: 20px; color: #78350F; font-size: 14px; line-height: 1.9;">
                  <li>Save our number: (555) 123-4567</li>
                  <li>Add us to your contacts for easy access</li>
                  <li>Check your spam folder for important updates</li>
                  <li>Download our app for the best experience</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 45px 40px; text-align: center;">
              <h3 style="margin: 0 0 20px; color: #1F2937; font-size: 20px; font-weight: 700;">Ready to Get Started?</h3>
              <a href="#" style="display: inline-block; padding: 18px 50px; background-color: #667EEA; color: #FFFFFF; text-decoration: none; font-size: 17px; font-weight: 700; border-radius: 50px; box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);">Complete Your Profile</a>
            </td>
          </tr>

          <!-- Social Media -->
          <tr>
            <td style="padding: 0 45px 35px;">
              <div style="border-top: 2px solid #E5E7EB; padding-top: 30px; text-align: center;">
                <p style="margin: 0 0 20px; color: #6B7280; font-size: 15px; font-weight: 600;">Stay Connected With Us</p>

                <table role="presentation" style="margin: 0 auto;">
                  <tr>
                    <td style="padding: 0 12px;">
                      <a href="#" style="display: inline-block; width: 45px; height: 45px; background-color: #3B5998; border-radius: 50%; color: #FFFFFF; text-decoration: none; font-size: 22px; line-height: 45px; text-align: center;">f</a>
                    </td>
                    <td style="padding: 0 12px;">
                      <a href="#" style="display: inline-block; width: 45px; height: 45px; background-color: #1DA1F2; border-radius: 50%; color: #FFFFFF; text-decoration: none; font-size: 22px; line-height: 45px; text-align: center;">t</a>
                    </td>
                    <td style="padding: 0 12px;">
                      <a href="#" style="display: inline-block; width: 45px; height: 45px; background-color: #E4405F; border-radius: 50%; color: #FFFFFF; text-decoration: none; font-size: 22px; line-height: 45px; text-align: center;">📷</a>
                    </td>
                    <td style="padding: 0 12px;">
                      <a href="#" style="display: inline-block; width: 45px; height: 45px; background-color: #0A66C2; border-radius: 50%; color: #FFFFFF; text-decoration: none; font-size: 22px; line-height: 45px; text-align: center;">in</a>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 40px 45px; background: linear-gradient(135deg, #1F2937 0%, #111827 100%); text-align: center;">
              <p style="margin: 0 0 15px; color: #FFFFFF; font-size: 24px; font-weight: 800;">ServiceMaster Pro</p>
              <p style="margin: 0 0 20px; color: #9CA3AF; font-size: 15px;">Welcome to excellence in home service</p>

              <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 5px; color: #D1D5DB; font-size: 14px;">📞 (555) 123-4567</p>
                <p style="margin: 0 0 5px; color: #D1D5DB; font-size: 14px;">✉️ support@servicemasterpro.com</p>
                <p style="margin: 0; color: #D1D5DB; font-size: 14px;">🌐 www.servicemasterpro.com</p>
              </div>

              <p style="margin: 0; color: #6B7280; font-size: 12px;">© 2024 ServiceMaster Pro. All rights reserved.</p>
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
