// Template 12: Invoice/Estimate (Professional invoice format with line items)
export const template12 = {
  id: 'template-12',
  name: 'Invoice & Estimate',
  category: 'Billing',
  description: 'Professional invoice/estimate format with line items',
  thumbnail: '/templates/12.png',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #F5F5F5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 700px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #DDDDDD;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 50px; background-color: #2C3E50;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="width: 60%; vertical-align: top;">
                    <h1 style="margin: 0 0 10px; color: #FFFFFF; font-size: 36px; font-weight: 700;">ESTIMATE</h1>
                    <p style="margin: 0; color: #BDC3C7; font-size: 14px;">#EST-2024-1547</p>
                  </td>
                  <td style="width: 40%; vertical-align: top; text-align: right;">
                    <div style="background-color: #FFFFFF; padding: 15px; display: inline-block;">
                      <div style="color: #2C3E50; font-size: 20px; font-weight: 700;">PRO SERVICES</div>
                      <div style="color: #7F8C8D; font-size: 11px; margin-top: 5px;">EXCELLENCE IN SERVICE</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Info Section -->
          <tr>
            <td style="padding: 40px 50px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <!-- Bill To -->
                  <td style="width: 50%; vertical-align: top; padding-right: 30px;">
                    <div style="margin-bottom: 20px;">
                      <div style="color: #2C3E50; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Bill To:</div>
                      <div style="color: #34495E; font-size: 16px; font-weight: 700; margin-bottom: 5px;">John Anderson</div>
                      <div style="color: #7F8C8D; font-size: 14px; line-height: 1.6;">
                        456 Maple Avenue<br>
                        Springfield, IL 62704<br>
                        john.anderson@email.com<br>
                        (555) 987-6543
                      </div>
                    </div>
                  </td>

                  <!-- Estimate Details -->
                  <td style="width: 50%; vertical-align: top;">
                    <table role="presentation" style="width: 100%; background-color: #ECF0F1; padding: 20px;">
                      <tr>
                        <td style="padding: 8px 0; color: #7F8C8D; font-size: 13px; font-weight: 600;">Estimate Date:</td>
                        <td style="padding: 8px 0; color: #2C3E50; font-size: 13px; text-align: right;">Dec 18, 2024</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #7F8C8D; font-size: 13px; font-weight: 600;">Valid Until:</td>
                        <td style="padding: 8px 0; color: #2C3E50; font-size: 13px; text-align: right;">Jan 17, 2025</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #7F8C8D; font-size: 13px; font-weight: 600;">Project:</td>
                        <td style="padding: 8px 0; color: #2C3E50; font-size: 13px; text-align: right;">Bathroom Remodel</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Line Items Table -->
          <tr>
            <td style="padding: 0 50px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; border: 1px solid #BDC3C7;">
                <!-- Table Header -->
                <tr style="background-color: #34495E;">
                  <td style="padding: 15px; color: #FFFFFF; font-size: 13px; font-weight: 700; text-transform: uppercase; width: 50%;">Description</td>
                  <td style="padding: 15px; color: #FFFFFF; font-size: 13px; font-weight: 700; text-transform: uppercase; text-align: center; width: 15%;">Qty</td>
                  <td style="padding: 15px; color: #FFFFFF; font-size: 13px; font-weight: 700; text-transform: uppercase; text-align: right; width: 20%;">Rate</td>
                  <td style="padding: 15px; color: #FFFFFF; font-size: 13px; font-weight: 700; text-transform: uppercase; text-align: right; width: 15%;">Amount</td>
                </tr>

                <!-- Line Item 1 -->
                <tr style="border-bottom: 1px solid #E8E8E8;">
                  <td style="padding: 15px; color: #2C3E50; font-size: 14px;">
                    <div style="font-weight: 600; margin-bottom: 3px;">Vanity Installation</div>
                    <div style="color: #7F8C8D; font-size: 12px;">60" double sink vanity with quartz top</div>
                  </td>
                  <td style="padding: 15px; color: #2C3E50; font-size: 14px; text-align: center;">1</td>
                  <td style="padding: 15px; color: #2C3E50; font-size: 14px; text-align: right;">$2,850.00</td>
                  <td style="padding: 15px; color: #2C3E50; font-size: 14px; font-weight: 600; text-align: right;">$2,850.00</td>
                </tr>

                <!-- Line Item 2 -->
                <tr style="border-bottom: 1px solid #E8E8E8;">
                  <td style="padding: 15px; color: #2C3E50; font-size: 14px;">
                    <div style="font-weight: 600; margin-bottom: 3px;">Tile Installation</div>
                    <div style="color: #7F8C8D; font-size: 12px;">Porcelain floor and wall tile (120 sq ft)</div>
                  </td>
                  <td style="padding: 15px; color: #2C3E50; font-size: 14px; text-align: center;">120</td>
                  <td style="padding: 15px; color: #2C3E50; font-size: 14px; text-align: right;">$18.50</td>
                  <td style="padding: 15px; color: #2C3E50; font-size: 14px; font-weight: 600; text-align: right;">$2,220.00</td>
                </tr>

                <!-- Line Item 3 -->
                <tr style="border-bottom: 1px solid #E8E8E8;">
                  <td style="padding: 15px; color: #2C3E50; font-size: 14px;">
                    <div style="font-weight: 600; margin-bottom: 3px;">Plumbing Fixtures</div>
                    <div style="color: #7F8C8D; font-size: 12px;">Faucets, shower system, toilet installation</div>
                  </td>
                  <td style="padding: 15px; color: #2C3E50; font-size: 14px; text-align: center;">1</td>
                  <td style="padding: 15px; color: #2C3E50; font-size: 14px; text-align: right;">$1,450.00</td>
                  <td style="padding: 15px; color: #2C3E50; font-size: 14px; font-weight: 600; text-align: right;">$1,450.00</td>
                </tr>

                <!-- Line Item 4 -->
                <tr style="border-bottom: 1px solid #E8E8E8;">
                  <td style="padding: 15px; color: #2C3E50; font-size: 14px;">
                    <div style="font-weight: 600; margin-bottom: 3px;">Electrical Work</div>
                    <div style="color: #7F8C8D; font-size: 12px;">New lighting, outlets, GFCI installation</div>
                  </td>
                  <td style="padding: 15px; color: #2C3E50; font-size: 14px; text-align: center;">1</td>
                  <td style="padding: 15px; color: #2C3E50; font-size: 14px; text-align: right;">$875.00</td>
                  <td style="padding: 15px; color: #2C3E50; font-size: 14px; font-weight: 600; text-align: right;">$875.00</td>
                </tr>

                <!-- Line Item 5 -->
                <tr style="border-bottom: 1px solid #BDC3C7;">
                  <td style="padding: 15px; color: #2C3E50; font-size: 14px;">
                    <div style="font-weight: 600; margin-bottom: 3px;">Painting & Finishing</div>
                    <div style="color: #7F8C8D; font-size: 12px;">Premium paint, trim work, final touches</div>
                  </td>
                  <td style="padding: 15px; color: #2C3E50; font-size: 14px; text-align: center;">1</td>
                  <td style="padding: 15px; color: #2C3E50; font-size: 14px; text-align: right;">$650.00</td>
                  <td style="padding: 15px; color: #2C3E50; font-size: 14px; font-weight: 600; text-align: right;">$650.00</td>
                </tr>

                <!-- Subtotal -->
                <tr>
                  <td colspan="3" style="padding: 15px; color: #2C3E50; font-size: 15px; font-weight: 600; text-align: right;">Subtotal:</td>
                  <td style="padding: 15px; color: #2C3E50; font-size: 15px; font-weight: 600; text-align: right;">$8,045.00</td>
                </tr>

                <!-- Tax -->
                <tr>
                  <td colspan="3" style="padding: 15px; color: #7F8C8D; font-size: 14px; text-align: right;">Tax (8.5%):</td>
                  <td style="padding: 15px; color: #2C3E50; font-size: 14px; text-align: right;">$683.83</td>
                </tr>

                <!-- Total -->
                <tr style="background-color: #34495E;">
                  <td colspan="3" style="padding: 20px; color: #FFFFFF; font-size: 18px; font-weight: 700; text-align: right;">TOTAL:</td>
                  <td style="padding: 20px; color: #FFFFFF; font-size: 22px; font-weight: 700; text-align: right;">$8,728.83</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Notes -->
          <tr>
            <td style="padding: 0 50px 30px;">
              <div style="background-color: #FEF5E7; border-left: 4px solid #F39C12; padding: 20px;">
                <h3 style="margin: 0 0 10px; color: #D68910; font-size: 14px; font-weight: 700; text-transform: uppercase;">Notes & Terms:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #7D6608; font-size: 13px; line-height: 1.8;">
                  <li>50% deposit required to begin work</li>
                  <li>Estimated completion time: 10-12 business days</li>
                  <li>All materials included in estimate</li>
                  <li>Final payment due upon completion</li>
                  <li>Estimate valid for 30 days</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 50px 40px; text-align: center;">
              <a href="#" style="display: inline-block; padding: 16px 40px; background-color: #27AE60; color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: 700; text-transform: uppercase; border-radius: 5px; margin-right: 15px;">Approve Estimate</a>
              <a href="#" style="display: inline-block; padding: 16px 40px; background-color: #FFFFFF; color: #2C3E50; text-decoration: none; font-size: 16px; font-weight: 700; text-transform: uppercase; border: 2px solid #2C3E50; border-radius: 5px;">Request Changes</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 50px; background-color: #F8F9FA; border-top: 1px solid #DEE2E6;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="width: 50%; vertical-align: top;">
                    <p style="margin: 0 0 5px; color: #2C3E50; font-size: 16px; font-weight: 700;">Pro Services Inc.</p>
                    <p style="margin: 0; color: #7F8C8D; font-size: 13px; line-height: 1.6;">
                      789 Business Blvd<br>
                      Springfield, IL 62701<br>
                      License #12345
                    </p>
                  </td>
                  <td style="width: 50%; vertical-align: top; text-align: right;">
                    <p style="margin: 0 0 5px; color: #2C3E50; font-size: 14px; font-weight: 600;">Contact Us</p>
                    <p style="margin: 0; color: #7F8C8D; font-size: 13px; line-height: 1.6;">
                      (555) 123-4567<br>
                      estimates@proservices.com<br>
                      www.proservices.com
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
