import React, { useState } from 'react';

import { useAppSelector } from '../store';
import { AuthWelcomeScreen } from './auth/AuthWelcomeScreen';
import { LoginScreen } from './auth/LoginScreen';
import { SignupScreen } from './auth/SignupScreen';
import { TwoFactorScreen } from './auth/TwoFactorScreen';

type AuthRoute = 'welcome' | 'login' | 'signup';

export function AuthScreen() {
  const [route, setRoute] = useState<AuthRoute>('welcome');
  const twoFactorLoginRequired = useAppSelector(
    state => state.auth.twoFactorLoginRequired,
  );

  if (twoFactorLoginRequired) {
    return <TwoFactorScreen />;
  }

  if (route === 'welcome') {
    return (
      <AuthWelcomeScreen
        onCreateAccount={() => setRoute('signup')}
        onStart={() => setRoute('login')}
      />
    );
  }

  if (route === 'signup') {
    return <SignupScreen onGoToLogin={() => setRoute('login')} />;
  }

  return <LoginScreen onCreateAccount={() => setRoute('signup')} />;
}
