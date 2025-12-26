/**
 * HomeScreen - Initial interface for Trace app.
 * 
 * Displays app status, search interface, and recent activity.
 * Uses Trace design system: minimal, functional, offline-first messaging.
 * 
 * Non-goals:
 * - Feeds or dashboards
 * - Personality-driven branding (clarity over cleverness)
 * - Camera or microphone indicators
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useTraceStore } from '../../_utils/state/traceStore';
import { useBatteryState } from '../../_utils/hooks/useBatteryState';

interface HomeScreenProps {
  onNavigateToSearch: () => void;
}

/**
 * Status pill showing "On device" with tap-to-learn behavior.
 * 
 * Replaces the green dot privacy indicator with textual transparency.
 * Tap explains what the app does and doesn't do.
 */
const StatusPill: React.FC<{ onPress?: () => void }> = ({ onPress }) => {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <View>
      {/* Status Pill */}
      <TouchableOpacity
        onPress={() => {
          setShowExplanation(!showExplanation);
          onPress?.();
        }}
        style={{
          alignSelf: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: '#F7F7F7',
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 13, color: '#6B6B6B', fontWeight: '500' }}>
          On device
        </Text>
      </TouchableOpacity>

      {/* Explanation (appears on tap) */}
      {showExplanation && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          exiting={FadeOutUp.duration(200)}
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            padding: 12,
            backgroundColor: '#F7F7F7',
            borderRadius: 8,
            borderLeftWidth: 3,
            borderLeftColor: '#2E7D32',
          }}
        >
          <Text style={{ fontSize: 13, color: '#111111', lineHeight: 18 }}>
            Everything runs on your phone. No tracking, no cameras, no cloud required.
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

/**
 * Welcome message using clear, functional language.
 * 
 * Guides user to primary action without being prescriptive.
 */
const WelcomeSection: React.FC = () => {
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 18,
          color: '#111111',
          fontWeight: '500',
          marginBottom: 8,
          fontFamily: 'InterMedium',
        }}
      >
        Where did you leave it?
      </Text>
      <Text style={{ fontSize: 15, color: '#6B6B6B', lineHeight: 20 }}>
        Trace uses your motion to figure out where you likely placed an object during a pause or
        interruption.
      </Text>
    </View>
  );
};

/**
 * Battery indicator with power-saving guidance.
 * 
 * Shows current level and low-power mode warnings.
 */
const BatteryIndicator: React.FC<{ level: number; isLowPower: boolean }> = ({
  level,
  isLowPower,
}) => {
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: isLowPower ? '#FFF3E0' : '#F7F7F7',
        borderLeftWidth: isLowPower ? 3 : 0,
        borderLeftColor: isLowPower ? '#A15C00' : 'transparent',
      }}
    >
      <Text style={{ fontSize: 13, color: '#6B6B6B', fontWeight: '500' }}>
        Battery: {Math.round(level)}%
      </Text>
      {isLowPower && (
        <Text style={{ fontSize: 12, color: '#A15C00', marginTop: 4 }}>
          Low power mode active. Sensing paused.
        </Text>
      )}
    </View>
  );
};

/**
 * Search button - primary action to initiate a query.
 * 
 * Uses scale animation on press for tactile feedback.
 */
const SearchButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{
        marginHorizontal: 16,
        marginBottom: 24,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#111111',
        alignItems: 'center',
        opacity: pressed ? 0.8 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      }}
    >
      <Text style={{ fontSize: 15, color: '#FFFFFF', fontWeight: '500' }}>
        Search for Item
      </Text>
    </TouchableOpacity>
  );
};

/**
 * Recent objects section - shows last few queries or object priors.
 * 
 * Lists objects the user commonly loses, ready for quick search.
 */
const RecentObjectsSection: React.FC<{ objects: string[] }> = ({ objects }) => {
  if (objects.length === 0) {
    return null;
  }

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 13,
          color: '#9A9A9A',
          fontWeight: '500',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        Common
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {objects.map((obj, idx) => (
          <Animated.View
            key={idx}
            entering={FadeInDown.delay(idx * 50).duration(200)}
          >
            <TouchableOpacity
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: '#F7F7F7',
                borderWidth: 1,
                borderColor: '#E6E6E6',
              }}
            >
              <Text style={{ fontSize: 13, color: '#111111' }}>{obj}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

/**
 * HomeScreen Component.
 * 
 * Responsibilities:
 * - Display app status ("On device")
 * - Show battery level and low-power warnings
 * - Provide search entry point
 * - Display recent/common objects
 * - Explain the app on first visit (via status pill tap)
 * 
 * Assumptions:
 * - User has granted (or denied) motion permissions
 * - Battery API available from native module
 * - Navigation callbacks provided by parent
 * 
 * Returns:
 * - Full-screen home interface with minimal, functional design
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToSearch }) => {
  const { user, motionActive } = useTraceStore();
  const { level: batteryLevel, isLowPower } = useBatteryState();

  // Extract common objects from user priors or defaults.
  const commonObjects = user?.objectPriors
    ? Object.keys(user.objectPriors).slice(0, 3)
    : ['Keys', 'Wallet', 'Phone'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status indicator - always visible, tappable for explanation */}
        <StatusPill />

        {/* Welcome message - clear, not prescriptive */}
        <WelcomeSection />

        {/* Battery status - warn if low power */}
        <BatteryIndicator level={batteryLevel} isLowPower={isLowPower} />

        {/* Motion sensing status indicator */}
        {motionActive && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: '#E8F5E9',
              borderLeftWidth: 3,
              borderLeftColor: '#2E7D32',
            }}
          >
            <Text style={{ fontSize: 13, color: '#2E7D32', fontWeight: '500' }}>
              Sensing active – Move your phone to record motion.
            </Text>
          </Animated.View>
        )}

        {/* Primary action - search for an item */}
        <SearchButton onPress={onNavigateToSearch} />

        {/* Quick access to common objects */}
        <RecentObjectsSection objects={commonObjects} />

        {/* Footer with permission status */}
        <View
          style={{
            marginHorizontal: 16,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: '#F7F7F7',
          }}
        >
          <Text style={{ fontSize: 12, color: '#9A9A9A', lineHeight: 16 }}>
            Motion & Fitness permission required for optimal accuracy. Other permissions are
            never requested or used.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
