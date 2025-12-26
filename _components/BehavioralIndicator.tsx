/**
 * BehavioralIndicator Component.
 * 
 * Visualizes behavioral scores (CSI, BLS, ADS) from CEBE-X.
 * Animates as three stacked bars, similar to the speaking indicator pattern.
 * 
 * Non-goals:
 * - Detailed tooltips (scores only)
 * - Interactive editing (display only)
 */

import { motion } from 'framer-motion';
import React from 'react';
import type { BehavioralScores } from '../_utils/types/domain';

interface BehavioralIndicatorProps {
  /** Behavioral scores from CEBE-X. */
  scores: BehavioralScores;
  /** Layout direction. */
  layout?: 'horizontal' | 'vertical';
  /** Optional CSS class. */
  className?: string;
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
 * - React component with animated bars.
 */
export const BehavioralIndicator: React.FC<BehavioralIndicatorProps> = ({
  scores,
  layout = 'horizontal',
  className = '',
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

  const barContainerClass = layout === 'horizontal'
    ? 'flex gap-2'
    : 'flex flex-col gap-2';

  const barClass = layout === 'horizontal'
    ? 'flex-1 h-2 rounded-full bg-gray-200 overflow-hidden'
    : 'w-2 h-12 rounded-full bg-gray-200 overflow-hidden';

  return (
    <div className={`flex flex-col gap-1 ${className}`} role="region" aria-label="Behavioral indicators">
      {/* Label row */}
      <div className="flex gap-2 text-xs font-medium text-gray-600">
        <span>Stability</span>
        <span>Boundary</span>
        <span>Disruption</span>
      </div>

      {/* Bars container */}
      <div className={barContainerClass}>
        {/* CSI (Stability) */}
        <motion.div
          className={barClass}
          animate={{ backgroundColor: `rgba(46, 125, 50, ${scores.csi})` }}
          transition={{ type: 'spring', stiffness: 60, damping: 10 }}
          style={{ opacity: 0.6 + scores.csi * 0.4 }}
          role="status"
          aria-label={`Cognitive Stability: ${Math.round(scores.csi * 100)}%`}
        />

        {/* BLS (Boundary) */}
        <motion.div
          className={barClass}
          animate={{ backgroundColor: `rgba(161, 92, 0, ${scores.bls})` }}
          transition={{ type: 'spring', stiffness: 60, damping: 10 }}
          style={{ opacity: 0.6 + scores.bls * 0.4 }}
          role="status"
          aria-label={`Boundary Likelihood: ${Math.round(scores.bls * 100)}%`}
        />

        {/* ADS (Disruption) */}
        <motion.div
          className={barClass}
          animate={{ backgroundColor: `rgba(179, 38, 30, ${scores.ads})` }}
          transition={{ type: 'spring', stiffness: 60, damping: 10 }}
          style={{ opacity: 0.6 + scores.ads * 0.4 }}
          role="status"
          aria-label={`Attentional Disruption: ${Math.round(scores.ads * 100)}%`}
        />
      </div>

      {/* Value row */}
      <div className="flex gap-2 text-xs text-gray-500">
        <span>{Math.round(scores.csi * 100)}%</span>
        <span>{Math.round(scores.bls * 100)}%</span>
        <span>{Math.round(scores.ads * 100)}%</span>
      </div>
    </div>
  );
};

export default BehavioralIndicator;
