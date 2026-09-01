import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTableStore } from '@/store/useTableStore';
import { useOrderStore } from '@/store/useOrderStore';
import * as Haptics from 'expo-haptics';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  time: string;
  isQuickAction?: boolean;
}

export default function LiveChatScreen() {
  const router = useRouter();
  const currentTable = useTableStore((state) => state.currentTable);
  const activeOrder = useOrderStore((state) => state.getOrderById(state.activeOrderId || ''));

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'system',
      text: `Connected with Hasan's Flavors Support${currentTable ? ` • Dining at ${currentTable}` : ''}. Average response time: < 1 min.`,
      time: 'Just now',
    },
    {
      id: 'msg-1',
      sender: 'agent',
      text: `Assalamu Alaikum & Welcome! How can we assist you with your order${currentTable ? ` at ${currentTable}` : ''} today?`,
      time: 'Just now',
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const quickPrompts = [
    { label: '📍 Where is my order?', action: 'where_order' },
    { label: '🍴 Extra spoons & napkins', action: 'cutlery' },
    { label: '🌶️ Extra Gravy / Raita', action: 'gravy' },
    { label: '🧊 Cold Water / Ice', action: 'water' },
    { label: '💳 Request Bill / Bill Out', action: 'bill' },
  ];

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      time: nowStr,
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInputMessage('');

    // Simulate Agent Auto-reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      let replyText = "Thank you! Our kitchen & floor team have been notified and are attending to your request.";
      const lower = text.toLowerCase();

      if (lower.includes('where') || lower.includes('status') || lower.includes('track')) {
        replyText = activeOrder
          ? `Your order #${activeOrder.orderNumber} is currently in progress (${activeOrder.status === 'preparing' ? 'Cooking in Kitchen' : activeOrder.status}). It will be served hot shortly!`
          : `Your order is cooking fresh in the kitchen. Expected delivery within 15-20 minutes!`;
      } else if (lower.includes('spoon') || lower.includes('napkin') || lower.includes('cutlery') || lower.includes('plate')) {
        replyText = `Understood! Our floor server is bringing fresh cutlery, spoons, and napkins directly to ${currentTable || 'your table'}.`;
      } else if (lower.includes('gravy') || lower.includes('raita') || lower.includes('sauce') || lower.includes('spicy')) {
        replyText = `Noted! Extra Biryani gravy and chilled cucumber raita are being packed for you right away.`;
      } else if (lower.includes('water') || lower.includes('ice') || lower.includes('drink')) {
        replyText = `Sure thing! Complimentary iced water is on its way to ${currentTable || 'your table'}.`;
      } else if (lower.includes('bill') || lower.includes('pay') || lower.includes('check')) {
        replyText = `We have informed the cashier. The server will bring the receipt or you can pay via GCash/Card anytime.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-rep-${Date.now()}`,
          sender: 'agent',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1200);
  };

  const handleCallHotline = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    Linking.openURL('tel:+639178882345').catch(() => {
      Alert.alert("Restaurant Hotline", "Call Hasan's Flavors at +63 917 888 2345");
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Chat Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.agentInfoCol}>
          <View style={styles.agentTitleRow}>
            <Image
              source={require('../../assets/images/hasan_logo.jpg')}
              style={styles.agentAvatar}
              resizeMode="cover"
            />
            <View>
              <Text style={styles.agentName}>Hasan's Live Help</Text>
              <View style={styles.onlineStatusRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Kitchen & Floor Staff Online</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.phoneCallBtn} onPress={handleCallHotline} activeOpacity={0.8}>
          <Ionicons name="call" size={16} color={Colors.primary} />
          <Text style={styles.phoneCallText}>Call</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesScroll}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick FAQ Suggestion Pills */}
          <View style={styles.quickPromptsSection}>
            <Text style={styles.quickPromptsLabel}>⚡ Quick Requests & Assistance:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPromptsRow}>
              {quickPrompts.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickPromptPill}
                  onPress={() => handleSendMessage(item.label)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickPromptText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Messages Thread */}
          {messages.map((msg) => {
            if (msg.sender === 'system') {
              return (
                <View key={msg.id} style={styles.systemBubble}>
                  <Ionicons name="shield-checkmark" size={14} color={Colors.halalGreen} />
                  <Text style={styles.systemText}>{msg.text}</Text>
                </View>
              );
            }

            const isUser = msg.sender === 'user';
            return (
              <View key={msg.id} style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAgent]}>
                {!isUser && (
                  <Image
                    source={require('../../assets/images/hasan_logo.jpg')}
                    style={styles.msgAvatar}
                    resizeMode="cover"
                  />
                )}
                <View style={[styles.messageBubble, isUser ? styles.bubbleUser : styles.bubbleAgent]}>
                  <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextAgent]}>
                    {msg.text}
                  </Text>
                  <Text style={[styles.messageTime, isUser ? styles.timeUser : styles.timeAgent]}>
                    {msg.time}
                  </Text>
                </View>
              </View>
            );
          })}

          {isTyping && (
            <View style={[styles.messageRow, styles.messageRowAgent]}>
              <Image
                source={require('../../assets/images/hasan_logo.jpg')}
                style={styles.msgAvatar}
                resizeMode="cover"
              />
              <View style={[styles.messageBubble, styles.bubbleAgent, styles.typingBubble]}>
                <Text style={styles.typingText}>Hasan's staff is typing...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Chat Input Bar */}
        <SafeAreaView edges={['bottom']} style={styles.inputBarSafeArea}>
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your message or request here..."
              placeholderTextColor={Colors.textMuted}
              value={inputMessage}
              onChangeText={setInputMessage}
              multiline
              maxLength={300}
            />

            <TouchableOpacity
              style={[styles.sendBtn, inputMessage.trim().length > 0 && styles.sendBtnActive]}
              onPress={() => handleSendMessage()}
              disabled={inputMessage.trim().length === 0}
              activeOpacity={0.8}
            >
              <Ionicons
                name="send"
                size={18}
                color={inputMessage.trim().length > 0 ? Colors.textLight : Colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    ...Shadows.subtle,
  },
  backBtn: {
    padding: 6,
  },
  agentInfoCol: {
    flex: 1,
    marginLeft: 8,
  },
  agentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  agentAvatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.round,
    borderWidth: 1.5,
    borderColor: '#FFE0B2',
  },
  agentName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    color: Colors.text,
  },
  onlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.halalGreen,
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.halalGreen,
  },
  phoneCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFD4D4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.round,
    gap: 4,
  },
  phoneCallText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.md,
    paddingBottom: 20,
    gap: 12,
  },
  quickPromptsSection: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 4,
    ...Shadows.subtle,
  },
  quickPromptsLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickPromptsRow: {
    gap: 8,
  },
  quickPromptPill: {
    backgroundColor: '#FAF9F8',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.round,
  },
  quickPromptText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  systemBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    alignSelf: 'center',
    marginVertical: 4,
    maxWidth: '92%',
  },
  systemText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.halalGreenDark,
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginVertical: 2,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAgent: {
    justifyContent: 'flex-start',
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    ...Shadows.subtle,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 2,
  },
  bubbleAgent: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 19,
  },
  messageTextUser: {
    color: Colors.textLight,
    fontWeight: '500',
  },
  messageTextAgent: {
    color: Colors.text,
    fontWeight: '500',
  },
  messageTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeUser: {
    color: 'rgba(255,255,255,0.75)',
  },
  timeAgent: {
    color: Colors.textMuted,
  },
  typingBubble: {
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  inputBarSafeArea: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 90,
    backgroundColor: '#FAF9F8',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.round,
    backgroundColor: '#F0EFEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnActive: {
    backgroundColor: Colors.primary,
  },
});
