import { useCallback, useEffect, useMemo, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { sendPhoneOtp, signOut, verifyPhoneOtp } from '../services';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

function isFirstLogin(user: User) {
  if (!user.last_sign_in_at) {
    return true;
  }

  return Math.abs(new Date(user.created_at).getTime() - new Date(user.last_sign_in_at).getTime()) < 5000;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [isFirstSession, setIsFirstSession] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      setSession(data.session);
      setIsFirstSession(data.session ? isFirstLogin(data.session.user) : false);
      setStatus(data.session ? 'authenticated' : 'unauthenticated');
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setIsFirstSession(nextSession ? event === 'SIGNED_IN' && isFirstLogin(nextSession.user) : false);
      setStatus(nextSession ? 'authenticated' : 'unauthenticated');
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const sendOtp = useCallback((phone: string) => sendPhoneOtp(phone), []);
  const verifyOtp = useCallback((phone: string, token: string) => verifyPhoneOtp(phone, token), []);
  const logout = useCallback(() => signOut(), []);
  const completeFirstSession = useCallback(() => setIsFirstSession(false), []);

  return useMemo(
    () => ({
      completeFirstSession,
      isFirstSession,
      logout,
      sendOtp,
      session,
      status,
      verifyOtp,
    }),
    [completeFirstSession, isFirstSession, logout, sendOtp, session, status, verifyOtp],
  );
}
