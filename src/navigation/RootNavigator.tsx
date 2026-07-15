import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  ChatScreen,
  GroupSetupScreen,
  HomeScreen,
  LoginScreen,
  ProfileSetupScreen,
  SplashScreen,
  TermsScreen,
} from '../screens';
import { colors } from '../constants';
import { useAuth } from '../hooks';
import { AppRouteName } from '../types';
import { ChatTarget } from '../services';

const theme = {
  dark: true,
  colors: {
    primary: colors.accent,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700' as const,
    },
    heavy: {
      fontFamily: 'System',
      fontWeight: '800' as const,
    },
  },
};

export function RootNavigator() {
  const [routeName, setRouteName] = useState<AppRouteName>('Splash');
  const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null);
  const auth = useAuth();

  useEffect(() => {
    if (auth.status === 'loading') {
      setRouteName('Splash');
      return;
    }

    if (auth.status === 'authenticated') {
      if ((routeName === 'Chat' && chatTarget) || routeName === 'GroupSetup') {
        return;
      }

      setRouteName(auth.hasProfile ? 'Home' : 'ProfileSetup');
      return;
    }

    if (
      routeName === 'Home' ||
      routeName === 'ProfileSetup' ||
      routeName === 'GroupSetup' ||
      routeName === 'Chat'
    ) {
      setChatTarget(null);
      setRouteName('Login');
    }
  }, [auth.hasProfile, auth.status, chatTarget, routeName]);

  const completeLogin = () => {
    setRouteName(auth.hasProfile ? 'Home' : 'ProfileSetup');
  };

  return (
    <NavigationContainer theme={theme}>
      {routeName === 'Splash' && <SplashScreen onContinue={() => setRouteName('Terms')} />}
      {routeName === 'Terms' && <TermsScreen onAccept={() => setRouteName('Login')} />}
      {routeName === 'Login' && (
        <LoginScreen onContinue={completeLogin} sendOtp={auth.sendOtp} verifyOtp={auth.verifyOtp} />
      )}
      {routeName === 'ProfileSetup' && (
        <ProfileSetupScreen
          onComplete={async () => {
            await auth.refreshProfile();
            setRouteName('Home');
          }}
          phone={auth.session?.user.phone}
          userId={auth.session?.user.id}
        />
      )}
      {routeName === 'Home' && (
        <HomeScreen
          onCreateGroup={() => setRouteName('GroupSetup')}
          onOpenChat={(profile) => {
            setChatTarget({
              profile,
              type: 'direct',
            });
            setRouteName('Chat');
          }}
        />
      )}
      {routeName === 'GroupSetup' && auth.session?.user.id && (
        <GroupSetupScreen
          currentUserId={auth.session.user.id}
          onBack={() => setRouteName('Home')}
          onCreated={(target) => {
            setChatTarget(target);
            setRouteName('Chat');
          }}
        />
      )}
      {routeName === 'Chat' && auth.session?.user.id && chatTarget && (
        <ChatScreen
          currentUserId={auth.session.user.id}
          onBack={() => {
            setChatTarget(null);
            setRouteName('Home');
          }}
          target={chatTarget}
        />
      )}
    </NavigationContainer>
  );
}
