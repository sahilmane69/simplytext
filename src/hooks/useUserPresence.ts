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

export function useUserPresence(userId: string | null | undefined, enabled = true) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    const channel = enabled
      ? subscribeToOnlineUsers(
          () => undefined,
          () => {
            if (isActiveAppState(AppState.currentState)) {
              trackOnlineUser(channelRef.current, userId);
            }
          },
        )
      : null;
    channelRef.current = channel;

    const subscription = AppState.addEventListener('change', (state) => {
      if (isActiveAppState(state)) {
        if (enabled) {
          trackOnlineUser(channelRef.current, userId);
        }
        return;
      }

      untrackOnlineUser(channelRef.current, userId).catch(() => undefined);
    });

    return () => {
      subscription.remove();
      untrackOnlineUser(channelRef.current, userId).catch(() => undefined);
      removePresenceChannel(channelRef.current);
      channelRef.current = null;
    };
  }, [enabled, userId]);
}
