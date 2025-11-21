import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput as RNTextInput,
  Dimensions,
  Image,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { chatService, websocketService } from '../services';
import type { ChatMessage } from '../services/chatService';
import { useAuthStore } from '../store/authStore';
import { colors, responsiveSpacing, responsiveFontSize } from '../styles';
import { useMarkAsRead } from '../hooks';

type RootStackParamList = {
  ChatScreen: { conversationId: string; recipientName: string };
};

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreen'>;
type ChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChatScreen'>;

interface Props {
  route: ChatScreenRouteProp;
  navigation: ChatScreenNavigationProp;
}

// Helper function để lấy senderId (customerId hoặc employeeId) cho receiverId trong mark-read API
const getSenderId = (user: any, role: string | null): string | null => {
  if (!user || !role) return null;
  if (role === 'CUSTOMER') return user.customerId;
  if (role === 'EMPLOYEE') return user.employeeId;
  if (role === 'ADMIN') return user.adminId;
  return null;
};

export const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const { conversationId, recipientName } = route.params;
  const { user, role } = useAuthStore();
  
  // accountId dùng cho send message API (backend cần accountId)
  const accountId = user?.accountId;
  // senderId dùng cho mark-read API (backend cần customerId/employeeId)
  const senderId = getSenderId(user, role);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Hook to mark messages as read
  const { markConversationAsRead } = useMarkAsRead();

  // Load messages khi vào màn hình
  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  // Mark messages as read when entering conversation
  useEffect(() => {
    if (conversationId) {
      // Delay to ensure user has actually viewed the conversation
      const timer = setTimeout(() => {
        markConversationAsRead(conversationId);
      }, 1000); // 1 second delay

      return () => clearTimeout(timer);
    }
  }, [conversationId, markConversationAsRead]);

  // Handler for receiving new messages via WebSocket
  const handleNewMessage = useCallback((message: ChatMessage) => {
    console.log('[ChatScreen] ===== NEW MESSAGE RECEIVED =====');
    console.log('[ChatScreen] Message ID:', message.messageId);
    console.log('[ChatScreen] Content:', message.content || '[Image]');
    console.log('[ChatScreen] Sender ID:', message.senderId);
    console.log('[ChatScreen] My Account ID:', accountId);
    console.log('[ChatScreen] ================================');
    
    // Thêm tin nhắn mới vào danh sách
    setMessages((prev) => {
      // Kiểm tra xem message đã tồn tại chưa (tránh duplicate)
      const exists = prev.some((m) => m.messageId === message.messageId);
      if (exists) {
        console.log('[ChatScreen] Message already exists, skipping');
        return prev;
      }
      
      console.log('[ChatScreen] Adding new message to list');
      // Đảm bảo message có createdAt để hiển thị timestamp
      const messageWithTimestamp: ChatMessage = {
        ...message,
        createdAt: message.createdAt || message.timestamp || new Date().toISOString(),
        timestamp: message.timestamp || message.createdAt || new Date().toISOString(),
        isRead: message.isRead ?? false, // Default isRead nếu không có
      };
      
      const newMessages = [...prev, messageWithTimestamp];
      
      // Auto-scroll to bottom after adding message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      return newMessages;
    });

    // Mark as read nếu tin nhắn từ người khác (so sánh với accountId)
    if (message.senderId !== accountId) {
      console.log('[ChatScreen] Message from other user, marking as read');
      // Delay a bit to ensure message is rendered first
      setTimeout(() => {
        markConversationAsRead(conversationId);
      }, 500);
    } else {
      console.log('[ChatScreen] Message from me, not marking as read');
    }
  }, [accountId, senderId]);

  // Kết nối WebSocket và subscribe to conversation
  // Nếu WebSocket fail, fallback về polling
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let pollingInterval: NodeJS.Timeout | undefined;
    let isComponentMounted = true;

    const setupWebSocket = async () => {
      try {
        console.log('[ChatScreen] Attempting WebSocket connection...');
        
        // Kết nối WebSocket nếu chưa kết nối
        const wasActive = websocketService.isActive();
        
        if (!wasActive) {
          console.log('[ChatScreen] WebSocket not active, connecting...');
          await websocketService.connect();
          console.log('[ChatScreen] WebSocket connected successfully');
        } else {
          console.log('[ChatScreen] WebSocket already active');
        }

        // Subscribe to conversation để nhận tin nhắn real-time
        console.log('[ChatScreen] Subscribing to conversation:', conversationId);
        unsubscribe = websocketService.subscribeToConversation(
          conversationId,
          handleNewMessage
        );

        if (isComponentMounted) {
          setIsConnected(true);
          console.log('[ChatScreen] ✅ WebSocket connected - real-time updates enabled');
        }
      } catch (error) {
        console.warn('[ChatScreen] ⚠️ WebSocket unavailable, using polling fallback');
        console.error('[ChatScreen] WebSocket error:', error);
        
        if (isComponentMounted) {
          setIsConnected(false);
        }
        
        // Fallback: Poll for new messages every 3 seconds
        pollingInterval = setInterval(async () => {
          if (!isComponentMounted) return;
          
          try {
            const latestMessages = await chatService.getAllMessages(conversationId);
            
            // Check for new messages by comparing message IDs
            setMessages((prevMessages) => {
              const prevIds = new Set(prevMessages.map(m => m.messageId));
              const newMessages = latestMessages.filter(m => !prevIds.has(m.messageId));
              
              if (newMessages.length > 0) {
                console.log('[ChatScreen] 📥 Polling found', newMessages.length, 'new message(s)');
                
                // Mark as read if from other user
                if (newMessages.some(m => m.senderId !== accountId)) {
                  markConversationAsRead(conversationId).catch(err => 
                    console.error('[ChatScreen] Error marking as read:', err)
                  );
                }
                
                // Scroll to bottom
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
                
                return latestMessages;
              }
              
              return prevMessages;
            });
          } catch (error) {
            console.error('[ChatScreen] Polling error:', error);
          }
        }, 3000);
      }
    };

    setupWebSocket();

    // Cleanup khi unmount
    return () => {
      console.log('[ChatScreen] Cleaning up WebSocket subscription');
      isComponentMounted = false;
      
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error('[ChatScreen] Error unsubscribing:', error);
        }
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [conversationId, handleNewMessage]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await chatService.getAllMessages(conversationId);
      // Backend trả về messages theo thứ tự createdAt ASC (cũ → mới)
      // Giữ nguyên thứ tự này để tin mới nhất ở dưới cùng
      setMessages(response);
      
      // Scroll to bottom sau khi load xong
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Lỗi', 'Không thể tải tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !accountId) return;

    const messageContent = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      console.log('[ChatScreen] Sending text message...');
      // Gửi tin nhắn qua REST API (dùng accountId)
      const newMessage = await chatService.sendTextMessage({
        conversationId,
        senderId: accountId,
        content: messageContent
      });
      
      console.log('[ChatScreen] Message sent successfully:', newMessage.messageId);

      // Nếu WebSocket connected, tin nhắn sẽ được nhận qua subscription
      // Nếu không (polling mode), thêm vào danh sách ngay
      if (!isConnected) {
        console.log('[ChatScreen] WebSocket not connected, adding message directly');
        setMessages((prev) => {
          const exists = prev.some((m) => m.messageId === newMessage.messageId);
          if (exists) return prev;
          return [...prev, newMessage];
        });
      } else {
        console.log('[ChatScreen] WebSocket connected, message will arrive via subscription');
        // Fallback: nếu sau 2 giây chưa nhận được qua WebSocket, thêm trực tiếp
        setTimeout(() => {
          setMessages((prev) => {
            const exists = prev.some((m) => m.messageId === newMessage.messageId);
            if (exists) {
              console.log('[ChatScreen] Message already received via WebSocket');
              return prev;
            }
            console.log('[ChatScreen] Message not received via WebSocket, adding directly');
            return [...prev, newMessage];
          });
        }, 2000);
      }
      
      // Scroll to bottom sau khi gửi
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('[ChatScreen] Error sending message:', error);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn');
      setInputText(messageContent); // Restore text on error
    } finally {
      setSending(false);
    }
  };

  // Chọn ảnh từ thư viện
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  // Chụp ảnh
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh');
    }
  };

  // Xóa ảnh đã chọn
  const clearImage = () => {
    setSelectedImage(null);
  };

  // Gửi ảnh
  const sendImage = async () => {
    if (!selectedImage || !accountId) return;

    setSending(true);

    try {
      console.log('[ChatScreen] Sending image message...');
      // Tạo FormData để gửi ảnh
      const filename = selectedImage.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const imageFile = {
        uri: selectedImage,
        name: filename,
        type,
      } as any;

      // Gửi ảnh với caption là text hiện tại (nếu có)
      const newMessage = await chatService.sendImageMessage({
        conversationId,
        senderId: accountId,
        imageFile,
        caption: inputText.trim() || undefined,
      });

      console.log('[ChatScreen] Image sent successfully:', newMessage.messageId);

      // Xóa ảnh và text sau khi gửi thành công
      setSelectedImage(null);
      setInputText('');

      // Nếu WebSocket connected, tin nhắn sẽ được nhận qua subscription
      // Nếu không (polling mode), thêm vào danh sách ngay
      if (!isConnected) {
        console.log('[ChatScreen] WebSocket not connected, adding message directly');
        setMessages((prev) => {
          const exists = prev.some((m) => m.messageId === newMessage.messageId);
          if (exists) return prev;
          return [...prev, newMessage];
        });
      } else {
        console.log('[ChatScreen] WebSocket connected, message will arrive via subscription');
        // Fallback: nếu sau 2 giây chưa nhận được qua WebSocket, thêm trực tiếp
        setTimeout(() => {
          setMessages((prev) => {
            const exists = prev.some((m) => m.messageId === newMessage.messageId);
            if (exists) {
              console.log('[ChatScreen] Message already received via WebSocket');
              return prev;
            }
            console.log('[ChatScreen] Message not received via WebSocket, adding directly');
            return [...prev, newMessage];
          });
        }, 2000);
      }

      // Scroll to bottom sau khi gửi
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('[ChatScreen] Error sending image:', error);
      Alert.alert('Lỗi', 'Không thể gửi ảnh');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timeString: string | null) => {
    // Nếu không có timestamp, hiển thị "Vừa xong"
    if (!timeString) return 'Vừa xong';
    
    const date = new Date(timeString);
    // Kiểm tra date hợp lệ
    if (isNaN(date.getTime())) return 'Vừa xong';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffMins < 1440) return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    // So sánh với accountId vì message.senderId là accountId
    const isMyMessage = item.senderId === accountId;

    return (
      <View style={styles.messageRow}>
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          ]}
        >
          {item.messageType === 'TEXT' && item.content && (
            <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
              {item.content}
            </Text>
          )}
          
          {item.messageType === 'IMAGE' && (
            <View>
              {item.imageUrl && (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              )}
              {item.content && (
                <Text style={[styles.messageText, isMyMessage && styles.myMessageText, styles.imageCaption]}>
                  {item.content}
                </Text>
              )}
            </View>
          )}
          
          <Text style={[styles.timestamp, isMyMessage && styles.myTimestamp]}>
            {formatMessageTime(item.timestamp || item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.neutral.white} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {recipientName}
            </Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isConnected ? colors.feedback.success : colors.neutral.border },
                ]}
              />
              <Text style={styles.statusText}>
                {isConnected ? 'Đang hoạt động' : 'Không hoạt động'}
              </Text>
            </View>
          </View>
        </View>

        {/* Messages List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.highlight.teal} />
            <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.neutral.border} />
            <Text style={styles.emptyText}>Chưa có tin nhắn</Text>
            <Text style={styles.emptySubtext}>Hãy bắt đầu cuộc trò chuyện</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.messageId}
            contentContainerStyle={styles.messagesList}
            inverted={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {/* Image Preview */}
        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <View style={styles.imagePreviewWrapper}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <TouchableOpacity
                onPress={clearImage}
                style={styles.removeImageButton}
                disabled={sending}
              >
                <Ionicons name="close-circle" size={28} color={colors.feedback.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Input Container */}
        <View style={styles.inputContainer}>
          {/* Image Actions */}
          <View style={styles.imageActionsContainer}>
            <TouchableOpacity
              onPress={pickImage}
              disabled={sending}
              style={styles.imageActionButton}
            >
              <Ionicons name="image" size={24} color={colors.highlight.teal} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={takePhoto}
              disabled={sending}
              style={styles.imageActionButton}
            >
              <Ionicons name="camera" size={24} color={colors.highlight.teal} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <RNTextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={selectedImage ? "Thêm mô tả cho ảnh..." : "Nhập tin nhắn..."}
              placeholderTextColor={colors.neutral.textSecondary}
              style={styles.textInput}
              multiline
              maxLength={1000}
              editable={!sending}
            />
          </View>
          
          <TouchableOpacity
            onPress={selectedImage ? sendImage : handleSendMessage}
            disabled={(!inputText.trim() && !selectedImage) || sending}
            style={[
              styles.sendButton,
              ((!inputText.trim() && !selectedImage) || sending) && styles.sendButtonDisabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.neutral.white} />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={colors.neutral.white}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.md,
    backgroundColor: colors.highlight.teal,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    marginRight: responsiveSpacing.sm,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '600',
    color: colors.neutral.white,
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.white,
    opacity: 0.9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: responsiveSpacing.sm,
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.xxl,
  },
  emptyText: {
    marginTop: responsiveSpacing.md,
    fontSize: responsiveFontSize.heading3,
    fontWeight: '600',
    color: colors.neutral.textPrimary,
  },
  emptySubtext: {
    marginTop: responsiveSpacing.xs,
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },
  messagesList: {
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.sm,
  },
  messageRow: {
    marginBottom: responsiveSpacing.sm,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.sm,
    borderRadius: 18,
    marginBottom: 4,
  },
  myMessageBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.highlight.teal,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.neutral.white,
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  messageText: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textPrimary,
    lineHeight: 20,
  },
  myMessageText: {
    color: colors.neutral.white,
  },
  messageImage: {
    width: width * 0.6,
    height: width * 0.45,
    borderRadius: 12,
    marginBottom: 4,
  },
  imageCaption: {
    marginTop: 4,
  },
  imageText: {
    fontSize: responsiveFontSize.body,
    color: colors.highlight.teal,
    fontStyle: 'italic',
    marginTop: 4,
  },
  timestamp: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimestamp: {
    color: colors.neutral.white,
    opacity: 0.8,
  },
  imagePreviewContainer: {
    paddingHorizontal: responsiveSpacing.md,
    paddingTop: responsiveSpacing.sm,
    paddingBottom: responsiveSpacing.xs,
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  imagePreviewWrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.neutral.white,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: responsiveSpacing.md,
    paddingTop: responsiveSpacing.sm,
    paddingBottom: Platform.OS === 'ios' ? responsiveSpacing.xs : responsiveSpacing.sm,
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  imageActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: responsiveSpacing.xs,
  },
  imageActionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSpacing.xs,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.neutral.background,
    borderRadius: 24,
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.xs,
    marginRight: responsiveSpacing.sm,
    maxHeight: 100,
  },
  textInput: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textPrimary,
    maxHeight: 80,
    paddingVertical: 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.highlight.teal,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sendButtonDisabled: {
    backgroundColor: colors.neutral.border,
    opacity: 0.5,
  },
});
