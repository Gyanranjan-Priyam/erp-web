import nodemailer from "nodemailer";

// Create a transporter using Gmail SMTP
export const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});



// Generate verification email HTML template
const generateVerificationEmailHTML = (verificationCode: string) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CUMS - GCEK Bhawanipatna Email Verification</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
            background-color: #f6f8fa;
            padding: 40px 20px;
            color: #24292f;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #d0d7de;
            border-radius: 6px;
        }
        
        .header {
            text-align: center;
            padding: 40px 20px 20px;
        }
        
        .GCEK-logo {
            max-width: 200px;
            height: auto;
            margin-bottom: 24px;
        }
        
        .header h1 {
            font-size: 20px;
            font-weight: 600;
            color: #24292f;
            line-height: 1.5;
        }
        
        .content {
            padding: 0 40px 40px;
        }
        
        .code-box {
            background-color: #f6f8fa;
            border: 1px solid #d0d7de;
            border-radius: 6px;
            padding: 24px;
            margin: 24px 0;
        }
        
        .code-label {
            font-size: 14px;
            color: #57606a;
            margin-bottom: 16px;
        }
        
        .verification-code {
            font-size: 32px;
            font-weight: 600;
            letter-spacing: 8px;
            color: #24292f;
            text-align: center;
            margin: 16px 0;
            font-family: 'Courier New', monospace;
        }
        
        .info-text {
            font-size: 14px;
            color: #57606a;
            line-height: 1.6;
            margin: 16px 0;
        }
        
        .warning {
            font-weight: 600;
            color: #24292f;
        }
        
        .signature {
            margin-top: 24px;
        }
        
        .signature p {
            font-size: 14px;
            color: #57606a;
            line-height: 1.6;
        }
        
        .disclaimer {
            padding: 24px 40px;
            background-color: #f6f8fa;
            border-top: 1px solid #d0d7de;
            font-size: 12px;
            color: #57606a;
            line-height: 1.6;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #57606a;
        }
        
        .footer-divider {
            margin: 0 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://res.cloudinary.com/dw47ib0sh/image/upload/v1764077429/mydzalimrmzbscn0bmue.png" alt="GCEK Logo" class="GCEK-logo" />
            <h1>Please verify your identity for <strong>CUMS - GCEK Bhawanipatna</strong></h1>
        </div>
        
        <div class="content">
            <div class="code-box">
                <p class="code-label">Here is your CUMS Portal verification code:</p>
                <div class="verification-code">${verificationCode}</div>
                <p class="info-text">This code is valid for <strong>10 minutes</strong> and can only be used once.</p>
                <p class="info-text"><span class="warning">Please don't share this code with anyone:</span> we'll never ask for it on the phone or via email.</p>
            </div>
            
            <div class="signature">
                <p>Thanks,</p>
                <p>The CUMS - GCEK Bhawanipatna</p>
            </div>
        </div>
        
        <div class="disclaimer">
            <p>You're receiving this email because a verification code was requested for your CUMS Portal account. If this wasn't you, please ignore this email.</p>
        </div>
    </div>
    
    <div class="footer">
        <p>Central Unified Management System <span class="footer-divider">·</span> Government College of Engineering Kalahandi <span class="footer-divider">·</span> Bhawanipatna, Odisha</p>
    </div>
</body>
</html>`;
};

// Send verification email function with beautiful template
export const sendVerificationEmail = async ({
  to,
  otp,
}: {
  to: string;
  otp: string;
}) => {
  try {
    const html = generateVerificationEmailHTML(otp);
    
    const info = await mailer.sendMail({
      from: process.env.GMAIL_FROM_NAME ? `${process.env.GMAIL_FROM_NAME} <${process.env.GMAIL_USER}>` : process.env.GMAIL_USER,
      to,
      subject: 'Verify your email address',
      html,
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

// Generate confirmation email HTML template
const generateConfirmationEmailHTML = ({
  participantName,
  eventTitle,
  eventDate,
  eventVenue,
  participantEmail,
  registrationDetails,
}: {
  participantName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  participantEmail: string;
  registrationDetails: {
    fullName: string;
    mobileNumber: string;
    whatsappNumber?: string;
    collegeName: string;
    state: string;
    district: string;
  };
}) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Registration Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #333333;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding: 50px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 48px 40px 36px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.4px;">✅ Registration Confirmed!</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 15px;">You're all set for the event</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px 40px;">
              <p style="margin: 0 0 24px; font-size: 16px;">Hello <strong>${participantName}</strong>,</p>
              <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #444444;">
                Congratulations! Your registration for <strong>${eventTitle}</strong> has been confirmed. Your payment has been verified and you're officially registered for the event.
              </p>

              <!-- Attachment Notice -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #22c55e; text-align: center;">
                <p style="margin: 0; font-size: 16px; color: #166534; font-weight: 600;">📎 Registration Details Attached</p>
                <p style="margin: 8px 0 0; font-size: 14px; color: #166534;">A detailed PDF with your complete registration information is attached to this email for your records.</p>
              </div>

              <!-- Event Details -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px; border-left: 4px solid #0ea5e9;">
                <h3 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #0c4a6e;">📅 Event Details</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 120px;">Event:</td>
                    <td style="padding: 8px 0; color: #111827;">${eventTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Date:</td>
                    <td style="padding: 8px 0; color: #111827;">${eventDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Venue:</td>
                    <td style="padding: 8px 0; color: #111827;">${eventVenue}</td>
                  </tr>
                </table>
              </div>

              <!-- Registration Details -->
              <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                <h3 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #92400e;">👤 Your Registration Details</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 140px;">Name:</td>
                    <td style="padding: 8px 0; color: #111827;">${registrationDetails.fullName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Email:</td>
                    <td style="padding: 8px 0; color: #111827;">${participantEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Mobile:</td>
                    <td style="padding: 8px 0; color: #111827;">${registrationDetails.mobileNumber}</td>
                  </tr>
                  ${registrationDetails.whatsappNumber ? `
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">WhatsApp:</td>
                    <td style="padding: 8px 0; color: #111827;">${registrationDetails.whatsappNumber}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">College:</td>
                    <td style="padding: 8px 0; color: #111827;">${registrationDetails.collegeName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Location:</td>
                    <td style="padding: 8px 0; color: #111827;">${registrationDetails.district}, ${registrationDetails.state}</td>
                  </tr>
                </table>
              </div>

              <!-- Important Instructions -->
              <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px; border-left: 4px solid #ef4444;">
                <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #dc2626;">📋 Important Instructions</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.6;">
                  <li style="margin-bottom: 8px;">Please arrive at the venue at least 30 minutes before the event starts</li>
                  <li style="margin-bottom: 8px;">Bring a valid government-issued photo ID for verification</li>
                  <li style="margin-bottom: 8px;">Keep this confirmation email handy for check-in</li>
                  <li style="margin-bottom: 8px;">For any queries, contact our support team using the details below</li>
                </ul>
              </div>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #444444;">
                We're excited to see you at the event! If you have any questions or need assistance, please don't hesitate to reach out to our team.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="mailto:${process.env.GMAIL_USER}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Contact Support</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">Need help? Contact us at 
                <a href="mailto:${process.env.GMAIL_USER}" style="color: #10b981; text-decoration: none;">${process.env.GMAIL_USER}</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">© 2025 ${process.env.GMAIL_FROM_NAME || 'Event Management Platform'}. All rights reserved.</p>
            </td>
          </tr>
        </table>

        <!-- Disclaimer -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                This confirmation email was sent automatically. Please keep it for your records.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Send confirmation email function with attachment
export const sendConfirmationEmailWithAttachment = async ({
  to,
  participantName,
  eventTitle,
  eventDate,
  eventVenue,
  registrationDetails,
  attachmentBuffer,
  attachmentFilename
}: {
  to: string;
  participantName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  registrationDetails: {
    fullName: string;
    mobileNumber: string;
    whatsappNumber?: string;
    collegeName: string;
    state: string;
    district: string;
  };
  attachmentBuffer?: Buffer;
  attachmentFilename?: string;
}) => {
  try {
    const html = generateConfirmationEmailHTML({
      participantName,
      eventTitle,
      eventDate,
      eventVenue,
      participantEmail: to,
      registrationDetails,
    });
    
    const mailOptions: any = {
      from: process.env.GMAIL_FROM_NAME ? `${process.env.GMAIL_FROM_NAME} <${process.env.GMAIL_USER}>` : process.env.GMAIL_USER,
      to,
      subject: `🎉 Registration Confirmed - ${eventTitle}`,
      html,
    };

    // Add attachment if provided
    if (attachmentBuffer && attachmentFilename) {
      mailOptions.attachments = [
        {
          filename: attachmentFilename,
          content: attachmentBuffer,
          contentType: 'application/pdf'
        }
      ];
    }
    
    const info = await mailer.sendMail(mailOptions);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send confirmation email with attachment:', error);
    throw error;
  }
};
