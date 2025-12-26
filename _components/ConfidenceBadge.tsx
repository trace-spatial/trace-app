/**
 * ConfidenceBadge Component.
 * 
 * Visual indicator of system confidence in a result.
 * Uses the Trace design system: minimal, state-driven color.
 * 
 * Non-goals:
 * - Animation (static by design)
 * - Custom styling (design system only)
 */

import React from 'react';

interface ConfidenceBadgeProps {
  /** Confidence level 0-1. */
  confidence: number;
  /** Optional label override. */
  label?: string;
  /** Optional additional CSS class. */
  className?: string;
}

/**
 * Display confidence as a rounded pill badge.
 * 
 * Maps numeric confidence to visual state and text.
 * Uses Trace color palette: green for high, gray for low.
 * 
 * Assumptions:
 * - Confidence is valid 0-1 number.
 * - Inter font is available globally.
 * 
 * Returns:
 * - React component rendering badge.
 */
export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  label,
  className = '',
}) => {
  // Map confidence to level and styling.
  const getLevel = (): 'low' | 'medium' | 'high' => {
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.4) return 'medium';
    return 'low';
  };

  const level = getLevel();

  // Trace design system colors for confidence states.
  const colorMap: Record<'low' | 'medium' | 'high', string> = {
    low: '#9A9A9A',       // text_tertiary
    medium: '#6B6B6B',    // text_secondary
    high: '#2E7D32',      // success (green)
  };

  const textMap: Record<'low' | 'medium' | 'high', string> = {
    low: `${Math.round(confidence * 100)}% – Low`,
    medium: `${Math.round(confidence * 100)}% – Fair`,
    high: `${Math.round(confidence * 100)}% – High`,
  };

  const displayText = label || textMap[level];
  const color = colorMap[level];

  return (
    <div
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium ${className}`}
      style={{
        backgroundColor: '#F7F7F7', // background_secondary
        color,
      }}
      role="status"
      aria-label={`Confidence: ${displayText}`}
    >
      {displayText}
    </div>
  );
};

export default ConfidenceBadge;
