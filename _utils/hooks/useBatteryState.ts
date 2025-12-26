/**
 * Battery State Hook.
 * 
 * Tracks device battery level and adapts app behavior to preserve power.
 * Feeds into motion sensing, background processing, and UI updates.
 * 
 * Non-goals:
 * - Exact prediction (estimation only)
 * - Battery optimization algorithms (OS-level)
 */

import { useCallback, useEffect } from 'react';
import { useTraceStore } from '../state/traceStore';

/**
 * Hook to monitor device battery level.
 * 
 * Subscribes to battery change events and updates store.
 * Also determines power-saving mode thresholds.
 * 
 * Assumptions:
 * - Battery API available on iOS/Android via native module.
 * - Updates fire every 1% change or every 30s.
 * 
 * Returns:
 * - Object with battery level and power-saving status.
 */
export function useBatteryState() {
  const { batteryLevel, updateBatteryLevel } = useTraceStore();

  // Determine if device is in low-power mode.
  const isLowPower = batteryLevel < 20;
  const isCritical = batteryLevel < 5;

  // Initialize battery monitoring on mount.
  useEffect(() => {
    // Mock implementation: simulate battery drain for testing.
    // In production, this calls native BatteryManager API.
    const mockBatteryInterval = setInterval(() => {
      // Simulate slow drain when not charging.
      updateBatteryLevel(batteryLevel - 0.1);
    }, 10000); // every 10s, ~1% per minute

    return () => clearInterval(mockBatteryInterval);
  }, [batteryLevel, updateBatteryLevel]);

  // Callback to manually set battery level (from native module).
  const setBatteryLevel = useCallback(
    (level: number) => {
      updateBatteryLevel(level);
    },
    [updateBatteryLevel],
  );

  return {
    level: batteryLevel,
    isLowPower,
    isCritical,
    setBatteryLevel,
  };
}
