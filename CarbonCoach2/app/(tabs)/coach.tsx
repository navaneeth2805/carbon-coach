import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '@/components/GradientBackground';
import { GlassCard } from '@/components/GlassCard';
import { useUserProfile } from '@/context/UserProfileContext';
import { useScanHistory } from '@/context/ScanHistoryContext';
import { askCarbonCoach, ChatMessage } from '@/services/coachService';
import { colors, typography, spacing, radius } from '@/theme/tokens';

const SUGGESTED_QUESTIONS = [
  'Why is my latest meal high in carbon?',
  'What are low-emissions protein alternatives?',
  'How do dairy and ghee impact CO₂e?',
  'Tips to cut 50% food emissions this week',
];

export default function CoachScreen() {
  const { profile } = useUserProfile();
  const { recentMeal } = useScanHistory();
  const scrollViewRef = useRef<ScrollView>(null);

  const [inputQuery, setInputQuery] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState<boolean>(false);

  useEffect(() => {
    // Initial welcome message
    const welcomeText = recentMeal
      ? `Hello! I noticed your recent meal was "${recentMeal.dishName}" (${recentMeal.totalCo2e} kg CO₂e). Ask me why its emissions were high or low, or how to swap ingredients to save carbon!`
      : `Hello! I'm your CarbonCoach. Scan or log a meal and I'll analyze the ingredients and help you discover climate-friendly substitutions. What would you like to explore today?`;

    setMessages([
      {
        id: 'initial_welcome',
        role: 'assistant',
        content: welcomeText,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [recentMeal?.dishName]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isThinking) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsThinking(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const coachResponse = await askCarbonCoach(
        query,
        recentMeal,
        profile,
        messages
      );
      setMessages(prev => [...prev, coachResponse]);
    } catch (err) {
      console.error('Coach failed to respond:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `fallback_${Date.now()}`,
          role: 'assistant',
          content: 'I had trouble processing that request online, but reducing high-emissions dairy concentrates (butter/ghee) and red meats in favor of lentils or tofu is the fastest path to net-zero eating!',
          timestamp: new Date().toISOString(),
          isFallback: true,
        },
      ]);
    } finally {
      setIsThinking(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.coachAvatar}>
                <Ionicons name="sparkles" size={18} color={colors.primaryTeal} />
              </View>
              <View>
                <Text style={styles.headerTitle}>CarbonCoach</Text>
                <Text style={styles.headerSub}>
                  {recentMeal
                    ? `Context: ${recentMeal.dishName} (${recentMeal.totalCo2e} kg)`
                    : 'Personalized Food Sustainability AI'}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Suggestion Chips */}
          <View style={styles.chipsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.75}
                  onPress={() => handleSendMessage(q)}
                  style={styles.chipButton}
                >
                  <Text style={styles.chipText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Chat Messages */}
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.chatScroll}
            showsVerticalScrollIndicator={false}
          >
            {messages.map(msg => {
              const isUser = msg.role === 'user';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    isUser ? styles.messageRowUser : styles.messageRowAssistant,
                  ]}
                >
                  {!isUser && (
                    <View style={styles.msgAvatar}>
                      <Ionicons name="leaf" size={14} color={colors.primaryTeal} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      isUser ? styles.bubbleUser : styles.bubbleAssistant,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isUser ? styles.msgTextUser : styles.msgTextAssistant,
                      ]}
                    >
                      {msg.content}
                    </Text>
                  </View>
                </View>
              );
            })}

            {isThinking && (
              <View style={[styles.messageRow, styles.messageRowAssistant]}>
                <View style={styles.msgAvatar}>
                  <Ionicons name="leaf" size={14} color={colors.primaryTeal} />
                </View>
                <View style={[styles.messageBubble, styles.bubbleAssistant]}>
                  <View style={styles.thinkingRow}>
                    <ActivityIndicator size="small" color={colors.primaryTeal} />
                    <Text style={styles.thinkingText}>Coach is reflecting...</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask about your meal's carbon footprint..."
              placeholderTextColor={colors.textMuted}
              value={inputQuery}
              onChangeText={setInputQuery}
              onSubmitEditing={() => handleSendMessage()}
              returnKeyType="send"
            />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSendMessage()}
              disabled={!inputQuery.trim() || isThinking}
              style={[
                styles.sendBtn,
                (!inputQuery.trim() || isThinking) && styles.sendBtnDisabled,
              ]}
            >
              <Ionicons
                name="send"
                size={18}
                color={!inputQuery.trim() || isThinking ? colors.textMuted : colors.textInverse}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  coachAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderWidth: 1,
    borderColor: colors.primaryTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: typography.sizes.caption,
    color: colors.primaryTeal,
  },
  chipsContainer: {
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  chipsScroll: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  chipButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  chipText: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  chatScroll: {
    padding: spacing.base,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs + 2,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
  },
  bubbleUser: {
    backgroundColor: colors.primaryTeal,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  msgTextUser: {
    color: colors.textInverse,
    fontWeight: typography.weights.medium,
  },
  msgTextAssistant: {
    color: colors.textPrimary,
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  thinkingText: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundElevated,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm + 2 : spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.sizes.body,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
