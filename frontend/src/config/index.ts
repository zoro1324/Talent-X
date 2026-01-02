/**
 * Application configuration
 */

// API Configuration
// IMPORTANT: Update HOST_IP with your computer's local IP address
// To find your IP:
// - Windows: Open CMD and run 'ipconfig' - look for IPv4 Address
// - Mac/Linux: Run 'ifconfig' or 'ip addr' in terminal

const HOST_IP = '192.168.205.57'; // Your computer's local IP address
const USE_EMULATOR = true; // Set to false when testing on physical device

export const API_CONFIG = {
  // Automatically uses 10.0.2.2 for emulator or your IP for physical device
  BASE_URL: `http://${USE_EMULATOR ? '10.0.2.2' : HOST_IP}:5000/api`,
  
  // Timeout for API requests (in milliseconds)
  TIMEOUT: 30000,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};

// App constants
export const APP_CONFIG = {
  APP_NAME: 'Talent-X',
  VERSION: '1.0.0',
  
  // Storage keys
  STORAGE_KEYS: {
    AUTH_TOKEN: '@talent_x_auth_token',
    USER_DATA: '@talent_x_user_data',
    ATHLETES: '@talent_x_athletes',
    TEST_RESULTS: '@talent_x_results',
    SETTINGS: '@talent_x_settings',
  },
  
  // Feature flags
  FEATURES: {
    OFFLINE_MODE: true,
    PUSH_NOTIFICATIONS: false,
    ANALYTICS: false,
  },
};

export default {
  API: API_CONFIG,
  APP: APP_CONFIG,
};
