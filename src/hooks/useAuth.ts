import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getProfile, sendPhoneOtp, signOut, verifyPhoneOtp } from '../services';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [hasProfile, setHasProfile] = useState(false);
  const sessionExpiryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;

    const clearSessionExpiryTimeout = () => {
      if (sessionExpiryTimeoutRef.current) {
        clearTimeout(sessionExpiryTimeoutRef.current);
        sessionExpiryTimeoutRef.current = null;
      }
    };

    const resetSession = () => {
      clearSessionExpiryTimeout();
      setSession(null);
      setHasProfile(false);
      setStatus('unauthenticated');
    };

    const scheduleSessionExpiry = (nextSession: Session) => {
      clearSessionExpiryTimeout();

      if (!nextSession.expires_at) {
        return;
      }

      const expiresInMs = nextSession.expires_at * 1000 - Date.now();

      if (expiresInMs <= 0) {
        supabase.auth.signOut();
        resetSession();
        return;
      }

      sessionExpiryTimeoutRef.current = setTimeout(() => {
        supabase.auth.getSession().then(({ data }) => {
          if (!data.session || data.session.expires_at === nextSession.expires_at) {
            supabase.auth.signOut();
            resetSession();
          }
        });
      }, expiresInMs);
    };

    const applySession = async (nextSession: Session | null) => {
      if (!mounted) {
        return;
      }

      if (!nextSession) {
        resetSession();
        return;
      }

      if (nextSession.expires_at && nextSession.expires_at * 1000 <= Date.now()) {
        await supabase.auth.signOut();
        resetSession();
        return;
      }

      setSession(nextSession);
      scheduleSessionExpiry(nextSession);

      let profile = null;

      try {
        profile = await getProfile(nextSession.user.id);
      } catch {
        profile = null;
      }

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
        resetSession();
        return;
      }

      applySession(nextSession);
    });

    return () => {
      mounted = false;
      clearSessionExpiryTimeout();
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
