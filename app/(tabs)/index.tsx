import { useState } from 'react';
import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useBatteryState } from '../../_utils/hooks/useBatteryState';
import { useTraceStore } from '../../_utils/state/traceStore';
import { useOnboarding } from '../../_utils/hooks/useOnboarding';
import { OnboardingScreen } from '../screens/OnboardingScreen';

// Trace Design System
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

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

const FONT_SIZES = {
  xs: 11,
  sm: 13,
  body: 15,
  heading: 18,
  title: 28,
};

export default function HomeScreen() {
  const { level, isLowPower } = useBatteryState();
  const store = useTraceStore();
  const onboarding = useOnboarding();
  const [showExplanation, setShowExplanation] = useState(false);

  // Show onboarding if user hasn't completed it yet
  if (onboarding.showOnboarding) {
    return (
      <OnboardingScreen
        currentStep={onboarding.currentStep}
        onComplete={onboarding.completeOnboarding}
        onRequestMotionPermission={onboarding.requestMotionPermission}
        onRequestBackgroundPermission={onboarding.requestBackgroundPermission}
        onSkip={onboarding.skipOnboarding}
      />
    );
  }

  // Main home screen after onboarding
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView 
        contentContainerStyle={{ 
          paddingHorizontal: SPACING.lg, 
          paddingVertical: SPACING.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{ alignItems: 'center', marginBottom: SPACING.xxl }}
        >
          <Image
            source={require('../../trace_logo.jpg')}
            style={{ width: 80, height: 80, borderRadius: 16 }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Status Pill */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(50)}
          style={{ alignSelf: 'center', marginBottom: SPACING.lg }}
        >
          <TouchableOpacity
            onPress={() => setShowExplanation(!showExplanation)}
            style={{
              paddingHorizontal: SPACING.md,
              paddingVertical: SPACING.xs,
              borderRadius: 20,
              backgroundColor: COLORS.bg_secondary,
            }}
          >
            <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.text_secondary, fontWeight: '500' }}>
              On device
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Explanation */}
        {showExplanation && (
          <Animated.View
            entering={FadeInDown.duration(200)}
            exiting={FadeOutUp.duration(200)}
            style={{
              marginBottom: SPACING.lg,
              padding: SPACING.md,
              backgroundColor: COLORS.bg_secondary,
              borderRadius: 12,
              borderLeftWidth: 3,
              borderLeftColor: COLORS.success,
            }}
          >
            <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.text_primary, lineHeight: FONT_SIZES.sm * 1.6 }}>
              Everything runs on your phone. No tracking, no cameras, no cloud required.
            </Text>
          </Animated.View>
        )}

        {/* Welcome Section */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          style={{ marginBottom: SPACING.xxl }}
        >
          <Text 
            style={{ 
              fontSize: FONT_SIZES.title, 
              fontWeight: '700', 
              color: COLORS.text_primary, 
              marginBottom: SPACING.sm,
              lineHeight: FONT_SIZES.title * 1.3,
            }}
          >
            Where did you leave it?
          </Text>
          <Text 
            style={{ 
              fontSize: FONT_SIZES.body, 
              color: COLORS.text_secondary, 
              lineHeight: FONT_SIZES.body * 1.5,
            }}
          >
            Works best after normal use.
          </Text>
        </Animated.View>

        {/* Battery Status */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(150)}
          style={{
            padding: SPACING.lg,
            backgroundColor: COLORS.bg_secondary,
            borderRadius: 12,
            marginBottom: SPACING.xl,
          }}
        >
          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text_primary, marginBottom: SPACING.md }}>
            Battery
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
            <View
              style={{
                flex: 1,
                height: 6,
                backgroundColor: COLORS.divider,
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${level}%`,
                  height: '100%',
                  backgroundColor: isLowPower ? COLORS.error : COLORS.success,
                }}
              />
            </View>
            <Text style={{ fontSize: FONT_SIZES.body, color: COLORS.text_secondary, minWidth: 40 }}>
              {Math.round(level)}%
            </Text>
          </View>
          {isLowPower && (
            <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.error, marginTop: SPACING.sm }}>
              Low power mode active
            </Text>
          )}
        </Animated.View>

        {/* Primary CTA */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          style={{ marginBottom: SPACING.xl }}
        >
          <TouchableOpacity
            style={{
              paddingVertical: SPACING.md,
              paddingHorizontal: SPACING.lg,
              backgroundColor: COLORS.text_primary,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: FONT_SIZES.body, fontWeight: '700', color: COLORS.bg }}>
              I lost something
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer message */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(250)}
          style={{
            paddingTop: SPACING.lg,
            borderTopWidth: 1,
            borderTopColor: COLORS.divider,
          }}
        >
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.text_tertiary, lineHeight: FONT_SIZES.xs * 1.6 }}>
            Enable motion access for optimal accuracy in finding lost items.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
