/**
 * TermsDialog - Beautiful Terms & Conditions screen.
 *
 * Design: Modern, clean dialog with scrollable content.
 * Requires user to scroll to bottom before accepting.
 * Only shown on first app launch.
 * 
 * After agreement, smooth slide transition to home screen.
 */

import React, { useRef, useState } from 'react';
import {
    Dimensions,
    NativeScrollEvent,
    NativeSyntheticEvent,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    SlideInUp,
} from 'react-native-reanimated';

const { height } = Dimensions.get('window');

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
  error: '#B3261E',
  overlay: 'rgba(0,0,0,0.5)',
};

const FONT_SIZES = {
  xs: 11,
  sm: 13,
  body: 15,
  heading: 18,
  title: 28,
};

interface TermsDialogProps {
  onAgree: () => void;
}

/**
 * Terms & Conditions content.
 */const TERMS_CONTENT = `Trace Terms of Service & Privacy

1. Acceptance of Terms

By accessing and using Trace, you agree to comply with and be bound by these Terms of Service. If you do not agree with these terms, please discontinue use immediately.

2. What Trace Does

Trace helps you find items you've lost using on-device motion sensing and spatial analysis. The app detects interruption moments and guides you back to where you lost focus.

Everything runs on your phone. We do not:
• Track your location
• Access your camera or microphone
• Store data in the cloud
• Monitor your behavior
• Share your data with anyone

3. Motion & Activity Data

Trace uses motion sensors (accelerometer, gyroscope) to understand your movement patterns and detect pauses. This data stays on your device and is never transmitted.

4. Data You Control

All spatial maps, zones, and movement data are stored locally on your phone. You can delete this data at any time through app settings.

5. No Warranties

Trace is provided "as is" without any warranties. We cannot guarantee 100% accuracy in finding lost items, as this depends on your movement patterns and memory.

6. Limitation of Liability

We are not responsible for:
• Items that are not recovered
• Damages to your device
• Misuse of the app
• Errors in the algorithm

7. Your Responsibilities

You agree to:
• Use Trace legally and ethically
• Not attempt to reverse-engineer or modify the app
• Not use Trace to track other people
• Not distribute the app or its content

8. Modifications

We reserve the right to modify these terms at any time. Continued use of Trace after changes constitutes acceptance of new terms.

9. Termination

We may terminate your access to Trace without notice if you violate these terms.

10. Governing Law

These terms are governed by applicable laws where Trace is developed and operated.

11. Contact

For questions about these terms, contact us through the app settings.

By tapping "I Agree," you accept all terms and conditions.`;

/**
 * Terms & Conditions dialog with scroll-to-read requirement.
 */
export const TermsDialog: React.FC<TermsDialogProps> = ({ onAgree }) => {
  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const contentRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollPercentage =
      contentOffset.y / (contentSize.height - layoutMeasurement.height);
    
    if (scrollPercentage >= 0.95 && !hasReadToBottom) {
      setHasReadToBottom(true);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.overlay }}>
      <Animated.View
        entering={FadeIn.duration(300)}
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: COLORS.overlay,
        }}
      >
        {/* Dialog container */}
        <Animated.View
          entering={SlideInUp.duration(400).springify()}
          style={{
            backgroundColor: COLORS.bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: height * 0.9,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <View
            style={{
              paddingHorizontal: SPACING.lg,
              paddingVertical: SPACING.lg,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.divider,
              backgroundColor: COLORS.bg,
            }}
          >
            <Text
              style={{
                fontSize: FONT_SIZES.heading,
                fontWeight: '700',
                color: COLORS.text_primary,
              }}
            >
              Terms & Conditions
            </Text>
            <Text
              style={{
                fontSize: FONT_SIZES.sm,
                color: COLORS.text_tertiary,
                marginTop: SPACING.xs,
              }}
            >
              Please read before using Trace
            </Text>
          </View>

          {/* Scrollable content */}
          <ScrollView
            ref={contentRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingHorizontal: SPACING.lg,
              paddingVertical: SPACING.lg,
            }}
          >
            <Text
              style={{
                fontSize: FONT_SIZES.body,
                color: COLORS.text_primary,
                lineHeight: FONT_SIZES.body * 1.6,
              }}
            >
              {TERMS_CONTENT}
            </Text>
          </ScrollView>

          {/* Footer */}
          <View
            style={{
              paddingHorizontal: SPACING.lg,
              paddingVertical: SPACING.lg,
              borderTopWidth: 1,
              borderTopColor: COLORS.divider,
              backgroundColor: COLORS.bg,
              gap: SPACING.md,
            }}
          >
            {!hasReadToBottom && (
              <Text
                style={{
                  fontSize: FONT_SIZES.xs,
                  color: COLORS.text_tertiary,
                  textAlign: 'center',
                }}
              >
                Scroll to the bottom to agree
              </Text>
            )}

            <TouchableOpacity
              onPress={onAgree}
              disabled={!hasReadToBottom}
              style={{
                paddingVertical: SPACING.md,
                paddingHorizontal: SPACING.lg,
                backgroundColor: hasReadToBottom ? COLORS.text_primary : COLORS.bg_secondary,
                borderRadius: 12,
                alignItems: 'center',
                opacity: hasReadToBottom ? 1 : 0.5,
              }}
            >
              <Text
                style={{
                  fontSize: FONT_SIZES.body,
                  fontWeight: '700',
                  color: hasReadToBottom ? COLORS.bg : COLORS.text_secondary,
                }}
              >
                I Agree
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default TermsDialog;
