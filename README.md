# Talent-X: AI-Powered Fitness Assessment Platform

A comprehensive mobile and web-based fitness testing platform that uses on-device AI (pose detection) to automatically evaluate athlete performance across 16 different fitness tests, with real-time scoring, leaderboards, and training recommendations.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Setup & Installation](#setup--installation)
7. [Running the Application](#running-the-application)
8. [API Documentation](#api-documentation)
9. [Fitness Tests Supported](#fitness-tests-supported)
10. [Database Schema](#database-schema)
11. [Authentication Flow](#authentication-flow)
12. [Scoring System](#scoring-system)
13. [Deployment Guide](#deployment-guide)
14. [Troubleshooting](#troubleshooting)
15. [Development Roadmap](#development-roadmap)

---

## 🎯 Project Overview

**Talent-X** is an athlete performance tracking and assessment platform designed for schools, sports clubs, and fitness facilities. It provides:

- **Offline AI Assessment**: On-device pose detection using TensorFlow.js (MoveNet) for no-internet-required testing
- **Real-time Scoring**: Automated performance evaluation with standardized fitness norms
- **Multi-Sport Support**: Pre-configured exercises and training plans for 8 sports (Cricket, Basketball, Swimming, Volleyball, Kabaddi, Football, Tennis, Athletics)
- **16 Fitness Tests**: Comprehensive body coverage from strength (squats, pushups) to power (broad jump) to endurance (running, shuttle run)
- **Leaderboards & Analytics**: Track progress, compare athletes, and visualize performance metrics
- **Mobile-First Design**: React Native + Expo for iOS and Android with optimized UI/UX
- **Secure JWT Authentication**: Token-based authentication with refresh token rotation
- **Offline-First Architecture**: LocalStorage for offline athlete/test data with cloud sync

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (React Native)                   │
│  - Expo for cross-platform mobile development               │
│  - TensorFlow.js + MoveNet for on-device pose detection     │
│  - Local storage for offline data persistence               │
│  - Real-time exercise tracking UI                           │
└─────────────────┬───────────────────────────────────────────┘
                  │ REST API (HTTP/HTTPS)
┌─────────────────▼───────────────────────────────────────────┐
│                Backend (Node.js + Express)                  │
│  - JWT-based authentication                                 │
│  - Role-based access control (user/admin)                   │
│  - Rate limiting & security middleware                      │
│  - RESTful API endpoints for all operations                 │
└─────────────────┬───────────────────────────────────────────┘
                  │ SQL (Sequelize ORM)
┌─────────────────▼───────────────────────────────────────────┐
│              Database (MySQL/MariaDB)                       │
│  - User authentication & profiles                           │
│  - Athlete records & performance history                    │
│  - Test results with detailed metrics                       │
│  - Sports, exercises, and training plans                    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Authentication**: User logs in → JWT token issued → token stored locally
2. **Athlete Management**: Create/select athlete profile → stored in LocalStorage
3. **Test Selection**: Choose test type → navigate to camera screen
4. **Pose Detection**: Camera captures frames → MoveNet analyzes poses in real-time
5. **Rep Counting**: Pose transitions detected → rep counter incremented → form scored
6. **Score Calculation**: Raw score + form assessment → percentile & grade generated
7. **Data Submission**: Test result sent to backend → stored in database
8. **Leaderboard**: Results synced → athlete ranked against peers

---

## ✨ Features

### ✅ Implemented

- ✅ User Registration & Authentication (JWT-based)
- ✅ Athlete Profile Creation & Management
- ✅ 16 Fitness Tests with auto-detection
- ✅ Real-time On-Device AI Pose Detection (demo/simulated)
- ✅ Automated Rep & Reps Counting
- ✅ Form Scoring (0-100 based on pose accuracy)
- ✅ Standardized Percentile & Grade Calculation
- ✅ Test Results Storage & Retrieval
- ✅ Leaderboards (Per-test rankings)
- ✅ Sport-Specific Exercise Library
- ✅ Training Plans (Beginner/Intermediate/Advanced)
- ✅ Dashboard with Stats Summary
- ✅ Offline Data Storage (LocalStorage with cloud sync)
- ✅ Responsive Mobile UI
- ✅ Dark mode support
- ✅ Rate limiting & security (Helmet, CORS)

### 🚀 Upcoming Features

- [ ] Production TensorFlow.js MoveNet integration (currently simulated)
- [ ] Video recording during tests
- [ ] Social features (friend challenges, groups)
- [ ] Custom workout plans
- [ ] Push notifications for achievements
- [ ] Advanced analytics & trend analysis
- [ ] Integration with wearables (Apple Watch, Fitbit)
- [ ] Web dashboard for coaches/admins
- [ ] Batch import/export of athlete data

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18
- **Language**: TypeScript 5.3
- **Database**: MySQL 8 / MariaDB
- **ORM**: Sequelize 6.35
- **Authentication**: JWT (jsonwebtoken 9.0)
- **Password Hashing**: bcryptjs 2.4
- **Security**: Helmet 7.1, CORS 2.8, express-rate-limit 7.1
- **Validation**: express-validator 7.0
- **Environment**: dotenv 16.3

### Frontend
- **Framework**: React Native
- **Package Manager**: Expo 50+ (Managed hosting)
- **Language**: TypeScript 5.3
- **UI Components**: React Native core (View, ScrollView, FlatList, etc.)
- **Navigation**: React Navigation 6.x
- **AI/ML**: TensorFlow.js (proposed), MoveNet (proposed)
- **Local Storage**: AsyncStorage / React Native LocalStorage
- **HTTP Client**: Fetch API (native)
- **Camera**: expo-camera
- **State Management**: React Hooks (useState, useEffect, useContext)

---

## 📁 Project Structure

```
talent-x/
├── backend/
│   ├── src/
│   │   ├── index.ts                 # Main server entry point
│   │   ├── config/
│   │   │   ├── database.ts          # Sequelize MySQL config
│   │   │   └── mailer.ts            # Email service config (unused after removing OTP)
│   │   ├── controllers/             # Business logic & route handlers
│   │   │   ├── authController.ts    # User registration/login/profile
│   │   │   ├── athleteController.ts # Athlete CRUD operations
│   │   │   ├── testResultController.ts # Test result management
│   │   │   ├── sportController.ts   # Sports & exercises with seeding
│   │   │   ├── dashboardController.ts # Analytics & stats
│   │   │   └── planController.ts    # Training plan generation
│   │   ├── models/                  # Sequelize database models
│   │   │   ├── User.ts              # User account & auth
│   │   │   ├── Athlete.ts           # Athlete profiles (linked to User)
│   │   │   ├── TestResult.ts        # Fitness test results & scoring
│   │   │   ├── Sport.ts             # Sports metadata
│   │   │   ├── Exercise.ts          # Sport-specific exercises
│   │   │   ├── TrainingPlan.ts      # Personalized training programs
│   │   │   ├── PlanWorkout.ts       # Individual workouts in plans
│   │   │   └── index.ts             # Model associations
│   │   ├── routes/                  # API endpoint definitions
│   │   │   ├── authRoutes.ts        # /api/auth/*
│   │   │   ├── athleteRoutes.ts     # /api/athletes/*
│   │   │   ├── testResultRoutes.ts  # /api/tests/*
│   │   │   ├── sportRoutes.ts       # /api/sports/*
│   │   │   ├── dashboardRoutes.ts   # /api/dashboard/*
│   │   │   ├── planRoutes.ts        # /api/plans/*
│   │   │   ├── emailRoutes.ts       # /api/email/* (depreciated)
│   │   │   └── index.ts             # Route exports
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT verification & role checks
│   │   │   ├── rateLimiter.ts       # Express rate limiting
│   │   │   └── index.ts             # Middleware exports
│   │   ├── services/
│   │   │   └── emailService.ts      # Email utilities (unused after OTP removal)
│   │   ├── types/
│   │   │   └── email.ts             # Email type definitions
│   │   ├── utils/
│   │   │   └── emailUtils.ts        # Email helper functions
│   │   └── scripts/
│   │       ├── syncDatabase.ts      # Manual DB sync & seed
│   │       └── migrateTestTypes.ts  # Database migration for new test types
│   ├── migrations/                  # Database migrations
│   │   └── 20260126000000-add-new-test-types.js
│   ├── .env                         # Environment variables (secrets)
│   ├── package.json                 # Dependencies & scripts
│   ├── tsconfig.json                # TypeScript compiler config
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                  # Main app component & navigation
│   │   ├── index.ts                 # App entry point
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Button.tsx           # Pressable button
│   │   │   ├── Card.tsx             # Card layout wrapper
│   │   │   ├── TextInput.tsx        # Styled input field
│   │   │   ├── Loading.tsx          # Spinner/loading indicator
│   │   │   ├── EmptyState.tsx       # Empty state display
│   │   │   ├── AthleteCard.tsx      # Athlete profile card
│   │   │   ├── TestSelectCard.tsx   # Test option card
│   │   │   ├── TestResultCard.tsx   # Test result display
│   │   │   ├── ScoreDisplay.tsx     # Score & grade visualization
│   │   │   ├── PlanWidget.tsx       # Training plan widget
│   │   │   └── index.ts             # Component exports
│   │   ├── screens/                 # Full-screen views
│   │   │   ├── LoginScreen.tsx      # User login
│   │   │   ├── SignupScreen.tsx     # User registration (removed OTP)
│   │   │   ├── ProfileCreateScreen.tsx # Athlete profile creation
│   │   │   ├── ProfileViewScreen.tsx  # View athlete profile
│   │   │   ├── HomeScreen.tsx       # Dashboard & main menu
│   │   │   ├── TestSelectScreen.tsx # Choose test to perform
│   │   │   ├── TestCameraScreen.tsx # Perform test w/ pose detection
│   │   │   ├── TestResultScreen.tsx # View test result & score
│   │   │   ├── HistoryScreen.tsx    # Test history & leaderboards
│   │   │   ├── SportExercisesScreen.tsx # View sport-specific exercises
│   │   │   └── index.ts             # Screen exports
│   │   ├── services/                # Business logic & API clients
│   │   │   ├── ApiService.ts        # HTTP client for backend API
│   │   │   ├── PoseAnalysisService.ts # Keypoint analysis & form detection
│   │   │   ├── ScoringService.ts    # Percentile, grade, feedback calculation
│   │   │   ├── StorageService.ts    # LocalStorage for offline data
│   │   │   ├── EmailService.ts      # Email sending (EmailJS/Web3Forms)
│   │   │   └── index.ts             # Service exports
│   │   ├── hooks/                   # Custom React hooks
│   │   │   └── index.ts             # useAthlete, useTestResults, useCountdown, etc.
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript type definitions
│   │   ├── utils/
│   │   │   └── index.ts             # Helper functions & formatting
│   │   ├── config/
│   │   │   └── index.ts             # API endpoint config (BASE_URL, HOST_IP)
│   │   └── assets/                  # Images, fonts, static files
│   ├── app.json                     # Expo app configuration
│   ├── App.tsx                      # Root component (navigation setup)
│   ├── package.json                 # Dependencies & scripts
│   ├── tsconfig.json                # TypeScript compiler config
│   └── README.md
│
├── .gitignore                       # Git ignore rules
└── README.md                        # This file
```

---

## 🚀 Setup & Installation

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn**
- **MySQL** 8.0+ or **MariaDB** 10.x+
- **Android/iOS device** or emulator for mobile testing
- **Expo CLI** (for frontend development)

### Backend Setup

1. **Navigate to backend**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables** (create `.env`):
   ```env
   # MySQL Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=talentx
   DB_USER=root
   DB_PASSWORD=your_password

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRY=7d
   JWT_REFRESH_SECRET=your-refresh-secret
   JWT_REFRESH_EXPIRY=30d

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # CORS Configuration
   CORS_ORIGIN=*

   # Email Configuration (optional - not used after OTP removal)
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-app-password
   ```

4. **Create MySQL database**:
   ```bash
   mysql -u root -p
   CREATE DATABASE talentx;
   ```

5. **Sync database (auto-creates tables and seeds data)**:
   ```bash
   npm run db:sync
   ```

6. **Run migration for new test types** (if updating from older version):
   ```bash
   npm run db:migrate
   ```

7. **Start development server**:
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:5000`

---

### Frontend Setup

1. **Navigate to frontend**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   expo install
   ```

3. **Configure environment** (in `src/config/index.ts`):
   ```typescript
   // Update HOST_IP to your machine's network IP
   const HOST_IP = '192.168.1.6'; // Replace with your computer's IP
   const USE_EMULATOR = false;     // Set to true if using Android emulator
   const API_BASE_URL = USE_EMULATOR
     ? 'http://10.0.2.2:5000/api'  // Android emulator
     : `http://${HOST_IP}:5000/api`;  // Physical device
   ```

4. **Start Expo development server**:
   ```bash
   npm start
   # or
   expo start
   ```

5. **Run on device/emulator**:
   - **Android**: Press `a` in Expo CLI
   - **iOS**: Press `i` in Expo CLI
   - **Mobile Device**: Scan QR code with Expo Go app

---

## ▶️ Running the Application

### Full Stack

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm start
```

### Production Build

**Backend**:
```bash
npm run build
npm start
```

**Frontend**:
```bash
eas build --platform android  # iOS requires Apple Developer account
expo publish                  # Deploy to Expo servers
```

---

## 📡 API Documentation

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response (201):
{
  "success": true,
  "message": "Registration successful.",
  "data": {
    "user": { "id": 1, "email": "john@example.com", ... },
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "...",
    "refreshToken": "..."
  }
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": { "id": 1, "email": "...", "firstName": "..." }
}
```

### Athlete Endpoints

#### Create Athlete
```http
POST /athletes
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Alex",
  "lastName": "Smith",
  "dateOfBirth": "2005-01-15",
  "gender": "male",
  "height": 175,
  "weight": 70,
  "sport": "Basketball"
}

Response (201):
{
  "success": true,
  "data": { "id": 1, "userId": 1, ... }
}
```

#### Get All Athletes
```http
GET /athletes
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": [ { ... }, { ... } ]
}
```

#### Get Athlete By ID
```http
GET /athletes/:id
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": { "id": 1, ... }
}
```

### Test Result Endpoints

#### Create Test Result
```http
POST /tests
Authorization: Bearer {token}
Content-Type: application/json

{
  "athleteId": 1,
  "testType": "squats",
  "startedAt": "2026-01-26T10:30:00Z",
  "completedAt": "2026-01-26T10:31:00Z",
  "duration": 60,
  "repetitions": [
    {
      "startTime": 0,
      "endTime": 1000,
      "duration": 1000,
      "formScore": 95,
      "issues": []
    }
  ],
  "totalReps": 35,
  "score": {
    "rawScore": 35,
    "standardizedScore": 85,
    "percentile": 75,
    "grade": "B",
    "feedback": ["Good job!"]
  },
  "averageFormScore": 92
}

Response (201):
{
  "success": true,
  "data": { "id": 1, ... }
}
```

#### Get Test Results
```http
GET /tests?athleteId=1&testType=squats&page=1&limit=10
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "testResults": [ ... ],
    "pagination": { "page": 1, "limit": 10, "total": 25, "pages": 3 }
  }
}
```

#### Get Leaderboard
```http
GET /tests/leaderboard/squats?limit=10
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "testType": "squats",
    "leaderboard": [
      {
        "rank": 1,
        "athleteId": 5,
        "athleteName": "John Doe",
        "bestScore": 92,
        "totalReps": 40,
        "averageFormScore": 94
      },
      ...
    ]
  }
}
```

### Sports Endpoints

#### Get All Sports
```http
GET /sports
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Cricket",
      "icon": "🏏",
      "color": ["#4CAF50", "#2E7D32"],
      "athletes": 45
    },
    ...
  ]
}
```

#### Get Sport Exercises
```http
GET /sports/1/exercises?difficulty=beginner
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "sport": { "id": "1", "name": "Cricket", ... },
    "exercises": [
      {
        "id": "1",
        "name": "Shadow Batting",
        "description": "...",
        "difficulty": "beginner",
        "muscleGroups": ["Arms", "Core"],
        "duration": 300,
        "calories": 80
      },
      ...
    ],
    "total": 3
  }
}
```

### Dashboard Endpoints

#### Get Stats Summary
```http
GET /dashboard/stats
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "totalAthletes": 15,
    "totalTests": 234,
    "averageScore": 72.5,
    "topTest": "squats"
  }
}
```

#### Get Achievements
```http
GET /dashboard/achievements
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "1",
      "title": "First Steps",
      "description": "Complete your first test",
      "icon": "🎯",
      "earned": true,
      "earnedAt": "2026-01-20T..."
    },
    ...
  ]
}
```

---

## 💪 Fitness Tests Supported

All tests now support **16 different exercise types** covering all major muscle groups:

### Lower Body & Core
| Test | Type | Duration | Metric | Primary Muscles |
|------|------|----------|--------|-----------------|
| **Squats** | Reps | 60s | Repetitions | Quads, Glutes, Core |
| **Wall Sit** | Isometric | 120s | Time (seconds) | Quads, Glutes |
| **Lunges** | Reps | 60s | Repetitions | Glutes, Hamstrings, Quads |
| **Lateral Hops** | Reps | 30s | Repetitions | Glutes, Calves, Quads |
| **Broad Jump** | Power | 45s | Distance (cm) | Glutes, Hamstrings, Calves |

### Upper Body
| Test | Type | Duration | Metric | Primary Muscles |
|------|------|----------|--------|-----------------|
| **Push-Ups** | Reps | 60s | Repetitions | Chest, Triceps, Core |
| **Hand-Release Push-Ups** | Reps | 60s | Repetitions | Chest, Triceps, Core (ROM) |
| **Pull-Ups** | Reps | 120s | Repetitions | Back, Biceps, Shoulders |

### Core
| Test | Type | Duration | Metric | Primary Muscles |
|------|------|----------|--------|-----------------|
| **Plank Hold** | Isometric | 120s | Time (seconds) | Rectus Abdominis, Transverse Abdominis, Glutes |
| **Sit-Ups** | Reps | 60s | Repetitions | Core, Hip Flexors |
| **Mountain Climbers** | Reps | 60s | Repetitions | Abs, Hip Flexors, Shoulders |

### Full Body
| Test | Type | Duration | Metric | Primary Muscles |
|------|------|----------|--------|-----------------|
| **Burpees** | Reps | 60s | Repetitions | Full Body, Cardio |
| **Vertical Jump** | Power | 30s | Height (cm) | Glutes, Quads, Calves |
| **Running Speed** | Cardio | 30s | Distance (m) | Legs, Cardio |

### Balance & Agility
| Test | Type | Duration | Metric | Primary Muscles |
|------|------|----------|--------|-----------------|
| **Single-Leg Balance** | Balance | 60s | Time (seconds) | Ankle/Knee/Hip Stabilizers |
| **20m Shuttle Run** | Agility | 180s | Shuttles | Cardio, Legs, Change-of-Direction |

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(100),
  lastName VARCHAR(100),
  lastLogin TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Athletes Table
```sql
CREATE TABLE athletes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  dateOfBirth DATE,
  gender ENUM('male', 'female', 'other'),
  height INT,
  weight INT,
  sport VARCHAR(100),
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### TestResults Table
```sql
CREATE TABLE test_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  athleteId INT NOT NULL,
  userId INT NOT NULL,
  test_type ENUM('squats', 'pushups', 'jump', 'situps', 'pullups', 'running',
                 'plank', 'wall_sit', 'burpees', 'lunges', 'mountain_climbers',
                 'broad_jump', 'single_leg_balance', 'lateral_hops',
                 'hand_release_pushups', 'shuttle_run') NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP NOT NULL,
  duration INT,
  repetitions JSON,
  total_reps INT,
  score JSON,
  average_form_score FLOAT,
  is_valid BOOLEAN DEFAULT true,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  FOREIGN KEY (athleteId) REFERENCES athletes(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (test_type),
  INDEX (athleteId, test_type)
);
```

### Sports Table
```sql
CREATE TABLE sports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50),
  colorPrimary VARCHAR(7),
  colorSecondary VARCHAR(7),
  image VARCHAR(500),
  description TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### Exercises Table
```sql
CREATE TABLE exercises (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sport_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50),
  image VARCHAR(500),
  video_url VARCHAR(500),
  duration INT,
  difficulty ENUM('beginner', 'intermediate', 'advanced'),
  muscle_groups JSON,
  equipment JSON,
  instructions JSON,
  benefits JSON,
  calories INT,
  sets INT,
  reps INT,
  is_active BOOLEAN DEFAULT true,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE CASCADE,
  INDEX (sport_id)
);
```

---

## 🔐 Authentication Flow

```
┌─────────────┐
│  Mobile App │
└──────┬──────┘
       │
       ├─ Enter credentials
       └─ POST /auth/register or /auth/login
                  │
       ┌──────────▼──────────┐
       │   Backend Server    │
       │                     │
       │ 1. Validate input   │
       │ 2. Hash password    │
       │ 3. Check DB         │
       │ 4. Generate tokens  │
       └──────────┬──────────┘
                  │
       ┌──────────▼──────────────────┐
       │  Response with JWT Tokens   │
       │  - access_token (7 days)    │
       │  - refresh_token (30 days)  │
       └──────────┬──────────────────┘
                  │
       ┌──────────▼──────────┐
       │  Mobile App         │
       │  - Store tokens in  │
       │    AsyncStorage     │
       │  - Use access token │
       │    in API calls     │
       └─────────────────────┘

Protected API Call Flow:
┌─────────────────────────────────┐
│ API Request                     │
│ GET /athletes                   │
│ Authorization: Bearer {token}   │
└────────────────┬────────────────┘
                 │
       ┌─────────▼────────────┐
       │  Middleware           │
       │  - Extract token      │
       │  - Verify signature   │
       │  - Check expiry       │
       └─────────┬────────────┘
                 │
       ┌─────────▼─────────────────┐
       │  If valid → Route handler │
       │  If expired → 401         │
       │  If invalid → 403         │
       └───────────────────────────┘
```

---

## 📊 Scoring System

### Percentile Calculation

Talent-X uses **normative data** based on age and gender to calculate percentiles:

```typescript
// Example: Squats Test
// Male, 18-25 years: p10=20, p25=25, p50=35, p75=45, p90=55

If score = 40 reps:
  - Falls between p50 (35) and p75 (45)
  - Percentile = 50 + ((40-35)/(45-35)) * 25 = 62.5 → 63rd percentile
```

### Grade Assignment

```typescript
Percentile   Grade   Description
80-100       A       Excellent (Top 20%)
60-79        B       Good (Above Average)
40-59        C       Average (Middle 40%)
20-39        D       Below Average (Needs Improvement)
0-19         F       Poor (Significant Improvement Needed)
```

### Score Calculation

```
Final Score = (Percentile × 0.8) + (Form Adjustment)
Form Adjustment = (Average Form Score / 100) × Percentile × 0.2

Example:
- Raw Score: 40 squats → 63rd percentile
- Average Form Score: 85/100
- Form Adjustment: (85/100) × 63 × 0.2 = 10.71
- Final Standardized Score: (63 × 0.8) + 10.71 = 61.1 → 61 points
```

### Feedback Logic

Feedback is generated based on:
1. **Performance**: Percentile rank (excellent/good/average/poor)
2. **Form**: Form quality (outstanding/good/fair/needs work)
3. **Test-Specific Tips**: Unique advice per exercise type
4. **Consistency**: Rep timing variance analysis

---

## 🚀 Deployment Guide

### Backend Deployment (Heroku Example)

1. **Create Heroku app**:
   ```bash
   heroku create talent-x-backend
   ```

2. **Set environment variables**:
   ```bash
   heroku config:set DB_HOST=your-db-host
   heroku config:set DB_USER=your-db-user
   heroku config:set DB_PASSWORD=your-password
   heroku config:set JWT_SECRET=your-secret
   ```

3. **Deploy**:
   ```bash
   git push heroku main
   ```

### Frontend Deployment (EAS/Expo)

1. **Create EAS account**:
   ```bash
   eas login
   ```

2. **Build for Android/iOS**:
   ```bash
   eas build --platform android
   eas build --platform ios
   ```

3. **Publish to Expo**:
   ```bash
   expo publish
   ```

4. **Submit to App Stores**:
   ```bash
   eas submit --platform android
   eas submit --platform ios
   ```

---

## 🔧 Troubleshooting

### Connection Issues

**Problem**: "Failed to connect to API"

**Solutions**:
1. Check backend is running: `http://localhost:5000/api/health`
2. Update `HOST_IP` in `frontend/src/config/index.ts` to your computer's IP
3. Ensure both devices are on the same WiFi network
4. Check firewall isn't blocking port 5000

**Problem**: "localhost doesn't work on mobile device"

**Solution**: Mobile devices can't access `localhost`. Use your computer's network IP:
- Find IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Update `src/config/index.ts` with your IP
- Example: `http://192.168.1.6:5000/api`

### Database Issues

**Problem**: "Access denied for user 'root'"

**Solutions**:
1. Check `.env` file has correct credentials
2. Verify MySQL is running: `mysql -u root -p`
3. Ensure database exists: `CREATE DATABASE talentx;`

**Problem**: "Table doesn't exist"

**Solutions**:
1. Run sync: `npm run db:sync`
2. Check migrations ran: `npm run db:migrate`

### Frontend Issues

**Problem**: "Module not found" errors

**Solution**: Reinstall dependencies:
```bash
rm -rf node_modules
npm install
npm start
```

**Problem**: "Camera permission denied"

**Solution**: Grant camera permission:
- Android: Settings → Apps → Talent-X → Permissions → Camera
- iOS: Settings → Privacy → Camera → Talent-X

---

## 🗺️ Development Roadmap

### Phase 1: Core Features (✅ Complete)
- [x] User authentication (JWT)
- [x] Athlete profile management
- [x] 16 fitness tests
- [x] Real-time scoring & grading
- [x] Leaderboards
- [x] Sport-specific exercises
- [x] Training plans
- [x] Offline data storage

### Phase 2: AI Enhancement (🚀 Next)
- [ ] Implement production TensorFlow.js + MoveNet
- [ ] Multi-person pose detection
- [ ] Advanced form analysis
- [ ] Video recording integration
- [ ] Real-time form corrections

### Phase 3: Social & Engagement (📅 Q2 2026)
- [ ] Friend/rival system
- [ ] Group challenges
- [ ] Social leaderboards
- [ ] Chat & messaging
- [ ] Workout sharing

### Phase 4: Advanced Analytics (📅 Q3 2026)
- [ ] Predictive performance trends
- [ ] Personalized recommendations
- [ ] Injury risk assessment
- [ ] Custom training algorithms
- [ ] Integration with wearables

### Phase 5: Web Dashboard (📅 Q4 2026)
- [ ] Admin dashboard
- [ ] Coach management interface
- [ ] Batch athlete import/export
- [ ] Custom report generation
- [ ] School/organization management

---

## 📝 License

This project is proprietary software. All rights reserved.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a Pull Request

---

## 💬 Support

For issues or questions:
- **GitHub Issues**: [Create an issue](https://github.com/zoro1324/Talent-X/issues)
- **Email**: support@talent-x.com
- **Discord**: [Join our server](https://discord.gg/talent-x)

---

## 👥 Team

- **Created by**: Talent-X Development Team
- **Current Version**: 1.0.0
- **Last Updated**: January 26, 2026

---

**Made with ❤️ for athletes and coaches worldwide**
