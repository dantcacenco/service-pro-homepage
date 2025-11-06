// Template 17: Maintenance Checklist (Annual maintenance checklist template)
export const template17 = {
  id: 'template-17',
  name: 'Maintenance Checklist',
  category: 'Maintenance',
  description: 'Annual maintenance checklist template',
  thumbnail: '/templates/17.png',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Verdana', sans-serif; background-color: #F0F8FF;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 30px 20px;">
        <table role="presentation" style="max-width: 650px; margin: 0 auto; background-color: #FFFFFF; border: 2px solid #2196F3;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px; background-color: #2196F3; text-align: center;">
              <div style="font-size: 60px; margin-bottom: 15px;">📋</div>
              <h1 style="margin: 0 0 10px; color: #FFFFFF; font-size: 34px; font-weight: 700;">Annual Home Maintenance</h1>
              <p style="margin: 0; color: #BBDEFB; font-size: 18px; font-weight: 500;">Your Complete 2024 Checklist</p>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding: 35px 40px 30px;">
              <p style="margin: 0 0 20px; color: #424242; font-size: 16px; line-height: 1.7;">Dear Homeowner,</p>
              <p style="margin: 0 0 20px; color: #424242; font-size: 16px; line-height: 1.7;">It's time for your annual home maintenance check-up! Regular maintenance helps prevent costly repairs and keeps your home running smoothly year-round.</p>
              <p style="margin: 0; color: #424242; font-size: 16px; line-height: 1.7;">We've prepared this comprehensive checklist to help you stay on top of essential tasks:</p>
            </td>
          </tr>

          <!-- Season Header: Spring -->
          <tr>
            <td style="padding: 0 40px 25px;">
              <div style="background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%); padding: 20px; border-radius: 8px;">
                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="width: 60px; font-size: 40px;">🌸</td>
                    <td>
                      <h2 style="margin: 0; color: #FFFFFF; font-size: 26px; font-weight: 700;">SPRING TASKS</h2>
                      <p style="margin: 5px 0 0; color: #E8F5E9; font-size: 14px;">March - May</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Spring Checklist -->
              <table role="presentation" style="width: 100%; margin-top: 20px; border: 1px solid #E0E0E0; border-collapse: collapse;">
                <tr style="background-color: #F5F5F5;">
                  <td style="width: 50px; padding: 15px; text-align: center; border-bottom: 1px solid #E0E0E0;">
                    <input type="checkbox" style="width: 20px; height: 20px;">
                  </td>
                  <td style="padding: 15px; border-bottom: 1px solid #E0E0E0;">
                    <div style="color: #424242; font-size: 15px; font-weight: 600;">Inspect roof for winter damage</div>
                    <div style="color: #757575; font-size: 13px; margin-top: 3px;">Check shingles, flashing, and gutters</div>
                  </td>
                </tr>
                <tr>
                  <td style="width: 50px; padding: 15px; text-align: center; border-bottom: 1px solid #E0E0E0;">
                    <input type="checkbox" style="width: 20px; height: 20px;">
                  </td>
                  <td style="padding: 15px; border-bottom: 1px solid #E0E0E0;">
                    <div style="color: #424242; font-size: 15px; font-weight: 600;">Clean and service AC unit</div>
                    <div style="color: #757575; font-size: 13px; margin-top: 3px;">Replace filters, check refrigerant levels</div>
                  </td>
                </tr>
                <tr style="background-color: #F5F5F5;">
                  <td style="width: 50px; padding: 15px; text-align: center; border-bottom: 1px solid #E0E0E0;">
                    <input type="checkbox" style="width: 20px; height: 20px;">
                  </td>
                  <td style="padding: 15px; border-bottom: 1px solid #E0E0E0;">
                    <div style="color: #424242; font-size: 15px; font-weight: 600;">Power wash exterior surfaces</div>
                    <div style="color: #757575; font-size: 13px; margin-top: 3px;">Siding, deck, driveway, and walkways</div>
                  </td>
                </tr>
                <tr>
                  <td style="width: 50px; padding: 15px; text-align: center;">
                    <input type="checkbox" style="width: 20px; height: 20px;">
                  </td>
                  <td style="padding: 15px;">
                    <div style="color: #424242; font-size: 15px; font-weight: 600;">Test sprinkler system</div>
                    <div style="color: #757575; font-size: 13px; margin-top: 3px;">Check for leaks and adjust spray patterns</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Season Header: Summer -->
          <tr>
            <td style="padding: 0 40px 25px;">
              <div style="background: linear-gradient(135deg, #FF9800 0%, #FFB74D 100%); padding: 20px; border-radius: 8px;">
                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="width: 60px; font-size: 40px;">☀️</td>
                    <td>
                      <h2 style="margin: 0; color: #FFFFFF; font-size: 26px; font-weight: 700;">SUMMER TASKS</h2>
                      <p style="margin: 5px 0 0; color: #FFF3E0; font-size: 14px;">June - August</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Summer Checklist -->
              <table role="presentation" style="width: 100%; margin-top: 20px; border: 1px solid #E0E0E0; border-collapse: collapse;">
                <tr style="background-color: #F5F5F5;">
                  <td style="width: 50px; padding: 15px; text-align: center; border-bottom: 1px solid #E0E0E0;">
                    <input type="checkbox" style="width: 20px; height: 20px;">
                  </td>
                  <td style="padding: 15px; border-bottom: 1px solid #E0E0E0;">
                    <div style="color: #424242; font-size: 15px; font-weight: 600;">Inspect and seal deck/patio</div>
                    <div style="color: #757575; font-size: 13px; margin-top: 3px;">Apply sealant or stain as needed</div>
                  </td>
                </tr>
                <tr>
                  <td style="width: 50px; padding: 15px; text-align: center; border-bottom: 1px solid #E0E0E0;">
                    <input type="checkbox" style="width: 20px; height: 20px;">
                  </td>
                  <td style="padding: 15px; border-bottom: 1px solid #E0E0E0;">
                    <div style="color: #424242; font-size: 15px; font-weight: 600;">Clean dryer vent thoroughly</div>
                    <div style="color: #757575; font-size: 13px; margin-top: 3px;">Prevent fire hazard and improve efficiency</div>
                  </td>
                </tr>
                <tr style="background-color: #F5F5F5;">
                  <td style="width: 50px; padding: 15px; text-align: center;">
                    <input type="checkbox" style="width: 20px; height: 20px;">
                  </td>
                  <td style="padding: 15px;">
                    <div style="color: #424242; font-size: 15px; font-weight: 600;">Check window and door seals</div>
                    <div style="color: #757575; font-size: 13px; margin-top: 3px;">Replace weatherstripping if worn</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Season Header: Fall -->
          <tr>
            <td style="padding: 0 40px 25px;">
              <div style="background: linear-gradient(135deg, #F4511E 0%, #FF7043 100%); padding: 20px; border-radius: 8px;">
                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="width: 60px; font-size: 40px;">🍂</td>
                    <td>
                      <h2 style="margin: 0; color: #FFFFFF; font-size: 26px; font-weight: 700;">FALL TASKS</h2>
                      <p style="margin: 5px 0 0; color: #FFCCBC; font-size: 14px;">September - November</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Fall Checklist -->
              <table role="presentation" style="width: 100%; margin-top: 20px; border: 1px solid #E0E0E0; border-collapse: collapse;">
                <tr style="background-color: #F5F5F5;">
                  <td style="width: 50px; padding: 15px; text-align: center; border-bottom: 1px solid #E0E0E0;">
                    <input type="checkbox" style="width: 20px; height: 20px;">
                  </td>
                  <td style="padding: 15px; border-bottom: 1px solid #E0E0E0;">
                    <div style="color: #424242; font-size: 15px; font-weight: 600;">Service heating system</div>
                    <div style="color: #757575; font-size: 13px; margin-top: 3px;">Clean furnace, replace filters</div>
                  </td>
                </tr>
                <tr>
                  <td style="width: 50px; padding: 15px; text-align: center; border-bottom: 1px solid #E0E0E0;">
                    <input type="checkbox" style="width: 20px; height: 20px;">
                  </td>
                  <td style="padding: 15px; border-bottom: 1px solid #E0E0E0;">
                    <div style="color: #424242; font-size: 15px; font-weight: 600;">Clean gutters and downspouts</div>
                    <div style="color: #757575; font-size: 13px; margin-top: 3px;">Remove leaves and debris</div>
                  </td>
                </tr>
                <tr style="background-color: #F5F5F5;">
                  <td style="width: 50px; padding: 15px; text-align: center; border-bottom: 1px solid #E0E0E0;">
                    <input type="checkbox" style="width: 20px; height: 20px;">
                  </td>
                  <td style="padding: 15px; border-bottom: 1px solid #E0E0E0;">
                    <div style="color: #424242; font-size: 15px; font-weight: 600;">Insulate pipes and outdoor faucets</div>
                    <div style="color: #757575; font-size: 13px; margin-top: 3px;">Prevent freezing during winter</div>
                  </td>
                </tr>
                <tr>
                  <td style="width: 50px; padding: 15px; text-align: center;">
                    <input type="checkbox" style="width: 20px; height: 20px;">
                  </td>
                  <td style="padding: 15px;">
                    <div style="color: #424242; font-size: 15px; font-weight: 600;">Test smoke and CO detectors</div>
                    <div style="color: #757575; font-size: 13px; margin-top: 3px;">Replace batteries as needed</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Season Header: Winter -->
          <tr>
            <td style="padding: 0 40px 35px;">
              <div style="background: linear-gradient(135deg, #1976D2 0%, #42A5F5 100%); padding: 20px; border-radius: 8px;">
                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="width: 60px; font-size: 40px;">❄️</td>
                    <td>
                      <h2 style="margin: 0; color: #FFFFFF; font-size: 26px; font-weight: 700;">WINTER TASKS</h2>
                      <p style="margin: 5px 0 0; color: #BBDEFB; font-size: 14px;">December - February</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Winter Checklist -->
              <table role="presentation" style="width: 100%; margin-top: 20px; border: 1px solid #E0E0E0; border-collapse: collapse;">
                <tr style="background-color: #F5F5F5;">
                  <td style="width: 50px; padding: 15px; text-align: center; border-bottom: 1px solid #E0E0E0;">
                    <input type="checkbox" style="width: 20px; height: 20px;">
                  </td>
                  <td style="padding: 15px; border-bottom: 1px solid #E0E0E0;">
                    <div style="color: #424242; font-size: 15px; font-weight: 600;">Inspect attic insulation</div>
                    <div style="color: #757575; font-size: 13px; margin-top: 3px;">Check for gaps and heat loss</div>
                  </td>
                </tr>
                <tr>
                  <td style="width: 50px; padding: 15px; text-align: center; border-bottom: 1px solid #E0E0E0;">
                    <input type="checkbox" style="width: 20px; height: 20px;">
                  </td>
                  <td style="padding: 15px; border-bottom: 1px solid #E0E0E0;">
                    <div style="color: #424242; font-size: 15px; font-weight: 600;">Reverse ceiling fan direction</div>
                    <div style="color: #757575; font-size: 13px; margin-top: 3px;">Clockwise to push warm air down</div>
                  </td>
                </tr>
                <tr style="background-color: #F5F5F5;">
                  <td style="width: 50px; padding: 15px; text-align: center;">
                    <input type="checkbox" style="width: 20px; height: 20px;">
                  </td>
                  <td style="padding: 15px;">
                    <div style="color: #424242; font-size: 15px; font-weight: 600;">Check for ice dams on roof</div>
                    <div style="color: #757575; font-size: 13px; margin-top: 3px;">Remove snow buildup if necessary</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Section -->
          <tr>
            <td style="padding: 35px 40px; background-color: #E3F2FD; text-align: center;">
              <h3 style="margin: 0 0 15px; color: #1976D2; font-size: 24px; font-weight: 700;">Need Help with Any Tasks?</h3>
              <p style="margin: 0 0 25px; color: #424242; font-size: 15px; line-height: 1.6;">Our professional team can handle all your maintenance needs. Schedule your service today!</p>
              <a href="#" style="display: inline-block; padding: 16px 40px; background-color: #2196F3; color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 25px; margin-right: 15px;">Schedule Service</a>
              <a href="#" style="display: inline-block; padding: 16px 40px; background-color: #FFFFFF; color: #2196F3; text-decoration: none; font-size: 16px; font-weight: 700; border: 2px solid #2196F3; border-radius: 25px;">Download PDF</a>
            </td>
          </tr>

          <!-- Tips Section -->
          <tr>
            <td style="padding: 35px 40px;">
              <div style="background-color: #FFF9C4; border-left: 5px solid #FBC02D; padding: 25px; border-radius: 5px;">
                <h4 style="margin: 0 0 15px; color: #F57F17; font-size: 18px; font-weight: 700;">💡 Pro Tip</h4>
                <p style="margin: 0; color: #7D6608; font-size: 14px; line-height: 1.7;">Set calendar reminders for seasonal tasks. Breaking maintenance into quarterly chunks makes it much more manageable and ensures nothing gets forgotten!</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 35px 40px; background-color: #1976D2; text-align: center;">
              <p style="margin: 0 0 10px; color: #FFFFFF; font-size: 20px; font-weight: 700;">HomeCare Maintenance Services</p>
              <p style="margin: 0 0 15px; color: #BBDEFB; font-size: 14px;">Keeping your home in perfect condition year-round</p>
              <p style="margin: 0 0 5px; color: #E3F2FD; font-size: 14px;">📞 (555) 234-HOME</p>
              <p style="margin: 0; color: #E3F2FD; font-size: 14px;">✉️ maintenance@homecare.com</p>
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
