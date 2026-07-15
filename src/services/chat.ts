import { RealtimeChannel } from '@supabase/supabase-js';
import { ImagePickerAsset } from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { Profile } from './profiles';

const GROUP_PHOTOS_BUCKET = 'group-photos';

export type Conversation = {
  created_at: string;
  direct_key: string | null;
  photo_url: string | null;
  id: string;
  name: string | null;
  type: 'direct' | 'group';
  updated_at: string;
};

export type ChatMessage = {
  body: string;
  conversation_id: string;
  created_at: string;
  id: string;
  seen_at: string | null;
  sender_id: string;
};

export type TypingPayload = {
  isTyping: boolean;
  userId: string;
};

export type MessageRealtimeEvent =
  | {
      message: ChatMessage;
      type: 'INSERT' | 'UPDATE';
    }
  | {
      message: null;
      type: 'DELETE';
    };

type MessageHandler = (event: MessageRealtimeEvent) => void;
type ClearHandler = () => void;
type TypingHandler = (payload: TypingPayload) => void;

export type ChatTarget =
  | {
      profile: Profile;
      type: 'direct';
    }
  | {
      conversation: Conversation;
      memberCount: number;
      type: 'group';
    };

export async function getOrCreateDirectConversation(userId: string, otherUserId: string) {
  const directKey = getDirectKey(userId, otherUserId);
  const now = new Date().toISOString();

  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .upsert(
      {
        direct_key: directKey,
        type: 'direct',
        updated_at: now,
      },
      { onConflict: 'direct_key' },
    )
    .select('id,type,direct_key,name,photo_url,created_at,updated_at')
    .single<Conversation>();

  if (conversationError) {
    throw conversationError;
  }

  const { error: participantsError } = await supabase.from('conversation_participants').upsert(
    [
      {
        conversation_id: conversation.id,
        user_id: userId,
      },
      {
        conversation_id: conversation.id,
        user_id: otherUserId,
      },
    ],
    { onConflict: 'conversation_id,user_id' },
  );

  if (participantsError) {
    throw participantsError;
  }

  return conversation;
}

type CreateGroupConversationInput = {
  currentUserId: string;
  image: ImagePickerAsset | null;
  members: Profile[];
  name: string;
};

export async function createGroupConversation({
  currentUserId,
  image,
  members,
  name,
}: CreateGroupConversationInput) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error('Enter a group name');
  }

  if (members.length === 0) {
    throw new Error('Select at least one contact');
  }

  const photoUrl = image ? await uploadGroupPhoto(currentUserId, image) : null;
  const now = new Date().toISOString();

  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .insert({
      name: trimmedName,
      photo_url: photoUrl,
      type: 'group',
      updated_at: now,
    })
    .select('id,type,direct_key,name,photo_url,created_at,updated_at')
    .single<Conversation>();

  if (conversationError) {
    throw conversationError;
  }

  const participantIds = [...new Set([currentUserId, ...members.map((member) => member.id)])];
  const { error: participantsError } = await supabase.from('conversation_participants').insert(
    participantIds.map((userId) => ({
      conversation_id: conversation.id,
      user_id: userId,
    })),
  );

  if (participantsError) {
    throw participantsError;
  }

  return conversation;
}

export async function getConversationMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('id,conversation_id,sender_id,body,created_at,seen_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .returns<ChatMessage[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function sendTextMessage(conversationId: string, senderId: string, body: string) {
  const trimmedBody = body.trim();

  if (!trimmedBody) {
    return null;
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      body: trimmedBody,
      conversation_id: conversationId,
      sender_id: senderId,
    })
    .select('id,conversation_id,sender_id,body,created_at,seen_at')
    .single<ChatMessage>();

  if (error) {
    throw error;
  }

  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data;
}

export async function markConversationSeen(conversationId: string, userId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ seen_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .is('seen_at', null);

  if (error) {
    throw error;
  }
}

export async function deleteConversationMessages(conversationId: string) {
  const { error } = await supabase.from('messages').delete().eq('conversation_id', conversationId);

  if (error) {
    throw error;
  }
}

export function subscribeToMessages(conversationId: string, onMessage: MessageHandler) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        filter: `conversation_id=eq.${conversationId}`,
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          onMessage({ message: null, type: 'DELETE' });
          return;
        }

        onMessage({
          message: payload.new as ChatMessage,
          type: payload.eventType,
        });
      },
    )
    .subscribe();
}

export function subscribeToTyping(
  conversationId: string,
  currentUserId: string,
  onTyping: TypingHandler,
  onClear?: ClearHandler,
) {
  const channel = supabase.channel(`typing:${conversationId}`);

  channel
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
      const typingPayload = payload as TypingPayload;

      if (typingPayload.userId !== currentUserId) {
        onTyping(typingPayload);
      }
    })
    .on('broadcast', { event: 'messages_cleared' }, ({ payload }) => {
      const clearPayload = payload as { userId?: string };

      if (clearPayload.userId !== currentUserId) {
        onClear?.();
      }
    })
    .subscribe();

  return channel;
}

export function sendTyping(channel: RealtimeChannel | null, userId: string, isTyping: boolean) {
  channel?.send({
    event: 'typing',
    payload: {
      isTyping,
      userId,
    },
    type: 'broadcast',
  });
}

export function sendMessagesCleared(channel: RealtimeChannel | null, userId: string) {
  channel?.send({
    event: 'messages_cleared',
    payload: {
      userId,
    },
    type: 'broadcast',
  });
}

export function unsubscribe(channel: RealtimeChannel | null) {
  if (channel) {
    supabase.removeChannel(channel);
  }
}

function getDirectKey(userId: string, otherUserId: string) {
  return [userId, otherUserId].sort().join(':');
}

async function uploadGroupPhoto(userId: string, image: ImagePickerAsset) {
  const response = await fetch(image.uri);
  const arrayBuffer = await response.arrayBuffer();
  const contentType = image.mimeType ?? 'image/jpeg';
  const extension = getImageExtension(image.fileName, contentType);
  const path = `${userId}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(GROUP_PHOTOS_BUCKET).upload(path, arrayBuffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(GROUP_PHOTOS_BUCKET).getPublicUrl(path);

  return data.publicUrl;
}

function getImageExtension(fileName: string | null | undefined, contentType: string) {
  const fileExtension = fileName?.split('.').pop()?.toLowerCase();

  if (fileExtension) {
    return fileExtension;
  }

  if (contentType === 'image/png') {
    return 'png';
  }

  if (contentType === 'image/webp') {
    return 'webp';
  }

  return 'jpg';
}
