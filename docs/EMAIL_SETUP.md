# Email Service Configuration Guide

This application uses **Nodemailer** for sending transactional emails including OTP verification, welcome emails, password resets, attendance notifications, and payment confirmations.

## Setup Instructions

### 1. Configure Environment Variables

Add the following to your `.env` file:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
SMTP_FROM_NAME="ERP System"
```

### 2. Gmail Setup (Recommended for Development)

If using Gmail:

1. **Enable 2-Factor Authentication** on your Google Account
2. **Generate App Password**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification
   - Go to "App passwords"
   - Generate a new app password for "Mail"
   - Use this password in `SMTP_PASSWORD`

### 3. Alternative SMTP Providers

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
```

## Available Email Functions

### 1. Send OTP Email
```typescript
import { sendOTPEmail } from '@/lib/email'

await sendOTPEmail({
  email: 'user@example.com',
  otp: '123456',
  name: 'John Doe', // optional
  expiresIn: 10 // minutes, optional (default: 10)
})
```

### 2. Send Welcome Email
```typescript
import { sendWelcomeEmail } from '@/lib/email'

await sendWelcomeEmail({
  email: 'user@example.com',
  name: 'John Doe',
  role: 'STUDENT' // 'ADMIN' | 'TEACHER' | 'STUDENT'
})
```

### 3. Send Password Reset Email
```typescript
import { sendPasswordResetEmail } from '@/lib/email'

await sendPasswordResetEmail({
  email: 'user@example.com',
  name: 'John Doe',
  resetLink: 'https://yourapp.com/reset-password?token=xyz',
  expiresIn: 30 // minutes, optional (default: 30)
})
```

### 4. Send Attendance Notification
```typescript
import { sendAttendanceNotification } from '@/lib/email'

await sendAttendanceNotification({
  email: 'student@example.com',
  studentName: 'John Doe',
  date: '2026-01-15',
  status: 'PRESENT',
  subject: 'Mathematics'
})
```

### 5. Send Payment Confirmation
```typescript
import { sendPaymentConfirmation } from '@/lib/email'

await sendPaymentConfirmation({
  email: 'student@example.com',
  studentName: 'John Doe',
  amount: 50000,
  type: 'College Fee',
  receiptUrl: 'https://yourapp.com/receipts/123.pdf', // optional
  transactionId: 'TXN123456789'
})
```

## API Routes

### Send OTP
```bash
POST /api/email/send-otp

{
  "email": "user@example.com",
  "otp": "123456",
  "name": "John Doe"
}
```

### Send Welcome Email
```bash
POST /api/email/send-welcome

{
  "email": "user@example.com",
  "name": "John Doe",
  "role": "STUDENT"
}
```

## Email Templates

All emails use a professional, responsive HTML template with:
- Gradient header with app branding
- Clean, readable content layout
- Mobile-responsive design
- Consistent styling across all email types
- Plain text fallback for accessibility

## Testing

To test email configuration:

```typescript
import { verifyEmailConfig } from '@/lib/email/transporter'

const isReady = await verifyEmailConfig()
console.log('Email server ready:', isReady)
```

## Production Considerations

1. **Use a dedicated email service** (SendGrid, Mailgun, AWS SES) for production
2. **Set up SPF, DKIM, and DMARC** records for your domain
3. **Monitor email delivery rates** and bounce rates
4. **Implement rate limiting** to prevent abuse
5. **Add email queue** (Bull, BullMQ) for high-volume sending
6. **Enable logging** for tracking email delivery status
7. **Handle errors gracefully** and retry failed sends

## Troubleshooting

### Gmail "Less secure app" error
- Use App Passwords (requires 2FA enabled)
- Don't use your actual Gmail password

### Connection timeout
- Check firewall settings
- Verify SMTP host and port
- Try port 465 with `SMTP_SECURE=true`

### Emails going to spam
- Set up SPF/DKIM records
- Use a verified sending domain
- Avoid spam trigger words
- Include unsubscribe links

## Future Enhancements

- [ ] Email queue for bulk sending
- [ ] Email templates customization via admin panel
- [ ] Email delivery tracking and analytics
- [ ] Scheduled email campaigns
- [ ] Email preferences management
- [ ] Multi-language email support
