// Template 1: Window Measurements Report (Professional, Table-Heavy)
export const template01 = {
  id: 'template-01',
  name: 'Measurements Report',
  category: 'Professional Report',
  description: 'Detailed measurement report with tables - perfect for contractors and installers',
  thumbnail: '/templates/01.png',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px; text-align: center;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Parkway Group</h1>
              <p style="margin: 10px 0 0; color: #E0E7FF; font-size: 14px;">Windows & Doors Specialists</p>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 30px 30px 20px;">
              <h2 style="margin: 0; color: #1F2937; font-size: 24px; font-weight: bold;">Window Measurements Report</h2>
              <p style="margin: 10px 0 0; color: #6B7280; font-size: 14px; line-height: 1.6;">Quick summary of field measurements. Let me know if you want any photos attached or if I should re-check anything on site.</p>
            </td>
          </tr>

          <!-- Main Measurements Table -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <h3 style="margin: 0 0 15px; color: #1F2937; font-size: 18px; font-weight: bold;">Exterior Garage Windows</h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse; border: 1px solid #E5E7EB;">
                <tr style="background-color: #F9FAFB;">
                  <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 1px solid #E5E7EB;">Measurement</th>
                  <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 1px solid #E5E7EB;">Value</th>
                  <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 1px solid #E5E7EB;">Notes</th>
                </tr>
                <tr>
                  <td style="padding: 12px; font-size: 14px; color: #1F2937; border-bottom: 1px solid #E5E7EB;">Overall Size (W × H)</td>
                  <td style="padding: 12px; font-size: 14px; color: #1F2937; border-bottom: 1px solid #E5E7EB; font-weight: 600;">37-1/2" × 56-1/2"</td>
                  <td style="padding: 12px; font-size: 14px; color: #6B7280; border-bottom: 1px solid #E5E7EB;">Exterior opening</td>
                </tr>
                <tr style="background-color: #F9FAFB;">
                  <td style="padding: 12px; font-size: 14px; color: #1F2937; border-bottom: 1px solid #E5E7EB;">Wall/Unit Depth</td>
                  <td style="padding: 12px; font-size: 14px; color: #1F2937; border-bottom: 1px solid #E5E7EB; font-weight: 600;">5-3/4"</td>
                  <td style="padding: 12px; font-size: 14px; color: #6B7280; border-bottom: 1px solid #E5E7EB;">Garage window depth</td>
                </tr>
                <tr>
                  <td style="padding: 12px; font-size: 14px; color: #1F2937; border-bottom: 1px solid #E5E7EB;">Jamb Depth</td>
                  <td style="padding: 12px; font-size: 14px; color: #1F2937; border-bottom: 1px solid #E5E7EB; font-weight: 600;">0.0"</td>
                  <td style="padding: 12px; font-size: 14px; color: #6B7280; border-bottom: 1px solid #E5E7EB;">None present</td>
                </tr>
                <tr style="background-color: #F9FAFB;">
                  <td style="padding: 12px; font-size: 14px; color: #1F2937;">Exterior Trim (between windows)</td>
                  <td style="padding: 12px; font-size: 14px; color: #1F2937; font-weight: 600;">~7-1/8"</td>
                  <td style="padding: 12px; font-size: 14px; color: #6B7280;">Spacing between windows</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Additional Measurements -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <h3 style="margin: 0 0 15px; color: #1F2937; font-size: 18px; font-weight: bold;">Other Jamb Extension Measurements</h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse; border: 1px solid #E5E7EB; font-size: 13px;">
                <tr style="background-color: #F9FAFB;">
                  <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #E5E7EB;">Location</th>
                  <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #E5E7EB;">Window-to-Trim</th>
                  <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #E5E7EB;">Jamb Ext.</th>
                  <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #E5E7EB;">Notes</th>
                </tr>
                <tr>
                  <td style="padding: 10px; color: #1F2937; border-bottom: 1px solid #E5E7EB;">Garage – Fixed unit</td>
                  <td style="padding: 10px; color: #1F2937; border-bottom: 1px solid #E5E7EB;">4-1/2"</td>
                  <td style="padding: 10px; color: #1F2937; border-bottom: 1px solid #E5E7EB;">3-3/4"</td>
                  <td style="padding: 10px; color: #6B7280; border-bottom: 1px solid #E5E7EB;">On stairs</td>
                </tr>
                <tr style="background-color: #F9FAFB;">
                  <td style="padding: 10px; color: #1F2937; border-bottom: 1px solid #E5E7EB;">Garage – Casement</td>
                  <td style="padding: 10px; color: #1F2937; border-bottom: 1px solid #E5E7EB;">2-3/4"</td>
                  <td style="padding: 10px; color: #1F2937; border-bottom: 1px solid #E5E7EB;">2"</td>
                  <td style="padding: 10px; color: #6B7280; border-bottom: 1px solid #E5E7EB;">At entrance</td>
                </tr>
                <tr>
                  <td style="padding: 10px; color: #1F2937; border-bottom: 1px solid #E5E7EB;">Kitchen</td>
                  <td style="padding: 10px; color: #1F2937; border-bottom: 1px solid #E5E7EB;">2-3/4"</td>
                  <td style="padding: 10px; color: #1F2937; border-bottom: 1px solid #E5E7EB;">2"</td>
                  <td style="padding: 10px; color: #6B7280; border-bottom: 1px solid #E5E7EB;">—</td>
                </tr>
                <tr style="background-color: #F9FAFB;">
                  <td style="padding: 10px; color: #1F2937;">Casement upstairs</td>
                  <td style="padding: 10px; color: #1F2937;">0.5"</td>
                  <td style="padding: 10px; color: #1F2937;">0"</td>
                  <td style="padding: 10px; color: #6B7280;">No extension</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Photos CTA -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 20px; border-radius: 4px;">
                <p style="margin: 0 0 10px; color: #1F2937; font-size: 14px; font-weight: 600;">📸 Project Photos & Videos:</p>
                <a href="#" style="color: #3B82F6; text-decoration: none; font-size: 14px; font-weight: 500;">View on CompanyCam →</a>
              </div>
            </td>
          </tr>

          <!-- Footer Note -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <p style="margin: 0; color: #6B7280; font-size: 12px; font-style: italic;">All units listed in inches (in). "Window-to-Trim" includes trim in measurement.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 5px; color: #1F2937; font-size: 16px; font-weight: 600;">Parkway Group</p>
              <p style="margin: 0; color: #6B7280; font-size: 14px;">Windows & Doors</p>
              <p style="margin: 15px 0 0; color: #6B7280; font-size: 13px;">
                📞 (555) 123-4567 | ✉️ info@parkwaygroup.com<br/>
                🌐 www.parkwaygroup.com
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
