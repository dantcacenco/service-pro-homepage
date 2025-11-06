// Template 18: Quote Follow-up (Sales follow-up for quotes/estimates)
export const template18 = {
  id: 'template-18',
  name: 'Quote Follow-up',
  category: 'Sales',
  description: 'Sales follow-up for quotes/estimates',
  thumbnail: '/templates/18.png',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #F4F7FA;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 10px; overflow: hidden; box-shadow: 0 3px 15px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 35px; background-color: #5C6AC4; text-align: center;">
              <div style="font-size: 60px; margin-bottom: 15px;">💼</div>
              <h1 style="margin: 0 0 10px; color: #FFFFFF; font-size: 32px; font-weight: 600;">Following Up on Your Quote</h1>
              <p style="margin: 0; color: #C7CBF7; font-size: 16px;">We're here to answer any questions</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #212B36; font-size: 17px; line-height: 1.6;">Hi David,</p>

              <p style="margin: 0 0 25px; color: #212B36; font-size: 17px; line-height: 1.7;">I wanted to personally follow up on the quote we sent you last week for your bathroom renovation project. I hope you've had a chance to review it!</p>

              <p style="margin: 0 0 30px; color: #212B36; font-size: 17px; line-height: 1.7;">We're excited about the opportunity to work with you and would love to discuss any questions or concerns you might have.</p>
            </td>
          </tr>

          <!-- Quote Summary -->
          <tr>
            <td style="padding: 0 40px 35px;">
              <div style="background-color: #F9FAFB; border: 2px solid #5C6AC4; border-radius: 8px; padding: 30px;">
                <h2 style="margin: 0 0 20px; color: #5C6AC4; font-size: 22px; font-weight: 700; text-align: center;">Quote Summary</h2>

                <table role="presentation" style="width: 100%; margin-bottom: 20px;">
                  <tr>
                    <td style="padding: 10px 0; color: #637381; font-size: 14px;">Quote Number:</td>
                    <td style="padding: 10px 0; color: #212B36; font-size: 14px; font-weight: 600; text-align: right;">#QT-2024-1892</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #637381; font-size: 14px;">Sent On:</td>
                    <td style="padding: 10px 0; color: #212B36; font-size: 14px; font-weight: 600; text-align: right;">December 10, 2024</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #637381; font-size: 14px;">Valid Until:</td>
                    <td style="padding: 10px 0; color: #212B36; font-size: 14px; font-weight: 600; text-align: right;">January 10, 2025</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding-top: 20px; border-top: 2px solid #DFE3E8;">
                      <table role="presentation" style="width: 100%;">
                        <tr>
                          <td style="padding: 10px 0; color: #212B36; font-size: 18px; font-weight: 700;">Total Investment:</td>
                          <td style="padding: 10px 0; color: #5C6AC4; font-size: 24px; font-weight: 700; text-align: right;">$12,450.00</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <a href="#" style="display: block; padding: 14px; background-color: #5C6AC4; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; text-align: center; border-radius: 6px;">View Full Quote</a>
              </div>
            </td>
          </tr>

          <!-- Common Questions -->
          <tr>
            <td style="padding: 0 40px 35px;">
              <h3 style="margin: 0 0 25px; color: #212B36; font-size: 22px; font-weight: 700; text-align: center;">Common Questions We Can Address:</h3>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <!-- Question 1 -->
                <tr>
                  <td style="padding: 20px; background-color: #F9FAFB; border-left: 4px solid #5C6AC4; margin-bottom: 12px;">
                    <div style="color: #5C6AC4; font-size: 16px; font-weight: 700; margin-bottom: 8px;">❓ Timeline & Scheduling</div>
                    <div style="color: #637381; font-size: 14px; line-height: 1.6;">When can we start? How long will it take?</div>
                  </td>
                </tr>

                <tr><td style="height: 12px;"></td></tr>

                <!-- Question 2 -->
                <tr>
                  <td style="padding: 20px; background-color: #F9FAFB; border-left: 4px solid #5C6AC4; margin-bottom: 12px;">
                    <div style="color: #5C6AC4; font-size: 16px; font-weight: 700; margin-bottom: 8px;">💰 Payment & Financing</div>
                    <div style="color: #637381; font-size: 14px; line-height: 1.6;">Payment plans, deposit requirements, financing options</div>
                  </td>
                </tr>

                <tr><td style="height: 12px;"></td></tr>

                <!-- Question 3 -->
                <tr>
                  <td style="padding: 20px; background-color: #F9FAFB; border-left: 4px solid #5C6AC4; margin-bottom: 12px;">
                    <div style="color: #5C6AC4; font-size: 16px; font-weight: 700; margin-bottom: 8px;">🎨 Materials & Customization</div>
                    <div style="color: #637381; font-size: 14px; line-height: 1.6;">Upgrade options, material choices, design changes</div>
                  </td>
                </tr>

                <tr><td style="height: 12px;"></td></tr>

                <!-- Question 4 -->
                <tr>
                  <td style="padding: 20px; background-color: #F9FAFB; border-left: 4px solid #5C6AC4;">
                    <div style="color: #5C6AC4; font-size: 16px; font-weight: 700; margin-bottom: 8px;">✅ Warranty & Guarantees</div>
                    <div style="color: #637381; font-size: 14px; line-height: 1.6;">What's covered, how long, service after completion</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Special Offer -->
          <tr>
            <td style="padding: 0 40px 35px;">
              <div style="background: linear-gradient(135deg, #47C1BF 0%, #5C6AC4 100%); padding: 30px; border-radius: 10px; text-align: center;">
                <div style="background-color: #FFFFFF; display: inline-block; padding: 8px 20px; border-radius: 20px; margin-bottom: 15px;">
                  <span style="color: #5C6AC4; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Limited Time Offer</span>
                </div>
                <h3 style="margin: 0 0 10px; color: #FFFFFF; font-size: 26px; font-weight: 800;">Book This Week & Save 5%</h3>
                <p style="margin: 0 0 20px; color: #E0E4FF; font-size: 16px;">That's $622.50 off your total project cost!</p>
                <div style="background-color: rgba(255, 255, 255, 0.2); padding: 15px; border-radius: 8px;">
                  <div style="color: #FFFFFF; font-size: 14px; margin-bottom: 5px;">Offer expires in:</div>
                  <div style="color: #FFFFFF; font-size: 32px; font-weight: 900; letter-spacing: 2px;">3 DAYS</div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Testimonial -->
          <tr>
            <td style="padding: 0 40px 35px;">
              <div style="background-color: #F9FAFB; padding: 30px; border-radius: 8px; border-top: 4px solid #47C1BF;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <div style="color: #FFB800; font-size: 24px; margin-bottom: 10px;">★★★★★</div>
                  <div style="color: #637381; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">What Our Clients Say</div>
                </div>

                <p style="margin: 0 0 15px; color: #212B36; font-size: 16px; line-height: 1.7; font-style: italic; text-align: center;">"The team was professional from quote to completion. They answered all my questions patiently and the final result exceeded my expectations!"</p>

                <div style="text-align: center;">
                  <div style="width: 60px; height: 60px; background-color: #5C6AC4; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 24px; font-weight: 700;">MR</div>
                  <div style="color: #212B36; font-size: 15px; font-weight: 700;">Maria Rodriguez</div>
                  <div style="color: #637381; font-size: 13px;">Kitchen Renovation - Oak Park</div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Contact Options -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <h3 style="margin: 0 0 25px; color: #212B36; font-size: 22px; font-weight: 700; text-align: center;">Let's Chat!</h3>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 0 8px 15px; width: 50%;">
                    <a href="#" style="display: block; padding: 18px; background-color: #5C6AC4; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; text-align: center; border-radius: 8px;">
                      📞 Schedule Call
                    </a>
                  </td>
                  <td style="padding: 0 8px 15px; width: 50%;">
                    <a href="#" style="display: block; padding: 18px; background-color: #47C1BF; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; text-align: center; border-radius: 8px;">
                      💬 Live Chat
                    </a>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 0 8px;">
                    <a href="#" style="display: block; padding: 18px; background-color: #FFFFFF; color: #5C6AC4; text-decoration: none; font-size: 15px; font-weight: 600; text-align: center; border: 2px solid #5C6AC4; border-radius: 8px;">
                      ✉️ Reply to This Email
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Personal Touch -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <div style="border-top: 2px solid #DFE3E8; padding-top: 30px;">
                <p style="margin: 0 0 20px; color: #212B36; font-size: 16px; line-height: 1.7;">I'm personally available to discuss your project and answer any questions. No pressure - just here to help you make the best decision for your home.</p>

                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="width: 80px; vertical-align: top;">
                      <div style="width: 70px; height: 70px; background-color: #5C6AC4; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 28px; font-weight: 700;">TM</div>
                    </td>
                    <td style="padding-left: 20px; vertical-align: top;">
                      <div style="color: #212B36; font-size: 18px; font-weight: 700; margin-bottom: 5px;">Tom Mitchell</div>
                      <div style="color: #637381; font-size: 14px; margin-bottom: 8px;">Senior Project Consultant</div>
                      <div style="color: #5C6AC4; font-size: 14px; font-weight: 600;">📞 (555) 234-5678 ext. 42</div>
                      <div style="color: #5C6AC4; font-size: 14px; font-weight: 600;">✉️ tom.mitchell@renovationpro.com</div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 35px 40px; background-color: #212B36; text-align: center;">
              <p style="margin: 0 0 10px; color: #FFFFFF; font-size: 20px; font-weight: 700;">RenovationPro</p>
              <p style="margin: 0 0 15px; color: #919EAB; font-size: 14px;">Trusted by over 5,000 homeowners</p>
              <p style="margin: 0 0 5px; color: #C4CDD5; font-size: 13px;">www.renovationpro.com</p>
              <p style="margin: 0; color: #C4CDD5; font-size: 13px;">Licensed & Insured • 20 Years Experience</p>
            </td>
          </tr>
        </table>

        <!-- Postscript -->
        <table role="presentation" style="max-width: 600px; margin: 20px auto 0;">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="margin: 0; color: #637381; font-size: 13px; line-height: 1.6;">
                P.S. - If you've already decided to move forward, just hit reply and let me know! We'd love to get started on bringing your vision to life.
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
