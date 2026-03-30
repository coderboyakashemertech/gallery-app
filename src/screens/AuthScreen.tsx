import React, { useState } from 'react';

import { useAppSelector } from '../store';
import { AuthSettingsScreen } from './auth/AuthSettingsScreen';
import { AuthWelcomeScreen } from './auth/AuthWelcomeScreen';
import { LoginScreen } from './auth/LoginScreen';
import { SignupScreen } from './auth/SignupScreen';
import { TwoFactorScreen } from './auth/TwoFactorScreen';

type AuthRoute = 'welcome' | 'login' | 'signup' | 'settings';
type AuthContentRoute = Exclude<AuthRoute, 'settings'>;

export function AuthScreen() {
  const [route, setRoute] = useState<AuthRoute>('welcome');
  const [settingsReturnRoute, setSettingsReturnRoute] =
    useState<AuthContentRoute>('welcome');
  const twoFactorLoginRequired = useAppSelector(
    state => state.auth.twoFactorLoginRequired,
  );

  const openSettings = (returnRoute: AuthContentRoute) => {
    setSettingsReturnRoute(returnRoute);
    setRoute('settings');
  };

  if (route === 'settings') {
    return <AuthSettingsScreen onBack={() => setRoute(settingsReturnRoute)} />;
  }

  if (twoFactorLoginRequired) {
    return <TwoFactorScreen onOpenSettings={() => openSettings('login')} />;
  }

  if (route === 'welcome') {
    return (
      <AuthWelcomeScreen
        onCreateAccount={() => setRoute('signup')}
        onOpenSettings={() => openSettings('welcome')}
        onStart={() => setRoute('login')}
      />
    );
  }

  if (route === 'signup') {
    return (
      <SignupScreen
        onGoToLogin={() => setRoute('login')}
        onOpenSettings={() => openSettings('signup')}
      />
    );
  }

  return (
    <LoginScreen
      onCreateAccount={() => setRoute('signup')}
      onOpenSettings={() => openSettings('login')}
    />
  );
}
