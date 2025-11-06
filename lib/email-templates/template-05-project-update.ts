// Template 5: Project Update (Split layout with text and image columns)
export const template05 = {
  id: 'template-05',
  name: 'Project Update',
  category: 'Construction',
  description: 'Split layout with text and image columns for construction updates',
  thumbnail: '/templates/05.png',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; background-color: #F8F9FA;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 30px 20px;">
        <table role="presentation" style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border: 1px solid #DEE2E6;">
          <!-- Header with Progress Bar -->
          <tr>
            <td style="padding: 40px 40px 30px; background-color: #0D6EFD; color: #ffffff;">
              <h1 style="margin: 0 0 10px; font-size: 32px; font-weight: 700;">Project Update #3</h1>
              <p style="margin: 0 0 20px; font-size: 16px; opacity: 0.9;">Westside Commercial Complex - Week of Dec 15</p>

              <!-- Progress Bar -->
              <div style="background-color: rgba(255,255,255,0.2); height: 30px; border-radius: 15px; overflow: hidden; margin-top: 20px;">
                <div style="background-color: #198754; height: 100%; width: 65%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;">65% Complete</div>
              </div>
            </td>
          </tr>

          <!-- Split Content Section 1 -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <!-- Image Left -->
                  <td style="width: 50%; padding: 0; vertical-align: top;">
                    <div style="background-color: #6C757D; height: 250px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 14px;">[Foundation Photo]</div>
                  </td>
                  <!-- Text Right -->
                  <td style="width: 50%; padding: 30px; vertical-align: top; background-color: #F8F9FA;">
                    <h3 style="margin: 0 0 15px; color: #0D6EFD; font-size: 22px; font-weight: 700;">Foundation Complete</h3>
                    <p style="margin: 0 0 15px; color: #495057; font-size: 15px; line-height: 1.6;">All concrete work has been finished and inspected. Foundation passed inspection with zero issues.</p>
                    <div style="background-color: #D1E7DD; padding: 12px; border-left: 4px solid #198754;">
                      <strong style="color: #0A3622; font-size: 14px;">Status: On Schedule</strong>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0;">
              <div style="height: 1px; background-color: #DEE2E6;"></div>
            </td>
          </tr>

          <!-- Split Content Section 2 (Reversed) -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <!-- Text Left -->
                  <td style="width: 50%; padding: 30px; vertical-align: top;">
                    <h3 style="margin: 0 0 15px; color: #0D6EFD; font-size: 22px; font-weight: 700;">Framing Progress</h3>
                    <p style="margin: 0 0 15px; color: #495057; font-size: 15px; line-height: 1.6;">Structural framing is 80% complete. All major beams and support columns are in place.</p>
                    <div style="background-color: #FFF3CD; padding: 12px; border-left: 4px solid #FFC107;">
                      <strong style="color: #664D03; font-size: 14px;">Next: Roof Installation</strong>
                    </div>
                  </td>
                  <!-- Image Right -->
                  <td style="width: 50%; padding: 0; vertical-align: top;">
                    <div style="background-color: #ADB5BD; height: 250px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 14px;">[Framing Photo]</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Milestones -->
          <tr>
            <td style="padding: 40px;">
              <h3 style="margin: 0 0 25px; color: #212529; font-size: 24px; font-weight: 700; text-align: center;">Upcoming Milestones</h3>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <!-- Milestone 1 -->
                <tr>
                  <td style="padding: 20px; background-color: #F8F9FA; border-left: 5px solid #0D6EFD; margin-bottom: 15px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="width: 80px; vertical-align: top;">
                          <div style="background-color: #0D6EFD; color: #ffffff; padding: 15px; text-align: center; border-radius: 5px;">
                            <div style="font-size: 24px; font-weight: 700; line-height: 1;">22</div>
                            <div style="font-size: 12px; margin-top: 3px;">DEC</div>
                          </div>
                        </td>
                        <td style="padding-left: 20px; vertical-align: top;">
                          <div style="font-weight: 700; color: #212529; font-size: 18px; margin-bottom: 5px;">Roof Completion</div>
                          <div style="color: #6C757D; font-size: 14px;">Weather permitting, full roof installation</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr><td style="height: 15px;"></td></tr>

                <!-- Milestone 2 -->
                <tr>
                  <td style="padding: 20px; background-color: #F8F9FA; border-left: 5px solid #6C757D;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="width: 80px; vertical-align: top;">
                          <div style="background-color: #6C757D; color: #ffffff; padding: 15px; text-align: center; border-radius: 5px;">
                            <div style="font-size: 24px; font-weight: 700; line-height: 1;">05</div>
                            <div style="font-size: 12px; margin-top: 3px;">JAN</div>
                          </div>
                        </td>
                        <td style="padding-left: 20px; vertical-align: top;">
                          <div style="font-weight: 700; color: #212529; font-size: 18px; margin-bottom: 5px;">Electrical & Plumbing</div>
                          <div style="color: #6C757D; font-size: 14px;">Installation of all major systems</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contact Section -->
          <tr>
            <td style="padding: 30px 40px; background-color: #E9ECEF; text-align: center;">
              <p style="margin: 0 0 15px; color: #495057; font-size: 15px;">Questions about your project?</p>
              <a href="#" style="display: inline-block; padding: 14px 35px; background-color: #0D6EFD; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 5px; margin-right: 10px;">Contact Project Manager</a>
              <a href="#" style="display: inline-block; padding: 14px 35px; background-color: #6C757D; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 5px;">View Full Timeline</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #212529; text-align: center;">
              <p style="margin: 0 0 5px; color: #ffffff; font-size: 18px; font-weight: 700;">BuildRight Construction</p>
              <p style="margin: 0 0 15px; color: #ADB5BD; font-size: 14px;">Project Manager: Sarah Johnson | (555) 987-6543</p>
              <p style="margin: 0; color: #6C757D; font-size: 12px;">© 2024 BuildRight Construction. All rights reserved.</p>
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
