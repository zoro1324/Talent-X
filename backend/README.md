# Talent-X Backend API

A complete backend API for the Talent-X fitness assessment application with MongoDB database integration.

## Features

- **User Authentication**: JWT-based authentication with email verification
- **Athlete Management**: CRUD operations for athlete profiles
- **Test Results**: Store and analyze fitness test results
- **Email Service**: OTP verification and password reset emails
- **Rate Limiting**: Protection against abuse
- **Security**: Helmet.js security headers, password hashing

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer with Gmail SMTP
- **Validation**: express-validator
- **Security**: helmet, bcryptjs, cors

## Prerequisites

- Node.js v18+ 
- MongoDB v6+ (local or MongoDB Atlas)
- npm or yarn
- Gmail account with App Password configured

## Installation

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables**
   
   Create a `.env` file with the following:
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/talentx
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRY=7d
   JWT_REFRESH_SECRET=your-refresh-token-secret
   JWT_REFRESH_EXPIRY=30d
   
   # Gmail SMTP Configuration
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-gmail-app-password
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000,http://localhost:19006
   ```

3. **Start MongoDB**
   
   **Local MongoDB:**
   ```bash
   mongod
   ```
   
   **Or use MongoDB Atlas** - Update `MONGODB_URI` with your Atlas connection string

4. **Run the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production build
   npm run build
   npm start
   ```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/verify-otp` | Verify email with OTP |
| POST | `/api/auth/resend-otp` | Resend OTP |
| GET | `/api/auth/me` | Get current user (protected) |
| PUT | `/api/auth/me` | Update user profile (protected) |
| PUT | `/api/auth/change-password` | Change password (protected) |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with OTP |

### Athletes (Protected - Requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/athletes` | Create athlete profile |
| GET | `/api/athletes` | Get all athletes |
| GET | `/api/athletes/:id` | Get single athlete |
| PUT | `/api/athletes/:id` | Update athlete |
| DELETE | `/api/athletes/:id` | Delete athlete (soft) |
| PATCH | `/api/athletes/:id/restore` | Restore deleted athlete |
| GET | `/api/athletes/:id/stats` | Get athlete statistics |

### Test Results (Protected - Requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tests` | Save test result |
| GET | `/api/tests` | Get all test results |
| GET | `/api/tests/:id` | Get single test result |
| DELETE | `/api/tests/:id` | Delete test result |
| GET | `/api/tests/athlete/:id/history` | Get athlete test history |
| GET | `/api/tests/leaderboard/:testType` | Get leaderboard |
| GET | `/api/tests/stats/summary` | Get user statistics |

### Email
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/send-otp` | Send OTP email |
| GET | `/api/health` | Health check |

## Database Schema

### User
```javascript
{
  email: String,        // unique
  password: String,     // hashed with bcrypt
  firstName: String,
  lastName: String,
  isVerified: Boolean,
  verificationOTP: String,
  otpExpiry: Date,
  lastLogin: Date
}
```

### Athlete
```javascript
{
  userId: ObjectId,     // ref: User
  firstName: String,
  lastName: String,
  dateOfBirth: Date,
  gender: 'male' | 'female' | 'other',
  height: Number,       // in cm
  weight: Number,       // in kg
  sport: String,
  isActive: Boolean
}
```

### TestResult
```javascript
{
  athleteId: ObjectId,  // ref: Athlete
  userId: ObjectId,     // ref: User
  testType: 'squats' | 'pushups' | 'jump',
  duration: Number,     // in seconds
  totalReps: Number,
  score: {
    rawScore: Number,
    standardizedScore: Number,  // 0-100
    grade: 'A' | 'B' | 'C' | 'D' | 'F',
    feedback: [String]
  },
  averageFormScore: Number
}
```

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build TypeScript
npm start        # Start production server
npm run watch    # Watch mode for TypeScript
```

## Rate Limits

- General API: 100 requests / 15 minutes
- Authentication: 10 requests / 15 minutes
- OTP requests: 5 requests / 10 minutes
- Test submissions: 30 requests / hour

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
