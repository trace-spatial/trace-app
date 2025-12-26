/**
 * useOnboarding Hook - Manage onboarding flow state.
 * 
 * Tracks:
 * - Onboarding completion
 * - Permission requests (sequential, not batched)
 * - User preferences
 * 
 * Returns:
 * - showOnboarding: Whether to show onboarding screens
 * - currentStep: Current onboarding step (0-3)
 * - completeOnboarding: Mark onboarding as done
 * - requestMotionPermission: Ask for motion & fitness
 * - requestBackgroundPermission: Ask for background processing
 */

import { useState } from 'react';
import { useTraceStore } from '../state/traceStore';

interface OnboardingState {
  showOnboarding: boolean;
  currentStep: number; // 0: splash, 1: why, 2: what, 3: permissions
  motionAsked: boolean;
  backgroundAsked: boolean;
}

export const useOnboarding = () => {
  const store = useTraceStore();
  const [state, setState] = useState<OnboardingState>({
    showOnboarding: !store.user, // Show if no user initialized
    currentStep: 0,
    motionAsked: false,
    backgroundAsked: store.permissionsGranted.motionFitness, // Skip bg if motion not granted
  });

  const completeOnboarding = () => {
    setState((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
  };

  const requestMotionPermission = (granted: boolean) => {
    store.setPermission('motionFitness', granted);
    setState((prev) => ({ ...prev, motionAsked: true }));
    // Move to background permission step
    setState((prev) => ({ ...prev, currentStep: 3 }));
  };

  const requestBackgroundPermission = (granted: boolean) => {
    store.setPermission('backgroundProcessing', granted);
    setState((prev) => ({ ...prev, backgroundAsked: true }));
    // Finish onboarding
    setState((prev) => ({ ...prev, showOnboarding: false }));
  };

  const skipOnboarding = () => {
    setState((prev) => ({ ...prev, showOnboarding: false }));
  };

  return {
    ...state,
    completeOnboarding,
    requestMotionPermission,
    requestBackgroundPermission,
    skipOnboarding,
  };
};
