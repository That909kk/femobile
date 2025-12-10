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
  Modal,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useVoiceBookingStore } from '../../../store/voiceBookingStore';
import { VoiceBookingStatus } from '../../../types/voiceBooking';
import { colors, responsive, responsiveSpacing, responsiveFontSize } from '../../../styles';

// Constants cho auto-stop
const SILENCE_THRESHOLD = -40; // dB - ngưỡng im lặng (âm thanh dưới mức này coi như im lặng)
const SILENCE_DURATION = 2000; // 2 giây im lặng liên tục thì tự dừng
const MIN_RECORDING_DURATION = 1500; // Tối thiểu 1.5 giây mới được tự dừng
const MAX_RECORDING_DURATION = 60000; // 60 giây tối đa
const METERING_INTERVAL = 200; // Kiểm tra mức âm thanh mỗi 200ms
const AUTO_RESTART_DELAY = 300; // Delay ngắn hơn trước khi auto-restart (300ms)

interface VoiceBookingScreenProps {}

const VoiceBookingScreen: React.FC<VoiceBookingScreenProps> = () => {
  const navigation = useNavigation();
  
  // Zustand store
  const {
    isRecording,
    isProcessing,
    currentStatus,
    currentRequestId,
    messages,
    transcript,
    missingFields,
    preview,
    bookingId,
    error,
    isConnected,
    startRecording,
    cancelRecording,
    stopRecording,
    continueWithAudio,
    continueWithText,
    confirmBooking,
    cancelBooking,
    resetConversation,
    connectWebSocket,
    disconnectWebSocket,
  } = useVoiceBookingStore();

  const [additionalText, setAdditionalText] = useState('');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isAutoStopped, setIsAutoStopped] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [shouldAutoRestart, setShouldAutoRestart] = useState(false);
  const [isPreparingRecording, setIsPreparingRecording] = useState(false);
  const [lastErrorTime, setLastErrorTime] = useState<number>(0);
  const [isRecordingLocal, setIsRecordingLocal] = useState(false); // Track recording state locally
  const [isPlayingAudioLocal, setIsPlayingAudioLocal] = useState(false); // Track audio playback

  // Timers
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const meteringIntervalRef = useRef<NodeJS.Timeout | null>(null); // Interval cho audio metering
  const silenceStartRef = useRef<number | null>(null); // Thời điểm bắt đầu im lặng
  const recordingStartTimeRef = useRef<number>(0); // Thời điểm bắt đầu ghi
  const scrollViewRef = useRef<ScrollView>(null);
  const hasCancelledRef = useRef(false);
  
  // Refs để track state trong closures (tránh stale closure)
  const isRecordingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const currentStatusRef = useRef<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null); // Track recording instance để cleanup

  // Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Spin animation khi đang processing (chờ response từ server)
  useEffect(() => {
    if (isProcessing) {
      // Start continuous spin animation
      spinAnim.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: (t) => t, // Linear easing
        })
      ).start();
    } else {
      // Stop spin
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [isProcessing]);

  // Request audio permissions khi mount
  // Sync refs với state để tránh stale closure trong callbacks
  useEffect(() => {
    isRecordingRef.current = isRecording || isRecordingLocal;
  }, [isRecording, isRecordingLocal]);
  
  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);
  
  useEffect(() => {
    currentStatusRef.current = currentStatus;
  }, [currentStatus]);

  useEffect(() => {
    // Reset cancel flag on mount
    hasCancelledRef.current = false;
    
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền microphone để sử dụng tính năng này');
      }
      
      // Set audio mode for iOS compatibility
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      // Connect WebSocket for realtime updates (optional - REST API fallback)
      connectWebSocket();
    })();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      clearAllTimers();
      
      // Disconnect WebSocket on unmount
      disconnectWebSocket();
      
      // Cancel booking only once on unmount using ref to prevent double cancel
      if (!hasCancelledRef.current && currentRequestId && currentStatus && 
          currentStatus !== 'COMPLETED' && currentStatus !== 'CANCELLED') {
        console.log('[VoiceBooking] Component unmounting, cancelling booking once...');
        hasCancelledRef.current = true;
        cancelBooking();
      }
    };
  }, []); // No dependencies - only runs on mount/unmount

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
    if (meteringIntervalRef.current) {
      clearInterval(meteringIntervalRef.current);
      meteringIntervalRef.current = null;
    }
    silenceStartRef.current = null;
  };

  useEffect(() => {
    // Use local state for immediate response
    const shouldAnimate = isRecordingLocal || isRecording;
    
    if (shouldAnimate) {
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
  }, [isRecordingLocal, isRecording]);

  // Play AI speech when available and handle auto-restart for PARTIAL
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    console.log('[VoiceBooking] Messages/Processing changed:', {
      totalMessages: messages.length,
      latestMessageType: latestMessage?.type,
      hasAudioUrl: !!latestMessage?.audioUrl,
      audioUrl: latestMessage?.audioUrl,
      status: latestMessage?.status,
      isRecording,
      isProcessing,
    });
    
    // Chỉ phát audio khi status là PARTIAL (cần bổ sung thông tin)
    // KHÔNG phát audio khi AWAITING_CONFIRMATION vì sẽ hiện modal
    if (latestMessage?.type === 'ai' && 
        latestMessage.audioUrl && 
        !isRecording && 
        !isProcessing &&
        latestMessage.status === 'PARTIAL') {
      console.log('[VoiceBooking] Will play audio for PARTIAL status');
      playAudioAndHandleStatus(latestMessage.audioUrl, latestMessage.status);
    } else if (latestMessage?.status === 'AWAITING_CONFIRMATION') {
      console.log('[VoiceBooking] Skipping audio for AWAITING_CONFIRMATION - modal will show');
    }
  }, [messages, isProcessing, isRecording]);

  // Show/hide confirmation modal based on status
  useEffect(() => {
    console.log('[VoiceBooking] Status/Preview changed:', { 
      currentStatus, 
      hasPreview: !!preview,
      willShowModal: currentStatus === 'AWAITING_CONFIRMATION'
    });
    
    // Hiển thị modal ngay khi status là AWAITING_CONFIRMATION
    // Không cần chờ preview (có thể preview sẽ được set sau hoặc optional)
    if (currentStatus === 'AWAITING_CONFIRMATION') {
      console.log('[VoiceBooking] Showing confirmation modal');
      setShowConfirmModal(true);
      // Vibrate để thông báo user
      Vibration.vibrate(50);
    } else {
      setShowConfirmModal(false);
    }
  }, [currentStatus, preview]);

  // Auto scroll to bottom when new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const playAudioAndHandleStatus = async (url: string, status?: VoiceBookingStatus) => {
    try {
      console.log('[VoiceBooking] Playing audio:', { url, status });
      
      // Stop current audio if playing
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      // Validate URL
      if (!url || typeof url !== 'string') {
        console.warn('[VoiceBooking] Invalid audio URL:', url);
        if (status === 'PARTIAL' && !isRecording && !isProcessing) {
          setTimeout(() => {
            handleStartRecording();
          }, 1000);
        }
        return;
      }

      // Validate URL format
      const urlLower = url.toLowerCase();
      if (!urlLower.startsWith('http://') && !urlLower.startsWith('https://')) {
        console.error('[VoiceBooking] Audio URL must start with http:// or https://:', url);
        Alert.alert('Lỗi phát audio', 'URL âm thanh không hợp lệ');
        if (status === 'PARTIAL' && !isRecording && !isProcessing) {
          setTimeout(() => {
            handleStartRecording();
          }, 1000);
        }
        return;
      }

      console.log('[VoiceBooking] Audio URL is valid, loading...');

      // Set audio mode to playback for iOS trước khi load audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Mark as playing BEFORE loading for immediate UI response
      setIsPlayingAudioLocal(true);

      // Load và play ngay lập tức (không chờ buffer hết)
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { 
          shouldPlay: true,
          progressUpdateIntervalMillis: 100, // Update mượt hơn
        },
        (playbackStatus) => {
          if (playbackStatus.isLoaded) {
            if (playbackStatus.didJustFinish) {
              console.log('[VoiceBooking] ✅ Audio finished playing, status:', currentStatusRef.current);
              setIsPlayingAudioLocal(false);
              newSound.unloadAsync();
              setSound(null);
              
              // Auto-restart recording SAU KHI audio phát xong
              // Chỉ khi PARTIAL - KHÔNG auto-start khi AWAITING_CONFIRMATION
              const shouldAutoStart = currentStatusRef.current === 'PARTIAL' && 
                                      !isRecordingRef.current && 
                                      !isProcessingRef.current;
              
              console.log('[VoiceBooking] Should auto-start recording:', shouldAutoStart);
              
              if (shouldAutoStart) {
                // Reset audio mode for recording
                Audio.setAudioModeAsync({
                  allowsRecordingIOS: true,
                  playsInSilentModeIOS: true,
                  staysActiveInBackground: false,
                  shouldDuckAndroid: true,
                  playThroughEarpieceAndroid: false,
                }).then(() => {
                  // Haptic feedback nhẹ để báo sẵn sàng ghi
                  Vibration.vibrate(10);
                  // Delay ngắn để mượt hơn
                  setTimeout(() => {
                    console.log('[VoiceBooking] 🎤 Auto-starting recording after audio finished');
                    handleStartRecording();
                  }, AUTO_RESTART_DELAY);
                });
              }
            }
          } else if (playbackStatus.error) {
            console.error('[VoiceBooking] Audio playback error:', playbackStatus.error);
            setIsPlayingAudioLocal(false);
          }
        }
      );
      
      setSound(newSound);
      console.log('[VoiceBooking] Audio loaded and playing successfully');
      
    } catch (error: any) {
      console.error('[VoiceBooking] Error playing audio:', error);
      console.error('[VoiceBooking] Error details:', {
        message: error?.message,
        code: error?.code,
        domain: error?.domain,
        url: url,
      });
      
      // Reset playing state
      setIsPlayingAudioLocal(false);
      
      // Không hiện alert - chỉ log lỗi để UX mượt hơn
      // Lỗi -1100 thường do URL TTS hết hạn hoặc backend issue
      const errorMessage = error?.message || '';
      const isUrlError = errorMessage.includes('-1100') || errorMessage.includes('NSURLErrorDomain');
      
      if (isUrlError) {
        console.warn('[VoiceBooking] TTS audio URL expired or unavailable, continuing without audio');
      }
      
      // Reset audio mode back to recording
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (audioModeError) {
        console.error('[VoiceBooking] Error resetting audio mode:', audioModeError);
      }
      
      // Khi PARTIAL và audio fail, tự động bắt đầu ghi âm
      // Dùng refs để check state chính xác
      const shouldAutoStart = currentStatusRef.current === 'PARTIAL' && 
                              !isRecordingRef.current && 
                              !isProcessingRef.current;
      
      if (shouldAutoStart) {
        console.log('[VoiceBooking] Audio failed for PARTIAL, auto-starting recording after delay');
        // Haptic để báo sẵn sàng
        Vibration.vibrate(10);
        setTimeout(() => {
          // Double check với refs
          if (!isRecordingRef.current && !isProcessingRef.current && currentStatusRef.current === 'PARTIAL') {
            handleStartRecording();
          }
        }, 1000); // 1s để user đọc text
      }
    }
  };

  // Tắt audio đang phát và bắt đầu ghi âm ngay
  const stopAudioAndStartRecording = async () => {
    console.log('[VoiceBooking] User interrupted audio to start recording');
    
    // Tắt audio ngay lập tức
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (e) {
        console.warn('[VoiceBooking] Error stopping audio:', e);
      }
      setSound(null);
    }
    setIsPlayingAudioLocal(false);
    
    // Haptic feedback
    Vibration.vibrate(50);
    
    // Reset audio mode và bắt đầu ghi âm
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (e) {
      console.warn('[VoiceBooking] Error setting audio mode:', e);
    }
    
    // Bắt đầu ghi âm ngay
    setTimeout(() => {
      handleStartRecording();
    }, 100);
  };

  const handleStartRecording = async () => {
    // Prevent concurrent recording preparation
    if (isPreparingRecording) {
      console.warn('[VoiceBooking] Already preparing recording, skipping...');
      return;
    }

    // Nếu đang processing, không start recording
    if (isProcessing) {
      console.log('[VoiceBooking] Still processing, skip start recording');
      return;
    }

    try {
      setIsPreparingRecording(true);
      setIsAutoStopped(false);
      setRecordingDuration(0);

      // CRITICAL: Force cleanup TẤT CẢ recording có thể tồn tại
      // 1. Cleanup from state
      if (recording) {
        console.log('[VoiceBooking] Cleaning up recording from state...');
        try {
          const status = await recording.getStatusAsync();
          if (status.isRecording) {
            await recording.stopAndUnloadAsync();
          } else if (status.canRecord) {
            await recording.stopAndUnloadAsync();
          }
        } catch (e) {
          // Ignore - may already be unloaded
        }
        setRecording(null);
      }
      
      // 2. Cleanup from ref (backup)
      if (recordingRef.current) {
        console.log('[VoiceBooking] Cleaning up recording from ref...');
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (e) {
          // Ignore
        }
        recordingRef.current = null;
      }
      
      // 3. Đợi đủ lâu để iOS hoàn toàn release recording resource
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stop any playing audio
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (e) {
          // Ignore
        }
        setSound(null);
        setIsPlayingAudioLocal(false);
      }

      // Clear all timers
      clearAllTimers();

      // Set audio mode for recording (especially important for iOS)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Đợi thêm để audio mode được apply
      await new Promise(resolve => setTimeout(resolve, 200));

      console.log('[VoiceBooking] Creating new recording...');
      
      // Haptic feedback khi bắt đầu ghi
      Vibration.vibrate(10);
      
      // Create recording với metering enabled để detect silence
      const recordingOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true, // Enable metering để kiểm tra mức âm thanh
      };
      
      const result = await Audio.Recording.createAsync(recordingOptions);
      const newRecording = result.recording;
      
      console.log('[VoiceBooking] New recording created successfully');
      
      // Save to both state and ref
      setRecording(newRecording);
      recordingRef.current = newRecording;
      setIsRecordingLocal(true);
      
      // Call store action to update recording state
      startRecording();

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

    } catch (error: any) {
      console.error('[VoiceBooking] Error starting recording:', error);
      
      // Reset recording states (both local and store)
      setIsRecordingLocal(false);
      cancelRecording();
      setRecording(null);
      clearAllTimers();
      
      // Không hiện alert - chỉ log, để UX mượt
      // User có thể thử lại bằng cách nhấn nút mic
    } finally {
      // Reset flag
      setIsPreparingRecording(false);
    }
  };

  const monitorAudioLevels = async (rec: Audio.Recording) => {
    // Sử dụng audio metering thực sự để phát hiện im lặng
    recordingStartTimeRef.current = Date.now();
    silenceStartRef.current = null;
    
    // Interval kiểm tra mức âm thanh
    meteringIntervalRef.current = setInterval(async () => {
      try {
        // Kiểm tra xem recording còn valid không
        if (!rec || !recordingRef.current) {
          console.log('[VoiceBooking] Recording no longer valid, stopping metering');
          if (meteringIntervalRef.current) {
            clearInterval(meteringIntervalRef.current);
            meteringIntervalRef.current = null;
          }
          return;
        }
        
        const status = await rec.getStatusAsync();
        
        if (!status.isRecording) {
          console.log('[VoiceBooking] Recording stopped, clearing metering');
          if (meteringIntervalRef.current) {
            clearInterval(meteringIntervalRef.current);
            meteringIntervalRef.current = null;
          }
          return;
        }
        
        const elapsedTime = Date.now() - recordingStartTimeRef.current;
        const metering = status.metering ?? -160; // -160 nếu không có metering
        
        // Log để debug
        // console.log(`[VoiceBooking] Metering: ${metering}dB, elapsed: ${elapsedTime}ms`);
        
        // Chỉ kiểm tra silence sau MIN_RECORDING_DURATION
        if (elapsedTime < MIN_RECORDING_DURATION) {
          return;
        }
        
        // Kiểm tra có im lặng không
        if (metering < SILENCE_THRESHOLD) {
          // Đang im lặng
          if (!silenceStartRef.current) {
            silenceStartRef.current = Date.now();
            console.log('[VoiceBooking] Silence started...');
          } else {
            const silenceDuration = Date.now() - silenceStartRef.current;
            
            if (silenceDuration >= SILENCE_DURATION) {
              console.log(`[VoiceBooking] Silence detected for ${silenceDuration}ms - auto stopping`);
              if (meteringIntervalRef.current) {
                clearInterval(meteringIntervalRef.current);
                meteringIntervalRef.current = null;
              }
              setIsAutoStopped(true);
              handleStopRecording(true);
            }
          }
        } else {
          // Có âm thanh - reset silence timer
          if (silenceStartRef.current) {
            console.log('[VoiceBooking] Sound detected, resetting silence timer');
            silenceStartRef.current = null;
          }
        }
      } catch (error) {
        // Recording có thể đã bị unload
        console.log('[VoiceBooking] Metering error (recording may be unloaded):', error);
        if (meteringIntervalRef.current) {
          clearInterval(meteringIntervalRef.current);
          meteringIntervalRef.current = null;
        }
      }
    }, METERING_INTERVAL);
  };

  const handleStopRecording = async (autoStopped = false) => {
    // Lưu reference và reset state ngay lập tức để tránh race condition
    const currentRecording = recording || recordingRef.current;
    
    // Clear timers và reset states ngay
    clearAllTimers();
    setIsRecordingLocal(false);
    setRecording(null);
    recordingRef.current = null; // Clear ref
    setRecordingDuration(0);

    if (!currentRecording) {
      // Không có recording thực sự - reset store state
      cancelRecording();
      return;
    }

    try {
      // Haptic feedback khi dừng
      Vibration.vibrate(10);

      // Get the audio file URI before stopping
      const uri = currentRecording.getURI();
      
      // Stop and unload recording
      try {
        await currentRecording.stopAndUnloadAsync();
      } catch (unloadError: any) {
        // Ignore "already unloaded" error
        if (!unloadError?.message?.includes('already been unloaded')) {
          console.warn('[VoiceBooking] Error unloading recording:', unloadError);
        }
      }

      if (!uri) {
        console.warn('[VoiceBooking] No recording URI');
        cancelRecording();
        return;
      }

      // Create File object for React Native (not blob)
      const audioFile = {
        uri: uri,
        type: 'audio/m4a', // expo-av default format
        name: `voice_${Date.now()}.m4a`,
      } as any;

      // Send to backend via store
      // If we have a requestId, continue with audio; otherwise create new
      if (currentRequestId && (currentStatus === 'PARTIAL' || currentStatus === 'AWAITING_CONFIRMATION')) {
        await continueWithAudio(audioFile);
      } else {
        await stopRecording(audioFile);
      }

      if (autoStopped) {
        // Show auto-stop message
        setTimeout(() => {
          setIsAutoStopped(false);
        }, 3000);
      }

    } catch (error: any) {
      console.error('[VoiceBooking] Error processing recording:', error);
      cancelRecording();
      // Không hiện alert để UX mượt hơn - user có thể thử lại
    }
  };

  const handleContinueWithText = () => {
    if (!additionalText.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập thông tin bổ sung');
      return;
    }
    
    continueWithText(additionalText.trim());
    setAdditionalText('');
  };

  const handleConfirm = () => {
    setShowConfirmModal(false);
    confirmBooking();
  };

  const handleCancelBooking = () => {
    setShowConfirmModal(false);
    cancelBooking();
    resetConversation();
  };

  const handleReset = () => {
    resetConversation();
    setAdditionalText('');
  };

  const handleGoBack = () => {
    // Nếu có voice booking đang active (chưa COMPLETED), confirm trước khi thoát
    if (currentRequestId && currentStatus && currentStatus !== 'COMPLETED' && currentStatus !== 'CANCELLED') {
      Alert.alert(
        'Xác nhận thoát',
        'Bạn có yêu cầu đặt lịch đang xử lý. Thoát ra sẽ hủy yêu cầu này. Bạn có chắc chắn muốn thoát?',
        [
          { text: 'Ở lại', style: 'cancel' },
          {
            text: 'Thoát',
            style: 'destructive',
            onPress: async () => {
              // Gọi /cancel trước
              await cancelBooking();
              // Reset toàn bộ state
              resetConversation();
              // Thoát khỏi màn hình
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      // Không có request đang xử lý, reset và thoát
      resetConversation();
      navigation.goBack();
    }
  };

  const renderStatusMessage = () => {
    const latestMessage = messages[messages.length - 1];
    
    if (currentStatus === 'COMPLETED' && bookingId) {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark-circle" size={64} color={colors.feedback.success} />
          <Text style={styles.successTitle}>🎉 Đặt lịch thành công!</Text>
          <Text style={styles.statusSubtext}>Mã đặt lịch: {bookingId}</Text>
          
          <View style={styles.successButtonsContainer}>
            <TouchableOpacity
              style={[styles.successButton, styles.primaryButton]}
              onPress={() => (navigation as any).navigate('OrderDetail', { bookingId })}
            >
              <Ionicons name="document-text" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Xem chi tiết</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.successButton, styles.secondaryButton]}
              onPress={() => {
                resetConversation();
                // Navigate về MainTabs (tab navigator) và focus vào tab CustomerHome
                (navigation as any).reset({
                  index: 0,
                  routes: [{ name: 'MainTabs' }],
                });
              }}
            >
              <Ionicons name="home" size={20} color={colors.highlight.teal} />
              <Text style={styles.secondaryButtonText}>Về trang chủ</Text>
            </TouchableOpacity>
          </View>
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

    // Đang phát audio - cho phép người dùng nhấn để tắt và ghi âm
    if (isPlayingAudioLocal) {
      return (
        <View style={styles.statusContainer}>
          <View style={styles.statusHeader}>
            <Ionicons name="volume-high" size={24} color={colors.highlight.purple} />
            <Text style={styles.statusText}>🔊 Đang phát...</Text>
          </View>
          <Text style={styles.statusSubtext}>Nhấn nút mic để tắt và trả lời ngay</Text>
        </View>
      );
    }

    // Đang chuẩn bị recording
    if (isPreparingRecording) {
      return (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="small" color={colors.highlight.teal} />
          <Text style={styles.statusText}>🎤 Đang chuẩn bị...</Text>
          <Text style={styles.statusSubtext}>Chuẩn bị ghi âm</Text>
        </View>
      );
    }

    if (isRecording || isRecordingLocal) {
      return (
        <View style={styles.statusContainer}>
          <View style={styles.statusHeader}>
            <View style={styles.recordingIndicator} />
            <Text style={styles.statusText}>🎤 Đang lắng nghe...</Text>
          </View>
          <Text style={styles.statusSubtext}>
            {isAutoStopped 
              ? '✓ Đang xử lý...'
              : `Hãy nói rõ ràng (${recordingDuration}s)`
            }
          </Text>
        </View>
      );
    }

    if (isProcessing) {
      return (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="small" color={colors.highlight.teal} />
          <Text style={styles.statusText}>⚡ Đang xử lý...</Text>
          <Text style={styles.statusSubtext}>Vui lòng chờ trong giây lát</Text>
        </View>
      );
    }

    if (currentStatus === 'PARTIAL' && latestMessage) {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="alert-circle-outline" size={24} color={colors.feedback.warning} />
          <Text style={styles.statusText}>💬 Cần thêm thông tin</Text>
          <Text style={styles.statusSubtext}>Hãy bổ sung thêm chi tiết</Text>
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

    // Determine button state and action
    const isCurrentlyRecording = isRecordingLocal || isRecording;
    const isCurrentlyPlaying = isPlayingAudioLocal;
    
    // Determine what happens when button is pressed
    const handleButtonPress = () => {
      if (isCurrentlyRecording) {
        // Đang ghi âm → dừng ghi âm
        handleStopRecording(false);
      } else if (isCurrentlyPlaying) {
        // Đang phát audio → tắt audio và bắt đầu ghi âm
        stopAudioAndStartRecording();
      } else {
        // Idle → bắt đầu ghi âm
        handleStartRecording();
      }
    };

    // Determine button appearance
    const getButtonColors = (): [string, string] => {
      if (isCurrentlyRecording) {
        return ['#D64545', '#F6C343']; // Đỏ - đang ghi
      } else if (isCurrentlyPlaying) {
        return ['#8B5CF6', '#F59E0B']; // Tím/cam - đang phát audio (nhấn để tắt và ghi)
      }
      return ['#1BB5A6', '#8B5CF6']; // Xanh - sẵn sàng
    };

    const getButtonIcon = () => {
      if (isCurrentlyRecording) {
        return 'stop';
      } else if (isCurrentlyPlaying) {
        return 'mic'; // Show mic icon để user biết nhấn sẽ bắt đầu ghi âm
      }
      return 'mic';
    };

    return (
      <View style={styles.recordButtonContainer}>
        {/* Wave effect khi đang ghi âm - use local state for immediate response */}
        {isCurrentlyRecording && (
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

        {/* Pulse effect khi đang phát audio */}
        {isCurrentlyPlaying && (
          <Animated.View
            style={[
              styles.playingIndicator,
              {
                opacity: waveOpacity,
              },
            ]}
          />
        )}

        {/* Spin ring khi đang processing */}
        {isProcessing && (
          <Animated.View
            style={[
              styles.processingRing,
              {
                transform: [{
                  rotate: spinAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  })
                }],
              },
            ]}
          />
        )}

        <Animated.View
          style={[
            styles.recordButtonWrapper,
            {
              transform: [{ scale: isCurrentlyRecording ? pulseAnim : 1 }],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.recordButton, (isProcessing || isPreparingRecording) && styles.buttonDisabled]}
            onPress={handleButtonPress}
            activeOpacity={0.8}
            disabled={isProcessing || isPreparingRecording}
          >
            <LinearGradient
              colors={isProcessing ? ['#6366F1', '#8B5CF6'] : (isPreparingRecording ? ['#9CA3AF', '#6B7280'] : getButtonColors())}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.recordGradient}
            >
              {isPreparingRecording ? (
                <ActivityIndicator size="large" color={colors.neutral.white} />
              ) : isProcessing ? (
                <Ionicons
                  name="ellipsis-horizontal"
                  size={responsive.moderateScale(48)}
                  color={colors.neutral.white}
                />
              ) : (
                <Ionicons
                  name={getButtonIcon()}
                  size={responsive.moderateScale(48)}
                  color={colors.neutral.white}
                />
              )}
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
          onPress={handleGoBack}
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
          <Text style={styles.assistantTitle}>AI HomeMate Assistant</Text>
          <Text style={styles.assistantSubtitle}>Trợ lý thông minh từ HomeMate</Text>
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

      {/* Record Button - ẩn khi đã hoàn thành */}
      {currentStatus !== 'COMPLETED' && (
        <View style={styles.bottomContainer}>
          {renderRecordButton()}
        </View>
      )}

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Close button - luôn hiển thị để user có thể đóng modal */}
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowConfirmModal(false)}
            >
              <Ionicons name="close-circle" size={32} color={colors.neutral.textSecondary} />
            </TouchableOpacity>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Ionicons name="checkmark-circle" size={48} color={colors.highlight.teal} />
                <Text style={styles.modalTitle}>Xác nhận đặt lịch</Text>
                <Text style={styles.modalSubtitle}>Vui lòng kiểm tra thông tin trước khi xác nhận</Text>
              </View>

              {preview ? (
                <View style={styles.modalContent}>
                  {/* Địa chỉ */}
                  <View style={styles.previewRow}>
                    <Ionicons name="location" size={24} color={colors.highlight.teal} />
                    <View style={styles.previewInfo}>
                      <Text style={styles.previewLabel}>Địa chỉ:</Text>
                      <Text style={styles.previewValue}>
                        {preview.fullAddress || preview.address || 'Chưa có thông tin địa chỉ'}
                      </Text>
                      {preview.ward && preview.city && (
                        <Text style={styles.previewSubValue}>{preview.ward}, {preview.city}</Text>
                      )}
                    </View>
                  </View>

                  {/* Thời gian */}
                  <View style={styles.previewRow}>
                    <Ionicons name="time" size={24} color={colors.highlight.teal} />
                    <View style={styles.previewInfo}>
                      <Text style={styles.previewLabel}>Thời gian:</Text>
                      <Text style={styles.previewValue}>
                        {preview.bookingTime 
                          ? new Date(preview.bookingTime).toLocaleString('vi-VN', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Chưa có thông tin thời gian'}
                      </Text>
                    </View>
                  </View>

                  {/* Dịch vụ */}
                  {preview.services && preview.services.length > 0 ? (
                    <View style={styles.previewRow}>
                      <Ionicons name="briefcase" size={24} color={colors.highlight.teal} />
                      <View style={styles.previewInfo}>
                        <Text style={styles.previewLabel}>Dịch vụ:</Text>
                        {preview.services.map((service, index) => (
                          <View key={index} style={styles.serviceItem}>
                            <Text style={styles.previewValue}>
                              • {service.serviceName || 'Dịch vụ'} x{service.quantity || 1}
                            </Text>
                            <Text style={styles.previewPrice}>
                              {service.subtotalFormatted || 
                               (service.subtotal ? `${service.subtotal.toLocaleString('vi-VN')}đ` : 
                               (service.unitPrice ? `${(service.unitPrice * (service.quantity || 1)).toLocaleString('vi-VN')}đ` : ''))}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.previewRow}>
                      <Ionicons name="briefcase" size={24} color={colors.highlight.teal} />
                      <View style={styles.previewInfo}>
                        <Text style={styles.previewLabel}>Dịch vụ:</Text>
                        <Text style={styles.previewValue}>Chưa có thông tin dịch vụ</Text>
                      </View>
                    </View>
                  )}

                  {/* Ghi chú */}
                  {preview.note && (
                    <View style={styles.previewRow}>
                      <Ionicons name="document-text" size={24} color={colors.highlight.teal} />
                      <View style={styles.previewInfo}>
                        <Text style={styles.previewLabel}>Ghi chú:</Text>
                        <Text style={styles.previewValue}>{preview.note}</Text>
                      </View>
                    </View>
                  )}

                  {/* Tổng tiền */}
                  <View style={styles.modalTotal}>
                    <Text style={styles.totalLabel}>Tổng cộng:</Text>
                    <Text style={styles.totalValue}>
                      {preview.formattedTotalAmount || preview.totalAmountFormatted || 
                       (preview.totalAmount ? `${preview.totalAmount.toLocaleString('vi-VN')}đ` : '0đ')}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.modalContent}>
                  <Text style={styles.previewValue}>Đang tải thông tin đặt lịch...</Text>
                </View>
              )}

              {/* Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalCancelBtn} 
                  onPress={handleCancelBooking}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelBtnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.modalConfirmBtn,
                    !preview && styles.modalConfirmBtnDisabled
                  ]} 
                  onPress={handleConfirm}
                  activeOpacity={0.7}
                  disabled={!preview}
                >
                  <LinearGradient
                    colors={preview ? ['#1BB5A6', '#8B5CF6'] : ['#999', '#666']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalConfirmGradient}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={colors.neutral.white} />
                    <Text style={styles.modalConfirmBtnText}>
                      {preview ? 'Xác nhận đặt lịch' : 'Đang tải...'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  playingIndicator: {
    position: 'absolute',
    width: responsive.moderateScale(160),
    height: responsive.moderateScale(160),
    borderRadius: responsive.moderateScale(80),
    backgroundColor: colors.highlight.purple,
    opacity: 0.2,
  },
  processingRing: {
    position: 'absolute',
    width: responsive.moderateScale(150),
    height: responsive.moderateScale(150),
    borderRadius: responsive.moderateScale(75),
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: colors.highlight.purple,
    borderRightColor: colors.highlight.teal,
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
  buttonDisabled: {
    opacity: 0.7,
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
  // Success screen styles
  successTitle: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '700',
    color: colors.feedback.success,
    marginTop: responsiveSpacing.md,
    marginBottom: responsiveSpacing.xs,
  },
  successButtonsContainer: {
    flexDirection: 'column',
    gap: responsiveSpacing.sm,
    marginTop: responsiveSpacing.lg,
    width: '100%',
    paddingHorizontal: responsiveSpacing.lg,
  },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveSpacing.md,
    paddingHorizontal: responsiveSpacing.lg,
    borderRadius: responsive.moderateScale(12),
    gap: responsiveSpacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.highlight.teal,
  },
  primaryButtonText: {
    color: colors.neutral.white,
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.neutral.white,
    borderWidth: 2,
    borderColor: colors.highlight.teal,
  },
  secondaryButtonText: {
    color: colors.highlight.teal,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: responsive.moderateScale(24),
    borderTopRightRadius: responsive.moderateScale(24),
    maxHeight: '85%',
    paddingTop: responsiveSpacing.lg,
    paddingHorizontal: responsiveSpacing.lg,
    paddingBottom: responsiveSpacing.xl,
  },
  modalCloseButton: {
    position: 'absolute',
    top: responsiveSpacing.md,
    right: responsiveSpacing.md,
    zIndex: 10,
    padding: responsiveSpacing.xs,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: responsiveSpacing.xl,
  },
  modalTitle: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '700',
    color: colors.primary.navy,
    marginTop: responsiveSpacing.md,
    marginBottom: responsiveSpacing.xs,
  },
  modalSubtitle: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },
  modalContent: {
    backgroundColor: colors.neutral.background,
    borderRadius: responsive.moderateScale(16),
    padding: responsiveSpacing.md,
    marginBottom: responsiveSpacing.lg,
  },
  modalTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: responsiveSpacing.md,
    marginTop: responsiveSpacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.highlight.teal,
  },
  modalButtons: {
    gap: responsiveSpacing.md,
  },
  modalCancelBtn: {
    paddingVertical: responsiveSpacing.md,
    borderRadius: responsive.moderateScale(12),
    backgroundColor: colors.neutral.border,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
  },
  modalConfirmBtn: {
    borderRadius: responsive.moderateScale(12),
    overflow: 'hidden',
  },
  modalConfirmBtnDisabled: {
    opacity: 0.6,
  },
  modalConfirmGradient: {
    flexDirection: 'row',
    paddingVertical: responsiveSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsiveSpacing.sm,
  },
  modalConfirmBtnText: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.neutral.white,
  },
});

export default VoiceBookingScreen;
