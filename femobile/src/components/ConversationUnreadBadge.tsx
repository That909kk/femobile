import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUnreadCountByConversation } from '../hooks';
import { colors, responsiveFontSize, responsiveSpacing } from '../styles';

interface ConversationUnreadBadgeProps {
  conversationId: string;
  enabled?: boolean;
}

/**
 * Badge component to display unread count for a conversation
 * Auto-refreshes every 10 seconds
 */
export const ConversationUnreadBadge: React.FC<ConversationUnreadBadgeProps> = ({
  conversationId,
  enabled = true,
}) => {
  const { unreadCount } = useUnreadCountByConversation(
    conversationId,
    enabled,
    10000, // Refresh every 10 seconds
  );

  console.log('🔔 ConversationUnreadBadge:', { conversationId, unreadCount, enabled });

  if (unreadCount <= 0) {
    console.log('🔔 Badge hidden - no unread messages');
    return null;
  }

  // Format count: show "99+" if more than 99
  const displayCount = unreadCount > 99 ? '99+' : unreadCount.toString();

  console.log('🔔 Badge showing:', displayCount);

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{displayCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.feedback.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: responsiveSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: responsiveSpacing.sm,
  },
  badgeText: {
    color: colors.neutral.white,
    fontSize: responsiveFontSize.caption,
    fontWeight: '700',
    textAlign: 'center',
  },
});
