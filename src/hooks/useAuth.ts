import { useCallback, useEffect, useMemo, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getProfile, sendPhoneOtp, signOut, verifyPhoneOtp } from '../services';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    let mounted = true;

    const applySession = async (nextSession: Session | null) => {
      if (!mounted) {
        return;
      }

      setSession(nextSession);

      if (!nextSession) {
        setHasProfile(false);
        setStatus('unauthenticated');
        return;
      }

      const profile = await getProfile(nextSession.user.id);

      if (!mounted) {
        return;
      }

      setHasProfile(Boolean(profile));
      setStatus('authenticated');
    };

    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setHasProfile(false);
        setStatus('unauthenticated');
        return;
      }

      applySession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const sendOtp = useCallback((phone: string) => sendPhoneOtp(phone), []);
  const verifyOtp = useCallback((phone: string, token: string) => verifyPhoneOtp(phone, token), []);
  const logout = useCallback(() => signOut(), []);
  const refreshProfile = useCallback(async () => {
    if (!session) {
      setHasProfile(false);
      return;
    }

    const profile = await getProfile(session.user.id);
    setHasProfile(Boolean(profile));
  }, [session]);

  return useMemo(
    () => ({
      hasProfile,
      logout,
      refreshProfile,
      sendOtp,
      session,
      status,
      verifyOtp,
    }),
    [hasProfile, logout, refreshProfile, sendOtp, session, status, verifyOtp],
  );
}
