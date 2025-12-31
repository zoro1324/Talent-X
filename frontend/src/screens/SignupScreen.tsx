/**
 * Professional Signup Screen - User registration with full validation and OTP verification
 * Features: Animated inputs, gradient header, password strength, OTP verification, social signup
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
// @ts-ignore - @expo/vector-icons is bundled with Expo
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import type { RootStackParamList } from '../types';
import { generateOTP, sendOTPEmail } from '../services/EmailService';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Simulated user database for duplicate check (in production, use real API)
const existingUsers: { email: string; phone: string }[] = [];

export function SignupScreen({ navigation }: Props) {
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  // Focus states for animated labels
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // OTP Verification state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRefs = useRef<(RNTextInput | null)[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
    general?: string;
    otp?: string;
  }>({});

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    label: string;
    color: string;
    requirements: { met: boolean; text: string }[];
  }>({ 
    score: 0, 
    label: '', 
    color: '#e5e7eb',
    requirements: []
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Input animations
  const nameAnim = useRef(new Animated.Value(0)).current;
  const emailAnim = useRef(new Animated.Value(0)).current;
  const phoneAnim = useRef(new Animated.Value(0)).current;
  const passwordAnim = useRef(new Animated.Value(0)).current;
  const confirmPasswordAnim = useRef(new Animated.Value(0)).current;

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered input animations
    const inputAnims = [nameAnim, emailAnim, phoneAnim, passwordAnim, confirmPasswordAnim];
    inputAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 400 + index * 100,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // Validate email format
  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  // Validate phone format (10+ digits)
  const validatePhone = (value: string): boolean => {
    const phoneRegex = /^[+]?[\d\s-]{10,}$/;
    return phoneRegex.test(value.replace(/\s/g, ''));
  };

  // Calculate password strength with detailed requirements
  const calculatePasswordStrength = (pass: string) => {
    const requirements = [
      { met: pass.length >= 8, text: 'At least 8 characters' },
      { met: /[a-z]/.test(pass), text: 'One lowercase letter' },
      { met: /[A-Z]/.test(pass), text: 'One uppercase letter' },
      { met: /\d/.test(pass), text: 'One number' },
      { met: /[!@#$%^&*(),.?":{}|<>]/.test(pass), text: 'One special character' },
    ];

    const score = requirements.filter(r => r.met).length;

    const strengths = [
      { score: 0, label: '', color: '#e5e7eb' },
      { score: 1, label: 'Very Weak', color: '#ef4444' },
      { score: 2, label: 'Weak', color: '#f97316' },
      { score: 3, label: 'Fair', color: '#eab308' },
      { score: 4, label: 'Good', color: '#22c55e' },
      { score: 5, label: 'Strong', color: '#059669' },
    ];

    setPasswordStrength({
      ...strengths[Math.min(score, 5)],
      requirements,
    });
  };

  // Check for duplicate registration
  const checkDuplicate = (emailVal: string, phoneVal: string): { isDuplicate: boolean; field: string } => {
    const emailExists = existingUsers.some(u => u.email.toLowerCase() === emailVal.toLowerCase());
    const phoneExists = existingUsers.some(u => u.phone === phoneVal.replace(/\s/g, ''));
    
    if (emailExists) return { isDuplicate: true, field: 'email' };
    if (phoneExists) return { isDuplicate: true, field: 'phone' };
    return { isDuplicate: false, field: '' };
  };

  // Validate form inputs
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Full name validation
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(fullName.trim())) {
      newErrors.fullName = 'Name can only contain letters and spaces';
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!phone.trim()) {
      newErrors.phone = 'Mobile number is required';
    } else if (!validatePhone(phone.trim())) {
      newErrors.phone = 'Please enter a valid mobile number (10+ digits)';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength.score < 3) {
      newErrors.password = 'Password is too weak. Please add more complexity';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms validation
    if (!acceptTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    // Check for duplicate registration
    if (!newErrors.email && !newErrors.phone) {
      const duplicate = checkDuplicate(email.trim(), phone.trim());
      if (duplicate.isDuplicate) {
        if (duplicate.field === 'email') {
          newErrors.email = 'This email is already registered';
        } else {
          newErrors.phone = 'This phone number is already registered';
        }
      }
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

  // Handle signup submission - sends OTP
  const handleSignup = async () => {
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
        Alert.alert(
          'Verification Code',
          `Your OTP is: ${result.otpForDemo}\n\n(Configure EmailJS to receive real emails)`,
          [{ text: 'OK' }]
        );
      } else if (result.success) {
        Alert.alert(
          'Email Sent',
          `Verification code sent to ${email}`,
          [{ text: 'OK' }]
        );
      }

      // Show OTP modal
      setShowOtpModal(true);
      startResendTimer();
      
      // Animate modal
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

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

    if (errors.otp) {
      setErrors((prev) => ({ ...prev, otp: undefined }));
    }

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

  // Verify OTP and complete registration
  const handleVerifyOtp = async () => {
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      setErrors({ otp: 'Please enter the complete 6-digit code' });
      return;
    }

    setOtpLoading(true);
    setErrors({});

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (otpValue === generatedOtp) {
        // Store user data (in production, send to backend API)
        existingUsers.push({
          email: email.trim().toLowerCase(),
          phone: phone.replace(/\s/g, ''),
        });

        // Close modal
        setShowOtpModal(false);
        setGeneratedOtp('');

        // Show success message
        Alert.alert(
          'Account Created!',
          'Your account has been successfully created. Please login to continue.',
          [
            {
              text: 'Go to Login',
              onPress: () => navigation.replace('Login'),
            },
          ]
        );
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
      const newOtp = generateOTP();
      setGeneratedOtp(newOtp);

      const result = await sendOTPEmail(email.trim(), newOtp);
      
      if (result.otpForDemo) {
        Alert.alert(
          'New Verification Code',
          `Your new OTP is: ${result.otpForDemo}`,
          [{ text: 'OK' }]
        );
      } else if (result.success) {
        Alert.alert(
          'Email Sent',
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
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowOtpModal(false);
      setOtp(['', '', '', '', '', '']);
    });
  };

  // Navigate to login
  const handleLogin = () => {
    navigation.navigate('Login');
  };

  // Social signup handlers
  const handleGoogleSignup = async () => {
    try {
      await Linking.openURL('https://accounts.google.com/signup');
    } catch (error) {
      Alert.alert('Error', 'Failed to open Google Sign Up');
    }
  };

  const handleFacebookSignup = async () => {
    try {
      await Linking.openURL('https://www.facebook.com/r.php');
    } catch (error) {
      Alert.alert('Error', 'Failed to open Facebook Sign Up');
    }
  };

  const handleAppleSignup = async () => {
    try {
      await Linking.openURL('https://appleid.apple.com/account');
    } catch (error) {
      Alert.alert('Error', 'Failed to open Apple Sign Up');
    }
  };

  // Clear field errors on change
  const handleFieldChange = (field: string, value: string, setter: (val: string) => void) => {
    setter(value);
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (field === 'password') {
      calculatePasswordStrength(value);
    }
  };

  // Render input with animation
  const renderInput = (
    label: string,
    placeholder: string,
    value: string,
    onChangeText: (val: string) => void,
    icon: string,
    fieldName: string,
    animation: Animated.Value,
    options?: {
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      secureTextEntry?: boolean;
      showToggle?: boolean;
      toggleState?: boolean;
      onToggle?: () => void;
      autoCapitalize?: 'none' | 'words';
    }
  ) => {
    const error = errors[fieldName as keyof typeof errors];
    const isFocused = focusedField === fieldName;

    return (
      <Animated.View 
        style={[
          styles.inputGroup,
          {
            opacity: animation,
            transform: [
              {
                translateY: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.inputLabel}>{label}</Text>
        <View 
          style={[
            styles.inputContainer, 
            isFocused && styles.inputContainerFocused,
            error && styles.inputContainerError
          ]}
        >
          <Ionicons 
            name={icon as any} 
            size={20} 
            color={isFocused ? '#3b82f6' : error ? '#ef4444' : '#9ca3af'} 
            style={styles.inputIcon} 
          />
          <RNTextInput
            style={styles.textInput}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            value={value}
            onChangeText={(val) => handleFieldChange(fieldName, val, onChangeText)}
            onFocus={() => setFocusedField(fieldName)}
            onBlur={() => setFocusedField(null)}
            keyboardType={options?.keyboardType || 'default'}
            secureTextEntry={options?.secureTextEntry && !options?.toggleState}
            autoCapitalize={options?.autoCapitalize || 'none'}
            autoCorrect={false}
          />
          {options?.showToggle && (
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={options.onToggle}
              activeOpacity={0.7}
            >
              <Ionicons
                name={options.toggleState ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>
          )}
        </View>
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color="#ef4444" />
            <Text style={styles.fieldErrorText}>{error}</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Gradient Header */}
          <Animated.View 
            style={[
              styles.headerSection,
              {
                opacity: headerAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#3b82f6', '#1d4ed8', '#1e40af']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            >
              {/* Back Button */}
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <View style={styles.backButtonCircle}>
                  <Ionicons name="arrow-back" size={22} color="#ffffff" />
                </View>
              </TouchableOpacity>

              {/* Logo and Title */}
              <View style={styles.headerContent}>
                <View style={styles.logoContainer}>
                  <Ionicons name="trophy" size={40} color="#ffffff" />
                </View>
                <Text style={styles.appName}>Create Account</Text>
                <Text style={styles.tagline}>Join the Talent-X community today</Text>
              </View>

              {/* Decorative Elements */}
              <View style={styles.decorCircle1} />
              <View style={styles.decorCircle2} />
              <View style={styles.decorCircle3} />
            </LinearGradient>
          </Animated.View>

          {/* Form Card */}
          <Animated.View 
            style={[
              styles.formCard,
              {
                opacity: formAnim,
                transform: [
                  {
                    translateY: formAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* General Error Message */}
            {errors.general && (
              <View style={[styles.messageBanner, styles.errorBanner]}>
                <Ionicons name="alert-circle" size={20} color="#dc2626" />
                <Text style={[styles.messageBannerText, styles.errorText]}>
                  {errors.general}
                </Text>
              </View>
            )}

            {/* Full Name Input */}
            {renderInput(
              'Full Name',
              'Enter your full name',
              fullName,
              setFullName,
              'person-outline',
              'fullName',
              nameAnim,
              { autoCapitalize: 'words' }
            )}

            {/* Email Input */}
            {renderInput(
              'Email Address',
              'Enter your email',
              email,
              setEmail,
              'mail-outline',
              'email',
              emailAnim,
              { keyboardType: 'email-address' }
            )}

            {/* Phone Input */}
            {renderInput(
              'Mobile Number',
              'Enter your mobile number',
              phone,
              setPhone,
              'call-outline',
              'phone',
              phoneAnim,
              { keyboardType: 'phone-pad' }
            )}

            {/* Password Input */}
            {renderInput(
              'Password',
              'Create a strong password',
              password,
              setPassword,
              'lock-closed-outline',
              'password',
              passwordAnim,
              {
                secureTextEntry: true,
                showToggle: true,
                toggleState: showPassword,
                onToggle: () => setShowPassword(!showPassword),
              }
            )}

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <View style={styles.strengthSection}>
                <View style={styles.strengthHeader}>
                  <Text style={styles.strengthLabel}>Password Strength</Text>
                  <Text style={[styles.strengthValue, { color: passwordStrength.color }]}>
                    {passwordStrength.label}
                  </Text>
                </View>
                <View style={styles.strengthBars}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            level <= passwordStrength.score
                              ? passwordStrength.color
                              : '#e5e7eb',
                        },
                      ]}
                    />
                  ))}
                </View>
                <View style={styles.requirementsContainer}>
                  {passwordStrength.requirements.map((req, index) => (
                    <View key={index} style={styles.requirementRow}>
                      <Ionicons 
                        name={req.met ? 'checkmark-circle' : 'ellipse-outline'} 
                        size={14} 
                        color={req.met ? '#22c55e' : '#9ca3af'} 
                      />
                      <Text style={[
                        styles.requirementText,
                        req.met && styles.requirementMet
                      ]}>
                        {req.text}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Confirm Password Input */}
            {renderInput(
              'Confirm Password',
              'Re-enter your password',
              confirmPassword,
              setConfirmPassword,
              'shield-checkmark-outline',
              'confirmPassword',
              confirmPasswordAnim,
              {
                secureTextEntry: true,
                showToggle: true,
                toggleState: showConfirmPassword,
                onToggle: () => setShowConfirmPassword(!showConfirmPassword),
              }
            )}

            {/* Password Match Indicator */}
            {confirmPassword.length > 0 && password === confirmPassword && (
              <View style={styles.matchContainer}>
                <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                <Text style={styles.matchText}>Passwords match perfectly!</Text>
              </View>
            )}

            {/* Terms and Conditions */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAcceptTerms(!acceptTerms)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                {acceptTerms && <Ionicons name="checkmark" size={14} color="#ffffff" />}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
            {errors.terms && (
              <View style={[styles.errorContainer, { marginTop: -12, marginBottom: 16 }]}>
                <Ionicons name="alert-circle" size={14} color="#ef4444" />
                <Text style={styles.fieldErrorText}>{errors.terms}</Text>
              </View>
            )}

            {/* Signup Button */}
            <TouchableOpacity
              style={[styles.signupButton, loading && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ['#93c5fd', '#93c5fd'] : ['#3b82f6', '#1d4ed8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signupButtonGradient}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <Ionicons name="sync" size={20} color="#ffffff" />
                    <Text style={styles.signupButtonText}>Creating Account...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.signupButtonText}>Create Account</Text>
                    <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerTextContainer}>
                <Text style={styles.dividerText}>or continue with</Text>
              </View>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Signup Options */}
            <View style={styles.socialContainer}>
              <TouchableOpacity 
                style={styles.socialButton} 
                activeOpacity={0.7}
                onPress={handleGoogleSignup}
              >
                <FontAwesome name="google" size={20} color="#DB4437" />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialButton} 
                activeOpacity={0.7}
                onPress={handleFacebookSignup}
              >
                <FontAwesome name="facebook" size={20} color="#4267B2" />
                <Text style={styles.socialButtonText}>Facebook</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.socialButton, styles.socialButtonApple]} 
                activeOpacity={0.7}
                onPress={handleAppleSignup}
              >
                <Ionicons name="logo-apple" size={22} color="#ffffff" />
                <Text style={[styles.socialButtonText, styles.socialButtonTextApple]}>Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Login Link */}
            <View style={styles.loginSection}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={handleLogin} activeOpacity={0.7}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By creating an account, you agree to our community guidelines
            </Text>
          </View>
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
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity style={styles.modalCloseButton} onPress={closeOtpModal}>
              <View style={styles.closeButtonCircle}>
                <Ionicons name="close" size={20} color="#6b7280" />
              </View>
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <LinearGradient
                colors={['#3b82f6', '#1d4ed8']}
                style={styles.otpIconContainer}
              >
                <Ionicons name="mail-open-outline" size={36} color="#ffffff" />
              </LinearGradient>
              <Text style={styles.modalTitle}>Verify Your Email</Text>
              <Text style={styles.modalSubtitle}>
                We've sent a 6-digit verification code to
              </Text>
              <Text style={styles.modalEmail}>{email}</Text>
            </View>

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

            {errors.otp && (
              <View style={styles.otpErrorContainer}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.otpErrorText}>{errors.otp}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.verifyButton, otpLoading && styles.verifyButtonDisabled]}
              onPress={handleVerifyOtp}
              disabled={otpLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={otpLoading ? ['#93c5fd', '#93c5fd'] : ['#3b82f6', '#1d4ed8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.verifyButtonGradient}
              >
                {otpLoading ? (
                  <View style={styles.loadingContainer}>
                    <Ionicons name="sync" size={20} color="#ffffff" />
                    <Text style={styles.verifyButtonText}>Verifying...</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={20} color="#ffffff" />
                    <Text style={styles.verifyButtonText}>Verify & Create Account</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code? </Text>
              {resendTimer > 0 ? (
                <View style={styles.timerContainer}>
                  <Ionicons name="time-outline" size={14} color="#9ca3af" />
                  <Text style={styles.resendTimer}>{resendTimer}s</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={handleResendOtp} disabled={otpLoading}>
                  <Text style={styles.resendLink}>Resend Code</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header Section with Gradient
  headerSection: {
    overflow: 'hidden',
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 60,
    paddingHorizontal: 24,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 6,
  },
  decorCircle1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -30,
    right: -40,
  },
  decorCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    bottom: 20,
    left: -30,
  },
  decorCircle3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: 60,
    left: 50,
  },

  // Form Card
  formCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -40,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },

  // Message Banner
  messageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  messageBannerText: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
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
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
  },
  inputContainerFocused: {
    borderColor: '#3b82f6',
    backgroundColor: '#ffffff',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  inputContainerError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  inputIcon: {
    marginRight: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 6,
    marginLeft: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  fieldErrorText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '500',
  },

  // Password Strength Section
  strengthSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    marginTop: -10,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  strengthLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  strengthValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  strengthBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  requirementsContainer: {
    gap: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  requirementMet: {
    color: '#22c55e',
    fontWeight: '500',
  },

  // Password Match
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 18,
    gap: 6,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 10,
  },
  matchText: {
    fontSize: 13,
    color: '#22c55e',
    fontWeight: '600',
  },

  // Terms
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
  },
  termsLink: {
    color: '#3b82f6',
    fontWeight: '600',
  },

  // Signup Button
  signupButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  signupButtonDisabled: {
    shadowOpacity: 0.15,
  },
  signupButtonGradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  signupButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerTextContainer: {
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  dividerText: {
    fontSize: 13,
    color: '#94a3b8',
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
    height: 52,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  socialButtonApple: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  socialButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  socialButtonTextApple: {
    color: '#ffffff',
  },

  // Login Section
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
  },
  loginText: {
    fontSize: 15,
    color: '#64748b',
  },
  loginLink: {
    fontSize: 15,
    color: '#3b82f6',
    fontWeight: '700',
  },

  // Footer
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    backgroundColor: '#ffffff',
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  closeButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  otpIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  modalEmail: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3b82f6',
    marginTop: 6,
  },

  // OTP Input
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
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
    gap: 8,
    marginBottom: 20,
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 10,
    width: '100%',
  },
  otpErrorText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },

  // Verify Button
  verifyButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  verifyButtonDisabled: {
    shadowOpacity: 0.15,
  },
  verifyButtonGradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  verifyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Resend
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  resendText: {
    fontSize: 14,
    color: '#64748b',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resendTimer: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  resendLink: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '700',
  },
});
