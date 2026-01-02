/**
 * Application configuration
 */

// API Base URL - Update this based on your environment
// For development on same machine: http://localhost:5000/api
// For testing on physical device: http://<YOUR_IP_ADDRESS>:5000/api
// For production: https://your-api-domain.com/api

export const API_CONFIG = {
  // Use your computer's IP address when testing on Android/iOS device
  BASE_URL: 'http://192.168.205.57:5000/api',
  
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
