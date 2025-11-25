import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useVoiceBookingStore } from '../../../store/voiceBookingStore';
import { colors, responsive, responsiveSpacing, responsiveFontSize } from '../../../styles';

// Constants cho auto-stop
const SILENCE_TIMEOUT = 3000; // 3 giây im lặng thì tự dừng
const MAX_RECORDING_DURATION = 20000; // 20 giây tối đa
const SILENCE_THRESHOLD = -50; // dB threshold để detect silence

interface VoiceBookingScreenProps {}

const VoiceBookingScreen: React.FC<VoiceBookingScreenProps> = () => {
  const navigation = useNavigation();
  
  // Zustand store
  const {
    isRecording,
    isProcessing,
    currentStatus,
    messages,
    transcript,
    missingFields,
    preview,
    bookingId,
    error,
    startRecording,
    stopRecording,
    continueWithText,
    confirmBooking,
    cancelBooking,
    resetConversation,
  } = useVoiceBookingStore();

  const [additionalText, setAdditionalText] = useState('');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isAutoStopped, setIsAutoStopped] = useState(false);

  // Timers
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Request audio permissions
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền microphone để sử dụng tính năng này');
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    })();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      clearAllTimers();
    };
  }, []);

  // Clear all timers
  const clearAllTimers = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (isRecording) {
      // Pulse animation khi đang ghi âm
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Wave animation
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      pulseAnim.setValue(1);
      waveAnim.setValue(0);
    }
  }, [isRecording]);

  // Play AI speech when available
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (latestMessage?.type === 'ai' && latestMessage.audioUrl && !isRecording) {
      playAudio(latestMessage.audioUrl);
    }
  }, [messages]);

  // Auto scroll to bottom when new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const playAudio = async (url: string) => {
    try {
      // Stop current audio if playing
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );
      setSound(newSound);
      
      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          newSound.unloadAsync();
          setSound(null);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleStartRecording = async () => {
    try {
      setIsAutoStopped(false);
      setRecordingDuration(0);

      // Create recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      await startRecording();

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Set max duration timer
      maxDurationTimerRef.current = setTimeout(() => {
        setIsAutoStopped(true);
        handleStopRecording(true);
      }, MAX_RECORDING_DURATION);

      // Monitor audio levels for silence detection
      monitorAudioLevels(newRecording);

    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Lỗi', 'Không thể bắt đầu ghi âm');
    }
  };

  const monitorAudioLevels = async (rec: Audio.Recording) => {
    // Note: Expo doesn't provide direct metering API
    // This is a simplified approach - in production, you might need native modules
    
    // Reset silence timer on each check
    const resetSilenceTimer = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      
      silenceTimerRef.current = setTimeout(() => {
        setIsAutoStopped(true);
        handleStopRecording(true);
      }, SILENCE_TIMEOUT);
    };

    // Start silence detection
    resetSilenceTimer();
  };

  const handleStopRecording = async (autoStopped = false) => {
    try {
      clearAllTimers();

      if (!recording) return;

      // Get the audio file URI before stopping
      const uri = recording.getURI();
      if (!uri) {
        throw new Error('No recording URI');
      }

      // Stop the recording
      await recording.stopAndUnloadAsync();
      
      // Create File object for React Native (not blob)
      const audioFile = {
        uri: uri,
        type: 'audio/m4a', // expo-av default format
        name: `voice_${Date.now()}.m4a`,
      } as any;

      // Clear recording state
      setRecording(null);
      setRecordingDuration(0);

      // Send to backend via store
      await stopRecording(audioFile);

      if (autoStopped) {
        // Show auto-stop message
        setTimeout(() => {
          setIsAutoStopped(false);
        }, 3000);
      }

    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Lỗi', 'Không thể dừng ghi âm');
      clearAllTimers();
      setRecording(null);
    }
  };

  const handleContinueWithText = () => {
    if (!additionalText.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập thông tin bổ sung');
      return;
    }
    continueWithText(additionalText);
    setAdditionalText('');
  };

  const handleConfirm = () => {
    Alert.alert(
      'Xác nhận đặt lịch',
      'Bạn có chắc chắn muốn xác nhận đặt lịch này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: () => confirmBooking(),
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert('Hủy đặt lịch', 'Bạn có chắc chắn muốn hủy?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy đặt lịch',
        style: 'destructive',
        onPress: () => {
          cancelBooking();
          resetConversation();
        },
      },
    ]);
  };

  const handleReset = () => {
    resetConversation();
    setAdditionalText('');
  };

  const renderStatusMessage = () => {
    const latestMessage = messages[messages.length - 1];
    
    if (currentStatus === 'COMPLETED' && bookingId) {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark-circle" size={48} color={colors.feedback.success} />
          <Text style={styles.statusText}>Đặt lịch thành công!</Text>
          <Text style={styles.statusSubtext}>Mã đặt lịch: {bookingId}</Text>
          <TouchableOpacity
            style={styles.viewDetailButton}
            onPress={() => (navigation as any).navigate('OrderDetail', { bookingId })}
          >
            <Text style={styles.viewDetailText}>Xem chi tiết</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.statusContainer, styles.errorContainer]}>
          <Ionicons name="warning" size={24} color={colors.feedback.error} />
          <Text style={styles.statusText}>Có lỗi xảy ra</Text>
          <Text style={styles.statusSubtext}>{error}</Text>
        </View>
      );
    }

    if (isRecording) {
      return (
        <View style={styles.statusContainer}>
          <View style={styles.statusHeader}>
            <View style={styles.recordingIndicator} />
            <Text style={styles.statusText}>Đang nghe bạn...</Text>
          </View>
          <Text style={styles.statusSubtext}>
            {isAutoStopped 
              ? 'Đã dừng nghe để xử lý yêu cầu của bạn'
              : `Nói đi, mình đang nghe... (${recordingDuration}s)`
            }
          </Text>
        </View>
      );
    }

    if (isProcessing) {
      return (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="small" color={colors.highlight.teal} />
          <Text style={styles.statusText}>Đang xử lý...</Text>
          <Text style={styles.statusSubtext}>AI đang phân tích yêu cầu của bạn</Text>
        </View>
      );
    }

    if (currentStatus === 'PARTIAL' && latestMessage) {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="alert-circle-outline" size={24} color={colors.feedback.warning} />
          <Text style={styles.statusText}>Cần thêm thông tin</Text>
          <Text style={styles.statusSubtext}>Hãy nói thêm hoặc nhập bên dưới</Text>
        </View>
      );
    }

    if (currentStatus === 'AWAITING_CONFIRMATION' && preview) {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark-circle-outline" size={24} color={colors.feedback.success} />
          <Text style={styles.statusText}>Sẵn sàng xác nhận</Text>
          <Text style={styles.statusSubtext}>Kiểm tra thông tin và xác nhận</Text>
        </View>
      );
    }

    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Sẵn sàng lắng nghe</Text>
        <Text style={styles.statusSubtext}>Nhấn nút mic để bắt đầu</Text>
      </View>
    );
  };

  const renderRecordButton = () => {
    const waveScale = waveAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.5],
    });

    const waveOpacity = waveAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 0],
    });

    return (
      <View style={styles.recordButtonContainer}>
        {/* Wave effect khi đang ghi âm */}
        {isRecording && (
          <>
            <Animated.View
              style={[
                styles.recordWave,
                {
                  transform: [{ scale: waveScale }],
                  opacity: waveOpacity,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.recordWave,
                styles.recordWave2,
                {
                  transform: [{ scale: waveScale }],
                  opacity: waveOpacity,
                },
              ]}
            />
          </>
        )}

        <Animated.View
          style={[
            styles.recordButtonWrapper,
            {
              transform: [{ scale: isRecording ? pulseAnim : 1 }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.recordButton}
            onPress={() => isRecording ? handleStopRecording(false) : handleStartRecording()}
            activeOpacity={0.8}
            disabled={isProcessing}
          >
            <LinearGradient
              colors={isRecording ? ['#D64545', '#F6C343'] : ['#1BB5A6', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.recordGradient}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'mic'}
                size={responsive.moderateScale(48)}
                color={colors.neutral.white}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt lịch bằng giọng nói</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Assistant Icon */}
        <View style={styles.assistantContainer}>
          <LinearGradient
            colors={['#1BB5A6', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.assistantIcon}
          >
            <Ionicons name="sparkles" size={responsive.moderateScale(40)} color={colors.neutral.white} />
          </LinearGradient>
          <Text style={styles.assistantTitle}>AI Assistant</Text>
          <Text style={styles.assistantSubtitle}>Trợ lý thông minh của bạn</Text>
        </View>

        {/* Status */}
        {renderStatusMessage()}

        {/* Conversation History */}
        {messages.length > 0 && (
          <View style={styles.conversationContainer}>
            <Text style={styles.conversationTitle}>Cuộc trò chuyện:</Text>
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageContainer,
                  msg.type === 'user' ? styles.userMessage : styles.aiMessage,
                ]}
              >
                {msg.type === 'ai' && (
                  <Ionicons name="sparkles" size={16} color={colors.highlight.purple} style={styles.messageIcon} />
                )}
                <Text style={[
                  styles.messageText,
                  msg.type === 'user' ? styles.userMessageText : styles.aiMessageText,
                ]}>
                  {msg.content}
                </Text>
                {msg.type === 'user' && (
                  <Ionicons name="person" size={16} color={colors.neutral.white} style={styles.messageIcon} />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Transcript */}
        {transcript && (
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptLabel}>Nội dung ghi nhận:</Text>
            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptText}>{transcript}</Text>
            </View>
          </View>
        )}

        {/* Preview Card */}
        {currentStatus === 'AWAITING_CONFIRMATION' && preview && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Xem trước đặt lịch</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewRow}>
                <Ionicons name="location" size={20} color={colors.highlight.teal} />
                <View style={styles.previewInfo}>
                  <Text style={styles.previewLabel}>Địa chỉ:</Text>
                  <Text style={styles.previewValue}>{preview.address}</Text>
                  {preview.ward && preview.city && (
                    <Text style={styles.previewSubValue}>{preview.ward}, {preview.city}</Text>
                  )}
                </View>
              </View>
              
              {preview.bookingTime && (
                <View style={styles.previewRow}>
                  <Ionicons name="time" size={20} color={colors.highlight.teal} />
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewLabel}>Thời gian:</Text>
                    <Text style={styles.previewValue}>
                      {new Date(preview.bookingTime).toLocaleString('vi-VN')}
                    </Text>
                  </View>
                </View>
              )}

              {preview.services && preview.services.length > 0 && (
                <View style={styles.previewRow}>
                  <Ionicons name="briefcase" size={20} color={colors.highlight.teal} />
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewLabel}>Dịch vụ:</Text>
                    {preview.services.map((service, index) => (
                      <View key={index} style={styles.serviceItem}>
                        <Text style={styles.previewValue}>
                          {service.serviceName} x{service.quantity}
                        </Text>
                        <Text style={styles.previewPrice}>{service.subtotalFormatted}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.previewTotal}>
                <Text style={styles.totalLabel}>Tổng cộng:</Text>
                <Text style={styles.totalValue}>{preview.totalAmountFormatted}</Text>
              </View>
            </View>

            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                <LinearGradient
                  colors={['#1BB5A6', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.confirmGradient}
                >
                  <Text style={styles.confirmBtnText}>Xác nhận</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Missing Fields Form */}
        {currentStatus === 'PARTIAL' && missingFields.length > 0 && (
          <View style={styles.missingFieldsContainer}>
            <Text style={styles.missingFieldsTitle}>Thông tin cần bổ sung:</Text>
            <View style={styles.missingFieldsList}>
              {missingFields.map((field, index) => (
                <View key={index} style={styles.missingFieldChip}>
                  <Ionicons name="alert-circle" size={14} color={colors.feedback.warning} />
                  <Text style={styles.missingFieldText}>{field}</Text>
                </View>
              ))}
            </View>
            
            <TextInput
              style={styles.additionalInput}
              placeholder="Nhập thông tin bổ sung..."
              value={additionalText}
              onChangeText={setAdditionalText}
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.neutral.label}
            />
            
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={handleContinueWithText}
              disabled={!additionalText.trim()}
            >
              <LinearGradient
                colors={additionalText.trim() ? ['#1BB5A6', '#8B5CF6'] : [colors.neutral.border, colors.neutral.border]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendGradient}
              >
                <Text style={styles.sendButtonText}>Gửi</Text>
                <Ionicons name="send" size={18} color={colors.neutral.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Reset Button when completed */}
        {currentStatus === 'COMPLETED' && (
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Đặt lịch mới</Text>
            <Ionicons name="refresh" size={20} color={colors.highlight.teal} />
          </TouchableOpacity>
        )}

        {/* Instructions */}
        {(!currentStatus || messages.length === 0) && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Hướng dẫn sử dụng:</Text>
            <View style={styles.instructionItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.highlight.teal} />
              <Text style={styles.instructionText}>Nhấn nút mic và nói rõ ràng</Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.highlight.teal} />
              <Text style={styles.instructionText}>Cung cấp thông tin: dịch vụ, thời gian, địa chỉ</Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.highlight.teal} />
              <Text style={styles.instructionText}>AI sẽ xử lý và xác nhận thông tin</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Record Button */}
      <View style={styles.bottomContainer}>
        {renderRecordButton()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.sm,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  backButton: {
    width: responsive.moderateScale(40),
    height: responsive.moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '600',
    color: colors.primary.navy,
  },
  headerRight: {
    width: responsive.moderateScale(40),
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: responsiveSpacing.lg,
  },
  assistantContainer: {
    alignItems: 'center',
    marginBottom: responsiveSpacing.xl,
  },
  assistantIcon: {
    width: responsive.moderateScale(100),
    height: responsive.moderateScale(100),
    borderRadius: responsive.moderateScale(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSpacing.md,
    shadowColor: colors.highlight.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  assistantTitle: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '700',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.xs,
  },
  assistantSubtitle: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
  },
  statusContainer: {
    alignItems: 'center',
    padding: responsiveSpacing.lg,
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(16),
    marginBottom: responsiveSpacing.lg,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing.sm,
  },
  recordingIndicator: {
    width: responsive.moderateScale(8),
    height: responsive.moderateScale(8),
    borderRadius: responsive.moderateScale(4),
    backgroundColor: colors.feedback.error,
  },
  statusText: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '600',
    color: colors.primary.navy,
    marginTop: responsiveSpacing.sm,
    marginBottom: responsiveSpacing.xs,
  },
  statusSubtext: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },
  transcriptContainer: {
    marginBottom: responsiveSpacing.lg,
  },
  transcriptLabel: {
    fontSize: responsiveFontSize.caption,
    fontWeight: '600',
    color: colors.neutral.textSecondary,
    marginBottom: responsiveSpacing.sm,
  },
  transcriptBox: {
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(12),
    padding: responsiveSpacing.md,
    borderWidth: 1,
    borderColor: colors.highlight.teal,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  transcriptText: {
    fontSize: responsiveFontSize.body,
    color: colors.primary.navy,
    lineHeight: responsiveFontSize.body * 1.5,
  },
  instructionsContainer: {
    backgroundColor: colors.warm.beige,
    borderRadius: responsive.moderateScale(12),
    padding: responsiveSpacing.md,
  },
  instructionsTitle: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.sm,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSpacing.xs,
  },
  instructionText: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textPrimary,
    marginLeft: responsiveSpacing.sm,
    flex: 1,
  },
  bottomContainer: {
    padding: responsiveSpacing.lg,
    paddingBottom: responsiveSpacing.xl,
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  recordButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: responsive.moderateScale(150),
  },
  recordWave: {
    position: 'absolute',
    width: responsive.moderateScale(150),
    height: responsive.moderateScale(150),
    borderRadius: responsive.moderateScale(75),
    backgroundColor: colors.highlight.teal,
    opacity: 0.3,
  },
  recordWave2: {
    width: responsive.moderateScale(180),
    height: responsive.moderateScale(180),
    borderRadius: responsive.moderateScale(90),
  },
  recordButtonWrapper: {
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  recordButton: {
    width: responsive.moderateScale(120),
    height: responsive.moderateScale(120),
    borderRadius: responsive.moderateScale(60),
    overflow: 'hidden',
  },
  recordGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewDetailButton: {
    marginTop: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.sm,
    paddingHorizontal: responsiveSpacing.lg,
    backgroundColor: colors.highlight.teal,
    borderRadius: responsive.moderateScale(8),
  },
  viewDetailText: {
    color: colors.neutral.white,
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: colors.feedback.error + '15',
    borderColor: colors.feedback.error,
    borderWidth: 1,
  },
  conversationContainer: {
    marginBottom: responsiveSpacing.lg,
  },
  conversationTitle: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.sm,
  },
  messageContainer: {
    padding: responsiveSpacing.md,
    borderRadius: responsive.moderateScale(12),
    marginBottom: responsiveSpacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userMessage: {
    backgroundColor: colors.highlight.teal + '20',
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  aiMessage: {
    backgroundColor: colors.highlight.purple + '15',
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  messageText: {
    flex: 1,
    fontSize: responsiveFontSize.caption,
    lineHeight: responsiveFontSize.caption * 1.5,
  },
  userMessageText: {
    color: colors.primary.navy,
  },
  aiMessageText: {
    color: colors.primary.navy,
  },
  messageIcon: {
    marginHorizontal: responsiveSpacing.xs,
  },
  previewContainer: {
    marginBottom: responsiveSpacing.lg,
  },
  previewTitle: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.sm,
  },
  previewCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(12),
    padding: responsiveSpacing.md,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  previewRow: {
    flexDirection: 'row',
    marginBottom: responsiveSpacing.md,
  },
  previewInfo: {
    flex: 1,
    marginLeft: responsiveSpacing.sm,
  },
  previewLabel: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.label,
    marginBottom: responsiveSpacing.xs,
  },
  previewValue: {
    fontSize: responsiveFontSize.body,
    color: colors.primary.navy,
    fontWeight: '500',
  },
  previewSubValue: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginTop: responsiveSpacing.xs,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: responsiveSpacing.xs,
  },
  previewPrice: {
    fontSize: responsiveFontSize.caption,
    color: colors.highlight.teal,
    fontWeight: '600',
  },
  previewTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: responsiveSpacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  totalLabel: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
  },
  totalValue: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '700',
    color: colors.highlight.teal,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: responsiveSpacing.md,
    marginTop: responsiveSpacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: responsiveSpacing.md,
    borderRadius: responsive.moderateScale(8),
    backgroundColor: colors.neutral.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
  },
  confirmBtn: {
    flex: 1,
    borderRadius: responsive.moderateScale(8),
    overflow: 'hidden',
  },
  confirmGradient: {
    paddingVertical: responsiveSpacing.md,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.neutral.white,
  },
  missingFieldsContainer: {
    backgroundColor: colors.feedback.warning + '15',
    borderRadius: responsive.moderateScale(12),
    padding: responsiveSpacing.md,
    marginBottom: responsiveSpacing.lg,
    borderWidth: 1,
    borderColor: colors.feedback.warning,
  },
  missingFieldsTitle: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.sm,
  },
  missingFieldsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsiveSpacing.xs,
    marginBottom: responsiveSpacing.md,
  },
  missingFieldChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    paddingHorizontal: responsiveSpacing.sm,
    paddingVertical: responsiveSpacing.xs,
    borderRadius: responsive.moderateScale(16),
    gap: responsiveSpacing.xs,
  },
  missingFieldText: {
    fontSize: responsiveFontSize.caption,
    color: colors.feedback.warning,
    fontWeight: '500',
  },
  additionalInput: {
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(8),
    padding: responsiveSpacing.md,
    fontSize: responsiveFontSize.body,
    color: colors.primary.navy,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    minHeight: responsive.moderateScale(80),
    textAlignVertical: 'top',
    marginBottom: responsiveSpacing.md,
  },
  sendButton: {
    borderRadius: responsive.moderateScale(8),
    overflow: 'hidden',
  },
  sendGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveSpacing.md,
    gap: responsiveSpacing.xs,
  },
  sendButtonText: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.neutral.white,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral.white,
    paddingVertical: responsiveSpacing.md,
    borderRadius: responsive.moderateScale(8),
    marginTop: responsiveSpacing.md,
    gap: responsiveSpacing.sm,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  resetButtonText: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.highlight.teal,
  },
});

export default VoiceBookingScreen;
