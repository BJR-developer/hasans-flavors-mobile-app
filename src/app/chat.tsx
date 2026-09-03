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
      text: `Support connected${currentTable ? ` • Table ${currentTable}` : ''}. Response time < 1 min.`,
      time: 'Just now',
    },
    {
      id: 'msg-1',
      sender: 'agent',
      text: `Hello! How can we assist you with your order${currentTable ? ` at ${currentTable}` : ''} today?`,
      time: 'Just now',
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const quickPrompts = [
    { label: 'Order Status', action: 'where_order' },
    { label: 'Extra Cutlery & Napkins', action: 'cutlery' },
    { label: 'Extra Gravy / Raita', action: 'gravy' },
    { label: 'Cold Water', action: 'water' },
    { label: 'Request Bill', action: 'bill' },
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

      let replyText = "Thank you. Our kitchen and floor team have been notified and are attending to your request.";
      const lower = text.toLowerCase();

      if (lower.includes('status') || lower.includes('where') || lower.includes('track')) {
        replyText = activeOrder
          ? `Your order #${activeOrder.orderNumber} is currently ${activeOrder.status === 'preparing' ? 'being cooked in the kitchen' : activeOrder.status}. It will be served shortly.`
          : `Your order is cooking fresh in the kitchen. Expected delivery within 15-20 minutes.`;
      } else if (lower.includes('cutlery') || lower.includes('spoon') || lower.includes('napkin')) {
        replyText = `Understood. Our floor server is bringing cutlery and napkins directly to ${currentTable || 'your table'}.`;
      } else if (lower.includes('gravy') || lower.includes('raita') || lower.includes('sauce')) {
        replyText = `Noted. Extra Biryani gravy and chilled raita are being prepared for you.`;
      } else if (lower.includes('water') || lower.includes('ice') || lower.includes('drink')) {
        replyText = `Complimentary iced water is on its way to ${currentTable || 'your table'}.`;
      } else if (lower.includes('bill') || lower.includes('check') || lower.includes('pay')) {
        replyText = `The server has been notified to bring the receipt. You may also settle via GCash or card.`;
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
      Alert.alert("Restaurant Hotline", "Call +63 917 888 2345");
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.agentInfoCol}>
          <Text style={styles.agentName}>Support & Kitchen Desk</Text>
          <Text style={styles.onlineText}>Online</Text>
        </View>

        <TouchableOpacity style={styles.phoneCallBtn} onPress={handleCallHotline} activeOpacity={0.8}>
          <Ionicons name="call-outline" size={16} color={Colors.text} />
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
          {/* Quick Request Chips */}
          <View style={styles.quickPromptsSection}>
            <Text style={styles.quickPromptsLabel}>Quick Requests</Text>
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
                  <Text style={styles.systemText}>{msg.text}</Text>
                </View>
              );
            }

            const isUser = msg.sender === 'user';
            return (
              <View key={msg.id} style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAgent]}>
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
              <View style={[styles.messageBubble, styles.bubbleAgent, styles.typingBubble]}>
                <Text style={styles.typingText}>Staff is typing...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Input Bar */}
        <SafeAreaView edges={['bottom']} style={styles.inputBarSafeArea}>
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your message or request..."
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
                name="arrow-up"
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 4,
  },
  agentInfoCol: {
    flex: 1,
    marginLeft: 10,
  },
  agentName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  onlineText: {
    fontSize: 11,
    color: Colors.halalGreen,
    fontWeight: '500',
  },
  phoneCallBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.lg,
    paddingBottom: 20,
    gap: 12,
  },
  quickPromptsSection: {
    marginBottom: 8,
  },
  quickPromptsLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  quickPromptsRow: {
    gap: 6,
  },
  quickPromptPill: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.round,
  },
  quickPromptText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.text,
  },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 4,
  },
  systemText: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 2,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAgent: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  bubbleUser: {
    backgroundColor: Colors.text,
  },
  bubbleAgent: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 19,
  },
  messageTextUser: {
    color: Colors.textLight,
    fontWeight: '400',
  },
  messageTextAgent: {
    color: Colors.text,
    fontWeight: '400',
  },
  messageTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeUser: {
    color: 'rgba(255,255,255,0.6)',
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
    borderTopColor: Colors.border,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 80,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnActive: {
    backgroundColor: Colors.text,
  },
});
