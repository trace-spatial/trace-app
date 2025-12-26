/**
 * OnboardingScreen - Beautifully polished brand introduction and permission flow.
 *
 * Design System:
 * - Typography: Inter (body), Nothing Font accent for identity
 * - Spacing: 8px base unit (4, 8, 12, 16, 24, 32)
 * - Colors: White bg, functional state colors only
 * - Motion: Damped, smooth, purposeful (react-native-reanimated)
 * 
 * Flow:
 * 1. Splash (1.8s) - Logo + tagline with staggered fade-in
 * 2. Why things get lost - Educational with visual structure
 * 3. What Trace does - Brand promise + privacy guarantees
 * 4. Permissions - Sequential explanation → request
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, { 
  FadeIn, 
  FadeOut,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const { height } = Dimensions.get('window');

// Trace Design System - Spacing
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Trace Design System - Colors
const COLORS = {
  bg: '#FFFFFF',
  text_primary: '#111111',
  text_secondary: '#6B6B6B',
  text_tertiary: '#9A9A9A',
  bg_secondary: '#F7F7F7',
  divider: '#E6E6E6',
  success: '#2E7D32',
  warning: '#A15C00',
  error: '#B3261E',
};

// Trace Design System - Typography
const FONT_SIZES = {
  xs: 11,
  sm: 13,
  body: 15,
  heading: 18,
  title: 28,
};

interface OnboardingScreenProps {
  currentStep: number;
  onComplete: () => void;
  onRequestMotionPermission: (granted: boolean) => void;
  onRequestBackgroundPermission: (granted: boolean) => void;
  onSkip: () => void;
}

/**
 * Beautiful button with consistent styling and press feedback.
 */
const Button: React.FC<{
  onPress: () => void;
  label: string;
  variant?: 'primary' | 'secondary' | 'tertiary';
  disabled?: boolean;
}> = ({ onPress, label, variant = 'primary', disabled = false }) => {
  const [pressed, setPressed] = useState(false);

  const styles = {
    primary: {
      bg: disabled ? COLORS.text_tertiary : COLORS.text_primary,
      text: '#FFFFFF',
      opacity: pressed ? 0.8 : 1,
    },
    secondary: {
      bg: COLORS.bg_secondary,
      text: COLORS.text_primary,
      opacity: pressed ? 0.8 : 1,
    },
    tertiary: {
      bg: 'transparent',
      text: COLORS.text_secondary,
      opacity: pressed ? 0.6 : 1,
    },
  };

  const style = styles[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled}
      style={{
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        backgroundColor: style.bg,
        borderRadius: 8,
        alignItems: 'center',
        opacity: style.opacity,
      }}
    >
      <Text
        style={{
          fontSize: FONT_SIZES.body,
          fontWeight: '600',
          color: style.text,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * Splash screen - Logo + tagline with staggered animations.
 */
const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: SPACING.lg,
        }}
      >
        {/* Logo fade-in */}
        <Animated.View
          entering={FadeIn.duration(600)}
          style={{ marginBottom: SPACING.xl, alignItems: 'center' }}
        >
          <Image
            source={require('../../trace_logo.jpg')}
            style={{ width: 120, height: 120, borderRadius: 20 }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Tagline fade-in (delayed 200ms) */}
        <Animated.View entering={FadeIn.duration(600).delay(200)}>
          <Text
            style={{
              fontSize: FONT_SIZES.heading,
              fontWeight: '500',
              color: COLORS.text_primary,
              textAlign: 'center',
              lineHeight: FONT_SIZES.heading * 1.4,
            }}
          >
            Find what you lost after an interruption.
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

/**
 * Educational screen - Why things get lost.
 */
const WhyLostScreen: React.FC<{ onContinue: () => void; onSkip: () => void }> = ({
  onContinue,
  onSkip,
}) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(400)}>
          {/* Heading with proper hierarchy */}
          <Text
            style={{
              fontSize: FONT_SIZES.title,
              fontWeight: '700',
              color: COLORS.text_primary,
              marginBottom: SPACING.md,
              lineHeight: FONT_SIZES.title * 1.3,
            }}
          >
            Why things get lost
          </Text>

          {/* Subheading */}
          <Text
            style={{
              fontSize: FONT_SIZES.body,
              color: COLORS.text_secondary,
              lineHeight: FONT_SIZES.body * 1.5,
              marginBottom: SPACING.xl,
            }}
          >
            Most items are lost right after interruptions — not hours later.
          </Text>

          {/* Examples with visual structure */}
          <View style={{ marginBottom: SPACING.xxl }}>
            {[
              {
                title: 'A notification breaks your focus.',
                desc: 'You set your keys down without thinking.',
              },
              {
                title: 'You shift context.',
                desc: 'That moment of disruption is where your object remains.',
              },
              {
                title: 'You search later, memory already faded.',
                desc: 'But your phone never stopped moving.',
              },
            ].map((item, idx) => (
              <View
                key={idx}
                style={{
                  marginBottom: idx < 2 ? SPACING.lg : 0,
                  paddingBottom: idx < 2 ? SPACING.lg : 0,
                  borderBottomWidth: idx < 2 ? 1 : 0,
                  borderBottomColor: COLORS.divider,
                }}
              >
                <Text
                  style={{
                    fontSize: FONT_SIZES.body,
                    fontWeight: '600',
                    color: COLORS.text_primary,
                    marginBottom: SPACING.sm,
                  }}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    fontSize: FONT_SIZES.body,
                    color: COLORS.text_secondary,
                    lineHeight: FONT_SIZES.body * 1.5,
                  }}
                >
                  {item.desc}
                </Text>
              </View>
            ))}
          </View>

          {/* CTA with proper spacing */}
          <View style={{ gap: SPACING.md }}>
            <Button onPress={onContinue} label="Continue" variant="primary" />
            <Button onPress={onSkip} label="Skip" variant="tertiary" />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * Brand promise screen - What Trace does.
 */
const WhatTraceDoesScreen: React.FC<{ onContinue: () => void; onSkip: () => void }> = ({
  onContinue,
  onSkip,
}) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(400)}>
          {/* Main heading */}
          <Text
            style={{
              fontSize: FONT_SIZES.title,
              fontWeight: '700',
              color: COLORS.text_primary,
              marginBottom: SPACING.md,
              lineHeight: FONT_SIZES.title * 1.3,
            }}
          >
            What Trace does
          </Text>

          {/* Brand promise */}
          <Text
            style={{
              fontSize: FONT_SIZES.body,
              color: COLORS.text_secondary,
              lineHeight: FONT_SIZES.body * 1.5,
              marginBottom: SPACING.xl,
            }}
          >
            Replays interruption moments on your phone. No tracking.
          </Text>

          {/* How it works - section with better spacing */}
          <View style={{ marginBottom: SPACING.xxl }}>
            <View style={{ marginBottom: SPACING.lg }}>
              <Text
                style={{
                  fontSize: FONT_SIZES.sm,
                  fontWeight: '600',
                  color: COLORS.text_primary,
                  marginBottom: SPACING.sm,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                How It Works
              </Text>
            </View>

            {[
              {
                title: 'Learns your spaces',
                desc: 'Detects where you pause (kitchen, bedroom, car) through natural movement.',
              },
              {
                title: 'Finds disruptions',
                desc: 'Identifies moments when your attention shifted from your surroundings.',
              },
              {
                title: 'Guides you back',
                desc: 'Shows the exact moment and location where you lost focus.',
              },
            ].map((item, idx) => (
              <View
                key={idx}
                style={{
                  marginBottom: SPACING.lg,
                }}
              >
                <Text
                  style={{
                    fontSize: FONT_SIZES.body,
                    fontWeight: '600',
                    color: COLORS.text_primary,
                    marginBottom: SPACING.xs,
                  }}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    fontSize: FONT_SIZES.body,
                    color: COLORS.text_secondary,
                    lineHeight: FONT_SIZES.body * 1.5,
                  }}
                >
                  {item.desc}
                </Text>
              </View>
            ))}
          </View>

          {/* Privacy guarantees - highlighted box */}
          <View
            style={{
              padding: SPACING.lg,
              backgroundColor: COLORS.bg_secondary,
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: COLORS.success,
              marginBottom: SPACING.xxl,
            }}
          >
            <Text
              style={{
                fontSize: FONT_SIZES.sm,
                fontWeight: '600',
                color: COLORS.text_primary,
                marginBottom: SPACING.md,
              }}
            >
              This is how it stays private:
            </Text>
            <View style={{ gap: SPACING.sm }}>
              {[
                'No camera or microphone access',
                'No precise location tracking',
                'All data stays on your phone',
                'Works completely offline',
              ].map((guarantee, idx) => (
                <Text
                  key={idx}
                  style={{
                    fontSize: FONT_SIZES.body,
                    color: COLORS.text_secondary,
                    lineHeight: FONT_SIZES.body * 1.4,
                  }}
                >
                  • {guarantee}
                </Text>
              ))}
            </View>
          </View>

          {/* CTA */}
          <View style={{ gap: SPACING.md }}>
            <Button onPress={onContinue} label="Set up permissions" variant="primary" />
            <Button onPress={onSkip} label="Skip" variant="tertiary" />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * Permission request screens - Sequential explanation then request.
 */
const PermissionsScreen: React.FC<{
  onRequestMotionPermission: (granted: boolean) => void;
  onRequestBackgroundPermission: (granted: boolean) => void;
  onSkip: () => void;
}> = ({ onRequestMotionPermission, onRequestBackgroundPermission, onSkip }) => {
  const [step, setStep] = useState<'motion' | 'background' | 'done'>('motion');

  if (step === 'motion') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.xl,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(400)}>
            {/* Heading */}
            <Text
              style={{
                fontSize: FONT_SIZES.title,
                fontWeight: '700',
                color: COLORS.text_primary,
                marginBottom: SPACING.md,
                lineHeight: FONT_SIZES.title * 1.3,
              }}
            >
              Motion & Fitness
            </Text>

            {/* Explanation */}
            <Text
              style={{
                fontSize: FONT_SIZES.body,
                color: COLORS.text_secondary,
                lineHeight: FONT_SIZES.body * 1.5,
                marginBottom: SPACING.xl,
              }}
            >
              Used to detect pauses and interruptions in movement. No location, camera, or microphone access.
            </Text>

            {/* What it enables */}
            <View
              style={{
                padding: SPACING.lg,
                backgroundColor: COLORS.bg_secondary,
                borderRadius: 12,
                marginBottom: SPACING.lg,
              }}
            >
              <Text
                style={{
                  fontSize: FONT_SIZES.body,
                  color: COLORS.text_primary,
                  lineHeight: FONT_SIZES.body * 1.5,
                  fontWeight: '500',
                }}
              >
                This permission helps Trace understand when you pause — at the kitchen counter, in your car, by the bathroom sink. It's the foundation of everything Trace does.
              </Text>
            </View>

            {/* What happens if declined */}
            <View
              style={{
                padding: SPACING.lg,
                backgroundColor: '#FFFBF7',
                borderRadius: 12,
                borderLeftWidth: 4,
                borderLeftColor: COLORS.warning,
                marginBottom: SPACING.xxl,
              }}
            >
              <Text
                style={{
                  fontSize: FONT_SIZES.sm,
                  color: COLORS.text_secondary,
                  lineHeight: FONT_SIZES.sm * 1.5,
                }}
              >
                If you decline, Trace still works, but results may be less precise.
              </Text>
            </View>

            {/* CTA buttons */}
            <View style={{ gap: SPACING.md }}>
              <Button
                onPress={() => {
                  onRequestMotionPermission(true);
                  setStep('background');
                }}
                label="Allow"
                variant="primary"
              />
              <Button
                onPress={() => {
                  onRequestMotionPermission(false);
                  setStep('background');
                }}
                label="Allow only this time"
                variant="secondary"
              />
              <Button onPress={onSkip} label="Decline" variant="tertiary" />
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 'background') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.xl,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(400)}>
            {/* Heading */}
            <Text
              style={{
                fontSize: FONT_SIZES.title,
                fontWeight: '700',
                color: COLORS.text_primary,
                marginBottom: SPACING.md,
                lineHeight: FONT_SIZES.title * 1.3,
              }}
            >
              Background Activity
            </Text>

            {/* Explanation */}
            <Text
              style={{
                fontSize: FONT_SIZES.body,
                color: COLORS.text_secondary,
                lineHeight: FONT_SIZES.body * 1.5,
                marginBottom: SPACING.xl,
              }}
            >
              Allows interruption moments to be captured when the app is not open.
            </Text>

            {/* What it enables */}
            <View
              style={{
                padding: SPACING.lg,
                backgroundColor: COLORS.bg_secondary,
                borderRadius: 12,
                marginBottom: SPACING.lg,
              }}
            >
              <Text
                style={{
                  fontSize: FONT_SIZES.body,
                  color: COLORS.text_primary,
                  lineHeight: FONT_SIZES.body * 1.5,
                  fontWeight: '500',
                }}
              >
                This captures interruptions even when you're not using Trace. It's completely silent — you'll never know it's running.
              </Text>
            </View>

            {/* What happens if declined */}
            <View
              style={{
                padding: SPACING.lg,
                backgroundColor: '#FFFBF7',
                borderRadius: 12,
                borderLeftWidth: 4,
                borderLeftColor: COLORS.warning,
                marginBottom: SPACING.xxl,
              }}
            >
              <Text
                style={{
                  fontSize: FONT_SIZES.sm,
                  color: COLORS.text_secondary,
                  lineHeight: FONT_SIZES.sm * 1.5,
                }}
              >
                If you decline, you can still recover items manually.
              </Text>
            </View>

            {/* CTA buttons */}
            <View style={{ gap: SPACING.md }}>
              <Button
                onPress={() => {
                  onRequestBackgroundPermission(true);
                  setStep('done');
                }}
                label="Allow"
                variant="primary"
              />
              <Button
                onPress={() => {
                  onRequestBackgroundPermission(false);
                  setStep('done');
                }}
                label="Allow only this time"
                variant="secondary"
              />
              <Button
                onPress={() => {
                  onRequestBackgroundPermission(false);
                  setStep('done');
                }}
                label="Decline"
                variant="tertiary"
              />
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
};

/**
 * Main onboarding component.
 */
export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  currentStep,
  onComplete,
  onRequestMotionPermission,
  onRequestBackgroundPermission,
  onSkip,
}) => {
  if (currentStep === 0) {
    return <SplashScreen onComplete={onComplete} />;
  }

  if (currentStep === 1) {
    return <WhyLostScreen onContinue={onComplete} onSkip={onSkip} />;
  }

  if (currentStep === 2) {
    return <WhatTraceDoesScreen onContinue={onComplete} onSkip={onSkip} />;
  }

  if (currentStep === 3) {
    return (
      <PermissionsScreen
        onRequestMotionPermission={onRequestMotionPermission}
        onRequestBackgroundPermission={onRequestBackgroundPermission}
        onSkip={onSkip}
      />
    );
  }

  return null;
};

export default OnboardingScreen;
