# Talent-X Backend

Node.js backend server for Talent-X mobile app. Handles email notifications and OTP verification.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Gmail account with App Password configured

## Setup Instructions

### 1. Configure Gmail

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (if not already enabled)
3. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Select **Mail** and **Windows Computer** (or your device)
5. Generate a 16-character password
6. Copy the password

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`
2. Update the following values in `.env`:
   ```
   GMAIL_USER=naveen13524g@gmail.com
   GMAIL_APP_PASSWORD=your-16-character-password-from-step-1
   PORT=5000
   ```

### 4. Build and Run

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
```http
GET /api/health
```

### Send OTP Email
```http
POST /api/send-otp
Content-Type: application/json

{
  "to_email": "user@example.com",
  "to_name": "John Doe",
  "otp_code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to user@example.com",
  "messageId": "..."
}
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files (mailer, etc.)
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── index.ts         # Entry point
├── dist/                # Compiled JavaScript (generated)
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── .env                 # Environment variables (local)
└── .env.example         # Environment template
```

## Features

- ✅ Google SMTP integration for reliable email delivery
- ✅ Input validation with express-validator
- ✅ Security headers with Helmet
- ✅ CORS support for frontend apps
- ✅ Professional HTML email templates
- ✅ Comprehensive error handling
- ✅ TypeScript for type safety

## Troubleshooting

### "Authentication failed" error
- Ensure 2-Step Verification is enabled on your Gmail account
- Verify you're using an App Password (not your Gmail password)
- Check that the 16-character password is entered correctly in .env

### "CORS error" when calling from frontend
- Update `CORS_ORIGIN` in `.env` with your frontend URL
- Example: `CORS_ORIGIN=http://localhost:3000,http://localhost:19006`

### Port already in use
- Change the `PORT` in `.env` to an available port
- Or kill the process using that port

## Next Steps

1. Update [EmailService.ts](../src/services/EmailService.ts) in the frontend to point to your backend URL
2. Deploy to a hosting service (Heroku, Railway, Render, etc.)
3. Update `CORS_ORIGIN` with production URL when deploying

## Support

For issues or questions, please create an issue in the repository.
