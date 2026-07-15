import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Screen } from '../components';
import { colors, radius, spacing } from '../constants';
import {
  ChatTarget,
  ChatMessage,
  deleteConversationMessages,
  getConversationMessages,
  getOrCreateDirectConversation,
  markConversationSeen,
  sendMessagesCleared,
  sendTextMessage,
  sendTyping,
  subscribeToMessages,
  subscribeToTyping,
  unsubscribe,
} from '../services';

type ChatScreenProps = {
  currentUserId: string;
  onBack: () => void;
  target: ChatTarget;
};

export function ChatScreen({ currentUserId, onBack, target }: ChatScreenProps) {
  const [conversationId, setConversationId] = useState('');
  const [draft, setDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const conversationIdRef = useRef('');
  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chatTitle = target.type === 'direct' ? target.profile.name : target.conversation.name ?? 'Group';
  const chatSubtitle =
    target.type === 'direct'
      ? isTyping
        ? 'Typing'
        : 'On SimplyText'
      : isTyping
        ? 'Typing'
        : `${target.memberCount} members`;
  const chatInitial = chatTitle.charAt(0).toUpperCase();

  const clearConversationMessages = useCallback(async (silent = false) => {
    const nextConversationId = conversationIdRef.current;

    if (!nextConversationId) {
      return;
    }

    setMessages([]);
    sendTyping(typingChannelRef.current, currentUserId, false);
    sendMessagesCleared(typingChannelRef.current, currentUserId);

    try {
      await deleteConversationMessages(nextConversationId);
    } catch {
      if (!silent) {
        throw new Error('Unable to clear disappearing chat');
      }

      // The next chat open still fetches from Supabase; cleanup failure should not block navigation.
    }
  }, [currentUserId]);

  const loadConversation = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const conversation =
        target.type === 'direct'
          ? await getOrCreateDirectConversation(currentUserId, target.profile.id)
          : target.conversation;
      const nextMessages = await getConversationMessages(conversation.id);
      await markConversationSeen(conversation.id, currentUserId);

      conversationIdRef.current = conversation.id;
      setConversationId(conversation.id);
      setMessages(nextMessages);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to open chat');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, target]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    if (!conversationId) {
      return undefined;
    }

    const messagesChannel = subscribeToMessages(conversationId, (event) => {
      if (event.type === 'DELETE') {
        setMessages([]);
        return;
      }

      const { message } = event;

      setMessages((currentMessages) => {
        const messageIndex = currentMessages.findIndex((currentMessage) => currentMessage.id === message.id);

        if (messageIndex >= 0) {
          return currentMessages.map((currentMessage, index) =>
            index === messageIndex ? message : currentMessage,
          );
        }

        return [...currentMessages, message];
      });

      if (message.sender_id !== currentUserId) {
        markConversationSeen(conversationId, currentUserId).catch(() => undefined);
      }
    });

    const typingChannel = subscribeToTyping(
      conversationId,
      currentUserId,
      (payload) => {
        setIsTyping(payload.isTyping);

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        if (payload.isTyping) {
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2400);
        }
      },
      () => {
        setMessages([]);
        setIsTyping(false);
      },
    );

    typingChannelRef.current = typingChannel;

    return () => {
      unsubscribe(messagesChannel);
      unsubscribe(typingChannel);
      typingChannelRef.current = null;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    return () => {
      clearConversationMessages(true);
    };
  }, [clearConversationMessages]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        clearConversationMessages(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [clearConversationMessages]);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (firstMessage, secondMessage) =>
          new Date(secondMessage.created_at).getTime() - new Date(firstMessage.created_at).getTime(),
      ),
    [messages],
  );

  const submitMessage = async () => {
    if (!conversationId || !draft.trim() || isSending) {
      return;
    }

    const body = draft;
    setDraft('');
    setIsSending(true);
    sendTyping(typingChannelRef.current, currentUserId, false);

    try {
      await sendTextMessage(conversationId, currentUserId, body);
    } catch (error) {
      setDraft(body);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send message');
    } finally {
      setIsSending(false);
    }
  };

  const updateDraft = (value: string) => {
    setDraft(value);
    sendTyping(typingChannelRef.current, currentUserId, value.trim().length > 0);
  };

  const leaveChat = async () => {
    try {
      await clearConversationMessages();
      onBack();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to clear disappearing chat');
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Pressable accessibilityLabel="Back to contacts" accessibilityRole="button" onPress={leaveChat} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <View style={styles.headerIdentity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{chatInitial}</Text>
            </View>
            <View style={styles.headerCopy}>
              <Text numberOfLines={1} style={styles.title}>
                {chatTitle}
              </Text>
              <Text style={styles.subtitle}>{chatSubtitle}</Text>
            </View>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.statePanel}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.stateText}>Opening chat</Text>
          </View>
        ) : null}

        {!isLoading && errorMessage ? (
          <View style={styles.statePanel}>
            <Text style={styles.stateTitle}>Unable to load chat</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <Pressable accessibilityRole="button" onPress={loadConversation} style={styles.retryButton}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && !errorMessage ? (
          <>
            <FlatList
              contentContainerStyle={styles.messagesContent}
              data={sortedMessages}
              inverted
              keyExtractor={(message) => message.id}
              renderItem={({ item }) => (
                <MessageBubble isOwnMessage={item.sender_id === currentUserId} message={item} />
              )}
              style={styles.messagesList}
            />

            <View style={styles.composer}>
              <TextInput
                autoCapitalize="sentences"
                multiline
                onChangeText={updateDraft}
                placeholder="Message"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={draft}
              />
              <Pressable
                accessibilityRole="button"
                disabled={!draft.trim() || isSending}
                onPress={submitMessage}
                style={[styles.sendButton, (!draft.trim() || isSending) && styles.sendButtonDisabled]}
              >
                <Text style={styles.sendText}>Send</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

type MessageBubbleProps = {
  isOwnMessage: boolean;
  message: ChatMessage;
};

function MessageBubble({ isOwnMessage, message }: MessageBubbleProps) {
  return (
    <View style={[styles.messageRow, isOwnMessage && styles.ownMessageRow]}>
      <View style={[styles.bubble, isOwnMessage ? styles.ownBubble : styles.theirBubble]}>
        <Text style={styles.messageBody}>{message.body}</Text>
        <View style={styles.messageMeta}>
          <Text style={styles.messageTime}>{formatMessageTime(message.created_at)}</Text>
          {isOwnMessage ? (
            <Text style={styles.messageTime}>{message.seen_at ? 'Seen' : 'Sent'}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: '#111111',
    borderColor: '#303030',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  backButton: {
    alignItems: 'center',
    borderColor: '#303030',
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  backButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  bubble: {
    borderRadius: 18,
    gap: spacing.xs,
    maxWidth: '82%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  composer: {
    alignItems: 'flex-end',
    backgroundColor: '#141414',
    borderColor: '#252525',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerIdentity: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minWidth: 0,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    maxHeight: 104,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  keyboardView: {
    flex: 1,
    gap: spacing.md,
  },
  messageBody: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  messageMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  messageRow: {
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  messagesContent: {
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  messagesList: {
    flex: 1,
  },
  messageTime: {
    color: '#C7C7C7',
    fontSize: 11,
    fontWeight: '600',
  },
  ownBubble: {
    backgroundColor: '#2F2F2F',
  },
  ownMessageRow: {
    alignItems: 'flex-end',
  },
  retryButton: {
    borderColor: '#3A3A3A',
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  retryText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
  },
  statePanel: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  stateText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  stateTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  theirBubble: {
    backgroundColor: '#141414',
    borderColor: '#252525',
    borderWidth: 1,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
