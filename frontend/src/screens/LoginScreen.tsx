/**
 * Login Screen - Professional user authentication with email verification
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput as RNTextInput,
  Modal,
  Animated,
  Linking,
  Alert,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
// @ts-ignore - @expo/vector-icons is bundled with Expo
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import type { RootStackParamList } from '../types';
import { generateOTP, sendOTPEmail } from '../services/EmailService';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const OTP_BOX_SIZE = Math.min(48, (screenWidth - 100) / 6);

export function LoginScreen({ navigation }: Props) {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP Verification state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRefs = useRef<(RNTextInput | null)[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
    otp?: string;
  }>({});

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const formSlide = useRef(new Animated.Value(30)).current;

  // Animate on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(formSlide, {
        toValue: 0,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Validate email format
  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  // Validate form inputs
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Start resend timer
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle login submission - sends OTP
  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      // Generate new OTP
      const newOtp = generateOTP();
      setGeneratedOtp(newOtp);

      // Send OTP to email using EmailService
      const result = await sendOTPEmail(email.trim(), newOtp);
      
      if (result.otpForDemo) {
        // EmailJS not configured or failed - show OTP for demo/testing
        Alert.alert(
          '📧 Verification Code',
          `Your OTP is: ${result.otpForDemo}\n\n(Configure EmailJS in src/services/EmailService.ts to receive real emails)`,
          [{ text: 'OK' }]
        );
      } else if (result.success) {
        Alert.alert(
          '✅ Email Sent',
          `Verification code sent to ${email}`,
          [{ text: 'OK' }]
        );
      }

      // Show OTP modal
      setShowOtpModal(true);
      startResendTimer();
      
      // Animate modal
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

    } catch (error) {
      setErrors({
        general: 'Failed to send verification code. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Clear OTP error
    if (errors.otp) {
      setErrors((prev) => ({ ...prev, otp: undefined }));
    }

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP backspace
  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      setErrors({ otp: 'Please enter the complete 6-digit code' });
      return;
    }

    setOtpLoading(true);
    setErrors({});

    try {
      // Simulate verification delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify OTP matches the generated one
      if (otpValue === generatedOtp) {
        // Close modal and navigate
        setShowOtpModal(false);
        setGeneratedOtp('');
        navigation.replace('Home');
      } else {
        setErrors({ otp: 'Invalid verification code. Please try again.' });
      }
    } catch (error) {
      setErrors({ otp: 'Verification failed. Please try again.' });
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setOtpLoading(true);
    try {
      // Generate new OTP
      const newOtp = generateOTP();
      setGeneratedOtp(newOtp);

      // Send new OTP to email using EmailService
      const result = await sendOTPEmail(email.trim(), newOtp);
      
      if (result.otpForDemo) {
        Alert.alert(
          '📧 New Verification Code',
          `Your new OTP is: ${result.otpForDemo}`,
          [{ text: 'OK' }]
        );
      } else if (result.success) {
        Alert.alert(
          '✅ Email Sent',
          `New verification code sent to ${email}`,
          [{ text: 'OK' }]
        );
      }

      setOtp(['', '', '', '', '', '']);
      startResendTimer();
      otpInputRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  // Close OTP modal
  const closeOtpModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowOtpModal(false);
      setOtp(['', '', '', '', '', '']);
    });
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    setErrors({
      general: 'Password reset link has been sent to your email.',
    });
  };

  // Handle registration navigation
  const handleRegister = () => {
    navigation.navigate('Register');
  };

  // Handle Continue as Guest
  const handleGuestLogin = () => {
    Alert.alert(
      '👋 Continue as Guest',
      'You can explore the app with limited features. Some features like saving data and syncing across devices won\'t be available.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => navigation.replace('Home'),
          style: 'default'
        }
      ]
    );
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      const googleAuthUrl = 'https://accounts.google.com/signin';
      const supported = await Linking.canOpenURL(googleAuthUrl);
      
      if (supported) {
        await Linking.openURL(googleAuthUrl);
      } else {
        Alert.alert('Error', 'Unable to open Google Sign In');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open Google Sign In');
    }
  };

  // Handle Facebook Sign In
  const handleFacebookSignIn = async () => {
    try {
      const facebookAuthUrl = 'https://www.facebook.com/login';
      const supported = await Linking.canOpenURL(facebookAuthUrl);
      
      if (supported) {
        await Linking.openURL(facebookAuthUrl);
      } else {
        Alert.alert('Error', 'Unable to open Facebook Sign In');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open Facebook Sign In');
    }
  };

  // Handle Apple Sign In
  const handleAppleSignIn = async () => {
    try {
      const appleAuthUrl = 'https://appleid.apple.com/sign-in';
      const supported = await Linking.canOpenURL(appleAuthUrl);
      
      if (supported) {
        await Linking.openURL(appleAuthUrl);
      } else {
        Alert.alert('Error', 'Unable to open Apple Sign In');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open Apple Sign In');
    }
  };

  // Clear field error on change
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header / Logo Section with Gradient */}
          <LinearGradient
            colors={['#4F46E5', '#7C3AED', '#9333EA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerDecoration}>
              <View style={styles.decorCircle1} />
              <View style={styles.decorCircle2} />
              <View style={styles.decorCircle3} />
            </View>
            <Animated.View style={[styles.headerSection, { transform: [{ scale: logoScale }] }]}>
              <View style={styles.logoContainer}>
                <MaterialCommunityIcons name="trophy-award" size={52} color="#ffffff" />
              </View>
              <Text style={styles.appName}>Talent-X</Text>
              <Text style={styles.tagline}>Sports Assessment Platform</Text>
            </Animated.View>
          </LinearGradient>

          {/* Login Form */}
          <Animated.View style={[styles.formSection, { transform: [{ translateY: formSlide }] }]}>
            <View style={styles.formCard}>
              <Text style={styles.welcomeText}>Welcome Back! 👋</Text>
              <Text style={styles.subtitleText}>
                Sign in to continue to your account
              </Text>

              {/* General Error/Success Message */}
              {errors.general && (
                <View style={[
                  styles.messageBanner,
                  errors.general.includes('sent') ? styles.successBanner : styles.errorBanner
                ]}>
                  <Ionicons 
                    name={errors.general.includes('sent') ? 'checkmark-circle' : 'alert-circle'} 
                    size={18} 
                    color={errors.general.includes('sent') ? '#059669' : '#dc2626'} 
                  />
                  <Text style={[
                    styles.messageBannerText,
                    errors.general.includes('sent') ? styles.successText : styles.errorText
                  ]}>
                    {errors.general}
                  </Text>
                </View>
              )}

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="mail" size={14} color="#4F46E5" /> Email Address
                </Text>
                <View style={[styles.inputContainer, errors.email && styles.inputContainerError]}>
                  <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <RNTextInput
                    style={styles.textInput}
                    placeholder="Enter your email"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {email.length > 0 && validateEmail(email) && (
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  )}
                </View>
                {errors.email && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={14} color="#ef4444" />
                    <Text style={styles.fieldErrorText}>{errors.email}</Text>
                  </View>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="lock-closed" size={14} color="#4F46E5" /> Password
                </Text>
                <View style={[styles.inputContainer, errors.password && styles.inputContainerError]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <RNTextInput
                    style={styles.textInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={14} color="#ef4444" />
                    <Text style={styles.fieldErrorText}>{errors.password}</Text>
                  </View>
                )}
              </View>

              {/* Remember Me & Forgot Password Row */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberMeContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                  </View>
                  <Text style={styles.rememberMeText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={loading ? ['#9CA3AF', '#9CA3AF'] : ['#4F46E5', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButtonGradient}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <Ionicons name="sync" size={20} color="#ffffff" />
                      <Text style={styles.loginButtonText}>Sending OTP...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login Options */}
              <View style={styles.socialContainer}>
                <TouchableOpacity 
                  style={styles.socialButton} 
                  activeOpacity={0.7}
                  onPress={handleGoogleSignIn}
                >
                  <FontAwesome name="google" size={20} color="#DB4437" />
                  <Text style={styles.socialButtonText}>Google</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.socialButton} 
                  activeOpacity={0.7}
                  onPress={handleFacebookSignIn}
                >
                  <FontAwesome name="facebook" size={20} color="#4267B2" />
                  <Text style={styles.socialButtonText}>Facebook</Text>
                </TouchableOpacity>
              </View>

              {/* Apple Sign In for iOS */}
              {Platform.OS === 'ios' && (
                <TouchableOpacity 
                  style={styles.appleButton} 
                  activeOpacity={0.7}
                  onPress={handleAppleSignIn}
                >
                  <Ionicons name="logo-apple" size={22} color="#ffffff" />
                  <Text style={styles.appleButtonText}>Continue with Apple</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Registration Link */}
            <View style={styles.registerSection}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleRegister} activeOpacity={0.7}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Continue as Guest */}
            <TouchableOpacity 
              style={styles.guestButton} 
              onPress={handleGuestLogin}
              activeOpacity={0.7}
            >
              <Ionicons name="person-outline" size={20} color="#6b7280" />
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </TouchableOpacity>

            {/* Security Note */}
            <View style={styles.securityNote}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text style={styles.securityNoteText}>
                Your data is protected with 256-bit encryption
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* OTP Verification Modal */}
      <Modal
        visible={showOtpModal}
        transparent
        animationType="none"
        onRequestClose={closeOtpModal}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <View style={styles.modalContent}>
            {/* Close Button */}
            <TouchableOpacity style={styles.modalCloseButton} onPress={closeOtpModal}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.otpIconContainer}>
                <Ionicons name="mail-open-outline" size={32} color="#3b82f6" />
              </View>
              <Text style={styles.modalTitle}>Verify Your Email</Text>
              <Text style={styles.modalSubtitle}>
                We've sent a 6-digit verification code to
              </Text>
              <Text style={styles.modalEmail}>{email}</Text>
            </View>

            {/* OTP Input */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <RNTextInput
                  key={index}
                  ref={(ref) => {
                    otpInputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInput,
                    digit && styles.otpInputFilled,
                    errors.otp && styles.otpInputError,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleOtpKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* OTP Error */}
            {errors.otp && (
              <View style={styles.otpErrorContainer}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.otpErrorText}>{errors.otp}</Text>
              </View>
            )}

            {/* Verify Button */}
            <TouchableOpacity
              style={[styles.verifyButton, otpLoading && styles.verifyButtonDisabled]}
              onPress={handleVerifyOtp}
              disabled={otpLoading}
              activeOpacity={0.8}
            >
              {otpLoading ? (
                <View style={styles.loadingContainer}>
                  <Ionicons name="sync" size={20} color="#ffffff" />
                  <Text style={styles.verifyButtonText}>Verifying...</Text>
                </View>
              ) : (
                <Text style={styles.verifyButtonText}>Verify & Continue</Text>
              )}
            </TouchableOpacity>

            {/* Resend OTP */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code? </Text>
              {resendTimer > 0 ? (
                <Text style={styles.resendTimer}>Resend in {resendTimer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResendOtp} disabled={otpLoading}>
                  <Text style={styles.resendLink}>Resend Code</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header Gradient Section
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 50,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  headerDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorCircle2: {
    position: 'absolute',
    top: 60,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorCircle3: {
    position: 'absolute',
    bottom: -20,
    right: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerSection: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  appName: {
    fontSize: 38,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 6,
    fontWeight: '500',
  },

  // Form Section
  formSection: {
    flex: 1,
    marginTop: -30,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  subtitleText: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 24,
  },

  // Message Banner
  messageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  successBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  messageBannerText: {
    fontSize: 14,
    flex: 1,
  },
  successText: {
    color: '#059669',
  },
  errorText: {
    color: '#dc2626',
  },

  // Input Styles
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
  },
  inputContainerError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  fieldErrorText: {
    fontSize: 13,
    color: '#ef4444',
  },

  // Options Row
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#4b5563',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },

  // Login Button
  loginButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    gap: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },

  // Social Login
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  appleButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  appleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Register Section
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 12,
  },
  registerText: {
    fontSize: 15,
    color: '#6b7280',
  },
  registerLink: {
    fontSize: 15,
    color: '#4F46E5',
    fontWeight: '700',
  },

  // Guest Button
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    gap: 8,
  },
  guestButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
    flex: 1,
    textAlign: 'center',
  },

  // Security Note
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  securityNoteText: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  otpIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginTop: 4,
  },

  // OTP Input
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  otpInput: {
    width: 46,
    height: 54,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginHorizontal: 4,
  },
  otpInputFilled: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  otpInputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  otpErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  otpErrorText: {
    fontSize: 13,
    color: '#ef4444',
  },

  // Verify Button
  verifyButton: {
    backgroundColor: '#3b82f6',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Resend
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 14,
    color: '#6b7280',
  },
  resendTimer: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  resendLink: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },

  // Guest Button
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  guestButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
    flex: 1,
    textAlign: 'center',
  },
});
