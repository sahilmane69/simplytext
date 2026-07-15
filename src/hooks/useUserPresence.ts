import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  isActiveAppState,
  removePresenceChannel,
  subscribeToOnlineUsers,
  trackOnlineUser,
  untrackOnlineUser,
} from '../services';

export function useUserPresence(userId: string | null | undefined) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    const channel = subscribeToOnlineUsers(
      () => undefined,
      () => {
        if (isActiveAppState(AppState.currentState)) {
          trackOnlineUser(channel, userId);
        }
      },
    );
    channelRef.current = channel;

    const subscription = AppState.addEventListener('change', (state) => {
      if (isActiveAppState(state)) {
        trackOnlineUser(channel, userId);
        return;
      }

      untrackOnlineUser(channel, userId).catch(() => undefined);
    });

    return () => {
      subscription.remove();
      untrackOnlineUser(channelRef.current, userId).catch(() => undefined);
      removePresenceChannel(channelRef.current);
      channelRef.current = null;
    };
  }, [userId]);
}
