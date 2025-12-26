/**
 * useOnboarding Hook - Manage Terms & Conditions acceptance.
 * 
 * Tracks:
 * - First time user (show T&C)
 * - T&C agreement status
 */

import { useState } from 'react';
import { useTraceStore } from '../state/traceStore';

interface OnboardingState {
  showTerms: boolean;
  termsAccepted: boolean;
}

export const useOnboarding = () => {
  const store = useTraceStore();
  const [state, setState] = useState<OnboardingState>({
    showTerms: !store.user,
    termsAccepted: !!store.user,
  });

  const agreeToTerms = () => {
    setState((prev) => ({ ...prev, showTerms: false, termsAccepted: true }));
  };

  return {
    ...state,
    agreeToTerms,
  };
};
