/**
 * BehavioralIndicator Component.
 * 
 * Visualizes behavioral scores (CSI, BLS, ADS) from CEBE-X.
 * Displays as three animated bars using react-native-reanimated.
 * 
 * Non-goals:
 * - Detailed tooltips (scores only)
 * - Interactive editing (display only)
 */

import React from 'react';
import { View, Text } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import type { BehavioralScores } from '../_utils/types/domain';

interface BehavioralIndicatorProps {
  /** Behavioral scores from CEBE-X. */
  scores: BehavioralScores;
  /** Optional layout direction (for future extensibility). */
  layout?: 'horizontal' | 'vertical';
}

/**
 * Display behavioral scores as animated bars.
 * 
 * Maps CEBE-X outputs to visual feedback.
 * Uses spring animation to reflect real-time updates.
 * 
 * Assumptions:
 * - Scores are valid 0-1 numbers.
 * - Layout is responsive.
 * 
 * Returns:
 * - React Native component with animated bars.
 */
export const BehavioralIndicator: React.FC<BehavioralIndicatorProps> = ({
  scores,
  layout = 'horizontal',
}) => {
  // Trace design system: use confidence_indicators colors.
  const colorMap = {
    csi: '#2E7D32', // high (stable cognition = good)
    bls: '#A15C00', // warning (boundary detection = caution)
    ads: '#B3261E', // error (disruption = concern)
  };

  const scoreLabels = {
    csi: 'Stability',
    bls: 'Boundary',
    ads: 'Disruption',
  };

  // Animated styles for bars
  const csiStyle = useAnimatedStyle(() => ({
    backgroundColor: colorMap.csi,
    opacity: 0.6 + scores.csi * 0.4,
  }));

  const blsStyle = useAnimatedStyle(() => ({
    backgroundColor: colorMap.bls,
    opacity: 0.6 + scores.bls * 0.4,
  }));

  const adsStyle = useAnimatedStyle(() => ({
    backgroundColor: colorMap.ads,
    opacity: 0.6 + scores.ads * 0.4,
  }));

  return (
    <View style={{ flexDirection: 'column', gap: 4 }}>
      {/* Label row */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B6B6B' }}>
          {scoreLabels.csi}
        </Text>
        <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B6B6B' }}>
          {scoreLabels.bls}
        </Text>
        <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B6B6B' }}>
          {scoreLabels.ads}
        </Text>
      </View>

      {/* Bars container */}
      <View style={{ flexDirection: 'row', gap: 8, height: 12 }}>
        {/* CSI (Stability) */}
        <Animated.View
          style={[
            {
              flex: 1,
              borderRadius: 6,
              height: 12,
            },
            csiStyle,
          ]}
        />

        {/* BLS (Boundary) */}
        <Animated.View
          style={[
            {
              flex: 1,
              borderRadius: 6,
              height: 12,
            },
            blsStyle,
          ]}
        />

        {/* ADS (Disruption) */}
        <Animated.View
          style={[
            {
              flex: 1,
              borderRadius: 6,
              height: 12,
            },
            adsStyle,
          ]}
        />
      </View>

      {/* Value row */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Text style={{ fontSize: 11, color: '#9A9A9A' }}>
          {Math.round(scores.csi * 100)}%
        </Text>
        <Text style={{ fontSize: 11, color: '#9A9A9A' }}>
          {Math.round(scores.bls * 100)}%
        </Text>
        <Text style={{ fontSize: 11, color: '#9A9A9A' }}>
          {Math.round(scores.ads * 100)}%
        </Text>
      </View>
    </View>
  );
};

export default BehavioralIndicator;
