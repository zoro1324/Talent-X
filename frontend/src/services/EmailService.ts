/**
 * Email Service - Future use for notifications
 * Currently not in use after removing OTP verification system
 * 
 * Can be used for:
 * - Achievement notifications
 * - Workout reminders
 * - Test result summaries
 * - Account-related emails
 */

// Placeholder for future email functionality
export const sendEmail = async (email: string, subject: string, message: string): Promise<{ success: boolean; message: string }> => {
  // TODO: Implement email sending when needed
  return {
    success: true,
    message: 'Email sending not yet implemented',
  };
};
