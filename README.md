# Talent-X

An offline-first mobile app that enables fair sports talent assessment using on-device AI. Athletes can create profiles, select fitness tests (squats, push-ups, jumps), perform them using the phone camera, and receive instant standardized scores and feedback.

## Features

### 🏃 Athlete Profiles
- Create and manage athlete profiles
- Store basic info: name, date of birth, gender, height, weight, sport
- Track test history and progress over time

### 📱 Fitness Tests
- **Squats** - Lower body strength and endurance (60 seconds)
- **Push-Ups** - Upper body strength and endurance (60 seconds)
- **Vertical Jump** - Explosive lower body power (30 seconds)

### 🤖 On-Device AI (Edge AI)
- Real-time pose detection and analysis
- Form scoring and feedback
- Automatic repetition counting
- All processing runs locally - no internet required

### 📊 Standardized Scoring
- Percentile-based scoring using normative data
- Letter grades (A-F) based on performance
- Age and gender-adjusted scores
- Detailed feedback and improvement tips

### 💾 Offline-First
- All data stored locally on device
- Works without internet connection
- Optimized for low-end devices

## Tech Stack

- **React Native / Expo** - Cross-platform mobile framework
- **TypeScript** - Type-safe development
- **AsyncStorage** - Offline data persistence
- **Expo Camera** - Camera access for pose detection
- **TensorFlow.js** - On-device machine learning (pose detection)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo Go app on your mobile device (for testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/zoro1324/Talent-X.git
cd Talent-X

# Install dependencies
npm install

# Start the development server
npm start
```

### Running on Device

1. Install the **Expo Go** app on your iOS/Android device
2. Scan the QR code displayed in the terminal
3. The app will load on your device

### Running on Emulator

```bash
# For Android
npm run android

# For iOS (macOS only)
npm run ios

# For web browser
npm run web
```

## Project Structure

```
talent-x/
├── App.tsx                 # Main app entry point with navigation
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── TextInput.tsx
│   │   ├── Loading.tsx
│   │   ├── EmptyState.tsx
│   │   ├── AthleteCard.tsx
│   │   ├── TestResultCard.tsx
│   │   ├── TestSelectCard.tsx
│   │   └── ScoreDisplay.tsx
│   ├── screens/           # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── ProfileCreateScreen.tsx
│   │   ├── ProfileViewScreen.tsx
│   │   ├── TestSelectScreen.tsx
│   │   ├── TestCameraScreen.tsx
│   │   ├── TestResultScreen.tsx
│   │   └── HistoryScreen.tsx
│   ├── services/          # Business logic
│   │   ├── StorageService.ts      # Offline data persistence
│   │   ├── PoseAnalysisService.ts # On-device pose detection
│   │   └── ScoringService.ts      # Standardized scoring
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── assets/                # Images and fonts
└── package.json
```

## How It Works

### 1. Create Profile
Athletes create a profile with their basic information. This is stored locally on the device.

### 2. Select Test
Choose from three fitness tests: Squats, Push-Ups, or Vertical Jump.

### 3. Position & Calibrate
Position yourself so the camera can see your full body. The app calibrates to your standing position.

### 4. Perform Test
Execute the exercise while the on-device AI:
- Tracks your body position in real-time
- Counts repetitions automatically
- Monitors exercise form
- Provides instant feedback

### 5. View Results
After the test, view your:
- Standardized score (0-100)
- Letter grade (A-F)
- Percentile ranking
- Form analysis
- Personalized feedback
- Rep-by-rep breakdown

## Scoring System

Scores are calculated using normative data adjusted for:
- **Age** - Different expectations for different age groups
- **Gender** - Male and female norms
- **Form** - Quality of movement execution

### Grade Scale
- **A** (80-100): Excellent - Top 20%
- **B** (60-79): Good - Above Average
- **C** (40-59): Average - Middle Range
- **D** (20-39): Below Average
- **F** (0-19): Needs Improvement

## Privacy & Security

- All data stored locally on device
- No cloud sync or external servers
- No video is uploaded or saved
- Pose analysis happens entirely on-device
- Users have full control of their data

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- Pose detection inspired by TensorFlow.js MoveNet model
- Fitness scoring based on established physical fitness assessment standards