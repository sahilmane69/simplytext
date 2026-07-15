import { RealtimeChannel } from '@supabase/supabase-js';
import { AppStateStatus } from 'react-native';
import { supabase } from '../lib/supabase';
import { updateLastSeen } from './profiles';

export type OnlinePresence = {
  online_at: string;
  user_id: string;
};

type OnlineStatusHandler = (onlineUserIds: Set<string>) => void;
type SubscribeHandler = () => void;

const ONLINE_USERS_CHANNEL = 'online-users';

export function subscribeToOnlineUsers(onStatusChange: OnlineStatusHandler, onSubscribed?: SubscribeHandler) {
  const channel = supabase.channel(ONLINE_USERS_CHANNEL);

  const emitPresenceState = () => {
    const state = channel.presenceState<OnlinePresence>();
    const onlineUserIds = new Set<string>();

    Object.values(state).forEach((presences) => {
      presences.forEach((presence) => {
        if (presence.user_id) {
          onlineUserIds.add(presence.user_id);
        }
      });
    });

    onStatusChange(onlineUserIds);
  };

  channel
    .on('presence', { event: 'sync' }, emitPresenceState)
    .on('presence', { event: 'join' }, emitPresenceState)
    .on('presence', { event: 'leave' }, emitPresenceState)
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        onSubscribed?.();
      }
    });

  return channel;
}

export function trackOnlineUser(channel: RealtimeChannel | null, userId: string) {
  channel?.track({
    online_at: new Date().toISOString(),
    user_id: userId,
  });
}

export async function untrackOnlineUser(channel: RealtimeChannel | null, userId: string) {
  await channel?.untrack();
  await updateLastSeen(userId);
}

export function isActiveAppState(state: AppStateStatus) {
  return state === 'active';
}

export function removePresenceChannel(channel: RealtimeChannel | null) {
  if (channel) {
    supabase.removeChannel(channel);
  }
}
