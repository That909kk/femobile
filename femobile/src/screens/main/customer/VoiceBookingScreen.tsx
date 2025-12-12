import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useVoiceBookingStore } from '../../../store/voiceBookingStore';
import { VoiceBookingStatus } from '../../../types/voiceBooking';
import { colors, responsive, responsiveSpacing, responsiveFontSize } from '../../../styles';
import { bookingService } from '../../../services/bookingService';
import voiceBookingService from '../../../services/voiceBookingService';

// Constants cho recording - TẮT auto-stop, user tự kiểm soát (giống web)
const MIN_RECORDING_DURATION = 2000; // Tối thiểu 2 giây trước khi cho phép stop
const MAX_RECORDING_DURATION = 60000; // 60 giây tối đa

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
    addAIMessage,
  } = useVoiceBookingStore();

  const [textInput, setTextInput] = useState('');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isPreparingRecording, setIsPreparingRecording] = useState(false);
  const [isRecordingLocal, setIsRecordingLocal] = useState(false);
  const [isPlayingAudioLocal, setIsPlayingAudioLocal] = useState(false);
  const [isSendingText, setIsSendingText] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmedBookingDetails, setConfirmedBookingDetails] = useState<any>(null);
  const [loadingBookingDetails, setLoadingBookingDetails] = useState(false);
  const [confirmingBooking, setConfirmingBooking] = useState(false);
  const [additionalText, setAdditionalText] = useState('');
  const [isAutoStopped, setIsAutoStopped] = useState(false);

  // Track audio đã phát để không phát lại
  const playedAudioIdsRef = useRef<Set<string>>(new Set());

  // Timers
  const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);
  const hasCancelledRef = useRef(false);
  
  // Refs để track state trong closures (tránh stale closure)
  const isRecordingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const currentStatusRef = useRef<string | null>(null);
  const currentRequestIdRef = useRef<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Sync refs với state (giống web)
  useEffect(() => {
    currentStatusRef.current = currentStatus;
    currentRequestIdRef.current = currentRequestId;
  }, [currentStatus, currentRequestId]);

  // Sync sound vào ref để cleanup đúng
  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  // Sync recording vào ref để cleanup đúng
  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

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
    // Clear played audio tracking
    playedAudioIdsRef.current.clear();
    // Reset local states
    setConfirmedBookingDetails(null);
    setIsPlayingAudioLocal(false);
    setIsRecordingLocal(false);
    setShowConfirmModal(false);
    
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
      
      // Add greeting message giống web (chỉ khi chưa có message)
      if (messages.length === 0) {
        addAIMessage('Xin chào! Tôi là trợ lý AI của Home Mate. Bạn muốn đặt dịch vụ gì hôm nay? Chúng tôi hiện có Dọn dẹp theo giờ, Tổng vệ sinh, Vệ sinh Sofa - Nệm - Rèm, Vệ sinh máy lạnh, Giặt sấy theo kg, Giặt hấp cao cấp, Nấu ăn gia đình, Đi chợ hộ. Hãy nói với tôi nhé!');
      }
    })();

    return () => {
      // Tắt audio ngay lập tức (dùng ref để có giá trị mới nhất)
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
      }
      
      // Dừng recording nếu đang ghi
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
      
      // Clear tất cả timers
      clearAllTimers();
      
      // Disconnect WebSocket on unmount
      disconnectWebSocket();
      
      // Cancel booking (dùng ref để có giá trị mới nhất - giống web)
      if (!hasCancelledRef.current && 
          currentRequestIdRef.current && 
          currentStatusRef.current && 
          currentStatusRef.current !== 'COMPLETED' && 
          currentStatusRef.current !== 'CANCELLED') {
        hasCancelledRef.current = true;
        cancelBooking();
      }
    };
  }, []); // No dependencies - only runs on mount/unmount

  // Clear all timers
  const clearAllTimers = () => {
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

  // Play AI speech when available - giống web, phát audio cho cả PARTIAL và AWAITING_CONFIRMATION
  // Chỉ phát mỗi audio 1 lần duy nhất
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    const isCurrentlyRecording = isRecordingLocal || isRecording;
    
    // Chỉ phát audio khi:
    // 1. Là message AI với audioUrl
    // 2. Chưa phát audio này trước đó (check bằng message ID)
    // 3. Không đang ghi âm, không đang xử lý, không đang phát audio khác
    // 4. Status là PARTIAL hoặc AWAITING_CONFIRMATION
    if (latestMessage?.type === 'ai' && 
        latestMessage.audioUrl && 
        latestMessage.id &&
        !playedAudioIdsRef.current.has(latestMessage.id) &&
        !isCurrentlyRecording && 
        !isProcessing &&
        !isPlayingAudioLocal &&
        (latestMessage.status === 'PARTIAL' || latestMessage.status === 'AWAITING_CONFIRMATION')) {
      
      // Đánh dấu đã phát audio này
      playedAudioIdsRef.current.add(latestMessage.id);
      
      playAudio(latestMessage.audioUrl, latestMessage.status === 'AWAITING_CONFIRMATION');
    }
  }, [messages, isProcessing, isRecording, isRecordingLocal, isPlayingAudioLocal]);

  // Show/hide confirmation modal based on status - modal chỉ hiện sau khi audio phát xong
  // hoặc hiện ngay nếu không có audio
  useEffect(() => {
    // Nếu status là AWAITING_CONFIRMATION và không đang phát audio, hiện modal ngay
    // (trường hợp không có audio URL hoặc audio đã phát xong)
    if (currentStatus === 'AWAITING_CONFIRMATION' && !isPlayingAudioLocal) {
      const latestMessage = messages[messages.length - 1];
      // Nếu message mới nhất không có audio, hiện modal ngay
      if (!latestMessage?.audioUrl) {
        setShowConfirmModal(true);
        Vibration.vibrate(50);
      }
      // Nếu có audio nhưng không đang phát (đã phát xong), hiện modal
      else if (!isPlayingAudioLocal) {
        // Delay một chút để đảm bảo audio state đã cập nhật
        setTimeout(() => {
          if (!isPlayingAudioLocal) {
            setShowConfirmModal(true);
            Vibration.vibrate(50);
          }
        }, 300);
      }
    } else if (currentStatus !== 'AWAITING_CONFIRMATION') {
      setShowConfirmModal(false);
    }
  }, [currentStatus, preview, isPlayingAudioLocal, messages]);

  // Fetch booking details khi COMPLETED - giống web
  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (currentStatus === 'COMPLETED' && bookingId && !confirmedBookingDetails) {
        setLoadingBookingDetails(true);
        try {
          const response = await bookingService.getBookingById(bookingId);
          setConfirmedBookingDetails(response);
        } catch (error) {
          // Vẫn hiện success screen dù không lấy được chi tiết
        } finally {
          setLoadingBookingDetails(false);
        }
      }
    };
    
    fetchBookingDetails();
  }, [currentStatus, bookingId, confirmedBookingDetails]);

  // Auto scroll to bottom when new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Play audio đơn giản - giống web, hiện modal sau khi audio phát xong (nếu là AWAITING_CONFIRMATION)
  const playAudio = useCallback(async (url: string, showModalAfter: boolean = false) => {
    try {
      // Stop current audio if playing
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      // Validate URL
      if (!url || typeof url !== 'string') {
        console.warn('[VoiceBooking] Invalid audio URL:', url);
        // Nếu không có audio hợp lệ và cần hiện modal, hiện ngay
        if (showModalAfter) {
          setShowConfirmModal(true);
          Vibration.vibrate(50);
        }
        return;
      }

      const urlLower = url.toLowerCase();
      if (!urlLower.startsWith('http://') && !urlLower.startsWith('https://')) {
        console.error('[VoiceBooking] Audio URL must start with http:// or https://');
        // Graceful fallback - hiện modal nếu cần
        if (showModalAfter) {
          setShowConfirmModal(true);
          Vibration.vibrate(50);
        }
        return;
      }

      // Set audio mode to playback for iOS
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      setIsPlayingAudioLocal(true);

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, progressUpdateIntervalMillis: 100 },
        (playbackStatus) => {
          if (playbackStatus.isLoaded) {
            if (playbackStatus.didJustFinish) {
              setIsPlayingAudioLocal(false);
              newSound.unloadAsync();
              setSound(null);
              
              // Reset audio mode for potential recording
              Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
              });
              
              // Sau khi audio phát xong, hiện modal nếu là AWAITING_CONFIRMATION (giống web)
              if (showModalAfter) {
                setTimeout(() => {
                  setShowConfirmModal(true);
                  Vibration.vibrate(50);
                }, 300);
              }
            }
          } else if (playbackStatus.error) {
            setIsPlayingAudioLocal(false);
            // Graceful fallback - hiện modal nếu cần
            if (showModalAfter) {
              setShowConfirmModal(true);
              Vibration.vibrate(50);
            }
          }
        }
      );
      
      setSound(newSound);
      
    } catch (error: any) {
      console.error('[VoiceBooking] Error playing audio:', error);
      setIsPlayingAudioLocal(false);
      
      // Graceful fallback - hiện modal nếu cần (giống web)
      if (showModalAfter) {
        setShowConfirmModal(true);
        Vibration.vibrate(50);
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
    }
  }, [sound]);

  // Tắt audio đang phát (KHÔNG tự động ghi âm - giống web)
  const stopAudioPlayback = async () => {
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
    
    // Reset audio mode để sẵn sàng cho recording
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
    
    // KHÔNG tự động ghi âm - người dùng phải nhấn mic lần nữa
  };

  // Handler gửi text bổ sung (giống web)
  const handleSendText = async () => {
    if (!textInput.trim() || isSendingText) return;

    const userText = textInput.trim();
    setTextInput('');
    setIsSendingText(true);
    Keyboard.dismiss();

    try {
      if (currentRequestId && (currentStatus === 'PARTIAL' || currentStatus === 'AWAITING_CONFIRMATION')) {
        await continueWithText(userText);
      } else {
        // Chưa có requestId - thông báo cần nói trước
        Alert.alert(
          'Thông báo',
          'Vui lòng nhấn microphone và nói để bắt đầu đặt lịch. Sau đó bạn có thể nhập text để bổ sung thông tin.'
        );
      }
    } catch (err: any) {
      console.error('[VoiceBooking] Error sending text:', err);
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSendingText(false);
    }
  };

  const handleStartRecording = async () => {
    // Prevent concurrent recording preparation
    if (isPreparingRecording) {
      console.warn('[VoiceBooking] Already preparing recording, skipping...');
      return;
    }

    // Nếu đang processing, không start recording
    if (isProcessing) {
      return;
    }

    try {
      setIsPreparingRecording(true);
      setRecordingDuration(0);
      recordingStartTimeRef.current = Date.now();

      // CRITICAL: Force cleanup TẤT CẢ recording có thể tồn tại
      if (recording) {
        try {
          const status = await recording.getStatusAsync();
          if (status.isRecording || status.canRecord) {
            await recording.stopAndUnloadAsync();
          }
        } catch (e) {
          // Ignore - may already be unloaded
        }
        setRecording(null);
      }
      
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (e) {
          // Ignore
        }
        recordingRef.current = null;
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));

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

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      // Haptic feedback khi bắt đầu ghi
      Vibration.vibrate(10);
      
      // Create recording - TẮT metering vì không cần auto-stop
      const recordingOptions = Audio.RecordingOptionsPresets.HIGH_QUALITY;
      
      const result = await Audio.Recording.createAsync(recordingOptions);
      const newRecording = result.recording;
      
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

      // Set max duration timer (60 giây tối đa, giống web)
      maxDurationTimerRef.current = setTimeout(() => {
        handleStopRecording();
      }, MAX_RECORDING_DURATION);

    } catch (error: any) {
      console.error('[VoiceBooking] Error starting recording:', error);
      
      // Reset recording states
      setIsRecordingLocal(false);
      cancelRecording();
      setRecording(null);
      clearAllTimers();
      
    } finally {
      setIsPreparingRecording(false);
    }
  };

  // TẮT auto-stop - Không dùng monitorAudioLevels nữa, user tự kiểm soát giống web

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
    // Clear audio tracking
    playedAudioIdsRef.current.clear();
    cancelBooking();
    resetConversation();
    setConfirmedBookingDetails(null);
  };

  const handleReset = () => {
    // Clear audio tracking để audio mới có thể phát
    playedAudioIdsRef.current.clear();
    resetConversation();
    setConfirmedBookingDetails(null);
    setAdditionalText('');
    // Thêm lời chào mới
    setTimeout(() => {
      addAIMessage('Xin chào! Tôi là trợ lý AI của Home Mate. Bạn muốn đặt dịch vụ gì hôm nay? Chúng tôi hiện có Dọn dẹp theo giờ, Tổng vệ sinh, Vệ sinh Sofa - Nệm - Rèm, Vệ sinh máy lạnh, Giặt sấy theo kg, Giặt hấp cao cấp, Nấu ăn gia đình, Đi chợ hộ. Hãy nói với tôi nhé!');
    }, 100);
  };

  const handleGoBack = async () => {
    // Tắt audio ngay lập tức khi thoát
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {
        console.warn('[VoiceBooking] Error stopping audio on back:', e);
      }
      setSound(null);
      setIsPlayingAudioLocal(false);
    }
    
    // Dừng recording nếu đang ghi
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {
        console.warn('[VoiceBooking] Error stopping recording on back:', e);
      }
      setRecording(null);
      setIsRecordingLocal(false);
    }

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
            onPress: () => {
              // Lưu requestId trước khi reset
              const requestIdToCancel = currentRequestId;
              
              // Reset UI ngay lập tức - KHÔNG còn loading
              playedAudioIdsRef.current.clear();
              setConfirmedBookingDetails(null);
              resetConversation(); // Reset store trước
              
              // Navigate ngay
              navigation.goBack();
              
              // Gọi cancel API trực tiếp (không qua store) ở background
              // Không cần chờ, không ảnh hưởng UI
              if (requestIdToCancel) {
                voiceBookingService.cancelVoiceBooking(requestIdToCancel).catch(() => {
                  // Background cancel error - ignored
                });
              }
            },
          },
        ]
      );
    } else {
      // Không có request đang xử lý, reset và thoát ngay
      playedAudioIdsRef.current.clear();
      setConfirmedBookingDetails(null);
      resetConversation();
      navigation.goBack();
    }
  };

  // Render status text đơn giản (1 dòng) - giống web
  const getStatusText = () => {
    const isCurrentlyRecording = isRecordingLocal || isRecording;
    
    if (isCurrentlyRecording) {
      return {
        text: `Đang lắng nghe... ${recordingDuration}s`,
        subtext: 'Nhấn để gửi',
        color: colors.feedback.error,
      };
    }
    if (isPlayingAudioLocal) {
      return {
        text: 'AI đang trả lời...',
        subtext: 'Nhấn để dừng',
        color: colors.highlight.purple,
      };
    }
    if (isProcessing || isPreparingRecording) {
      return {
        text: 'AI đang xử lý...',
        subtext: '',
        color: colors.highlight.teal,
      };
    }
    if (currentStatus === 'COMPLETED') {
      return {
        text: '✓ Đặt lịch thành công!',
        subtext: '',
        color: colors.feedback.success,
      };
    }
    if (currentStatus === 'AWAITING_CONFIRMATION') {
      return {
        text: '✓ Thông tin đầy đủ',
        subtext: 'Nhấn xác nhận ở trên',
        color: colors.highlight.teal,
      };
    }
    if (currentStatus === 'PARTIAL') {
      return {
        text: 'Cần bổ sung thông tin',
        subtext: 'Nói hoặc nhập thêm chi tiết',
        color: colors.feedback.warning,
      };
    }
    return {
      text: 'Nhấn mic để nói',
      subtext: 'hoặc nhập tin nhắn bên dưới',
      color: colors.neutral.textSecondary,
    };
  };

  // Render success screen (khi đặt lịch thành công) - giống web
  const renderSuccessScreen = () => {
    if (currentStatus !== 'COMPLETED' || !bookingId) return null;
    
    // Helper function để format date
    const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return dateString;
      }
    };

    // Helper để lấy địa chỉ
    const getAddress = () => {
      if (!confirmedBookingDetails?.address) return 'Chưa có địa chỉ';
      if (typeof confirmedBookingDetails.address === 'string') {
        return confirmedBookingDetails.address;
      }
      return confirmedBookingDetails.address?.fullAddress || 
        [confirmedBookingDetails.address?.ward, confirmedBookingDetails.address?.city].filter(Boolean).join(', ') ||
        'Chưa có địa chỉ';
    };

    // Helper để lấy services
    const getServices = () => {
      return confirmedBookingDetails?.serviceDetails || 
             confirmedBookingDetails?.bookingDetails || 
             [];
    };

    // Helper để lấy employees
    const getEmployees = () => {
      let employees: any[] = [];
      if (confirmedBookingDetails?.assignedEmployees?.length > 0) {
        employees = confirmedBookingDetails.assignedEmployees;
      } else if (confirmedBookingDetails?.bookingDetails) {
        confirmedBookingDetails.bookingDetails.forEach((detail: any) => {
          if (detail.assignments) {
            detail.assignments.forEach((assignment: any) => {
              if (assignment.employee) {
                employees.push({
                  employeeName: assignment.employee.fullName,
                  phoneNumber: assignment.employee.phoneNumber,
                });
              }
            });
          }
        });
      }
      return employees;
    };
    
    return (
      <View style={styles.successScreen}>
        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.successIconGradient}
          >
            <Ionicons name="checkmark" size={40} color="#fff" />
          </LinearGradient>
        </View>
        
        <Text style={styles.successTitle}>🎉 Đặt lịch thành công!</Text>
        <Text style={styles.successSubtitle}>Cảm ơn bạn đã sử dụng dịch vụ Home Mate</Text>
        
        {/* Booking ID Badge */}
        

        {/* Booking Details */}
        {loadingBookingDetails ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.highlight.teal} />
            <Text style={styles.loadingText}>Đang tải thông tin...</Text>
          </View>
        ) : confirmedBookingDetails ? (
          <View style={styles.bookingDetailsContainer}>
            {/* Thời gian */}
            <View style={[styles.detailCard, styles.timeCard]}>
              <View style={styles.detailCardHeader}>
                <Ionicons name="time-outline" size={18} color="#3B82F6" />
                <Text style={[styles.detailCardTitle, { color: '#1E40AF' }]}>Thời gian</Text>
              </View>
              <Text style={[styles.detailCardContent, { color: '#1D4ED8' }]}>
                {confirmedBookingDetails.bookingTime 
                  ? formatDate(confirmedBookingDetails.bookingTime)
                  : `${confirmedBookingDetails.scheduledDate || ''} - ${confirmedBookingDetails.scheduledTime || ''}`
                }
              </Text>
            </View>

            {/* Địa chỉ */}
            <View style={[styles.detailCard, styles.addressCard]}>
              <View style={styles.detailCardHeader}>
                <Ionicons name="location-outline" size={18} color="#F97316" />
                <Text style={[styles.detailCardTitle, { color: '#C2410C' }]}>Địa chỉ</Text>
              </View>
              <Text style={[styles.detailCardContent, { color: '#EA580C' }]}>
                {getAddress()}
              </Text>
            </View>

            {/* Dịch vụ */}
            {getServices().length > 0 && (
              <View style={[styles.detailCard, styles.serviceCard]}>
                <View style={styles.detailCardHeader}>
                  <Ionicons name="briefcase-outline" size={18} color="#8B5CF6" />
                  <Text style={[styles.detailCardTitle, { color: '#6D28D9' }]}>Dịch vụ</Text>
                </View>
                {getServices().map((item: any, idx: number) => {
                  const serviceName = item.serviceName || item.service?.name || 'Dịch vụ';
                  const price = item.formattedPrice || item.formattedSubTotal || item.formattedPricePerUnit ||
                    `${(item.price || item.subTotal || item.pricePerUnit || 0).toLocaleString('vi-VN')}đ`;
                  const quantity = item.quantity || 1;
                  
                  return (
                    <View key={idx} style={styles.serviceRow}>
                      <Text style={[styles.serviceName, { color: '#7C3AED' }]}>
                        {serviceName} {quantity > 1 ? `x${quantity}` : ''}
                      </Text>
                      <Text style={[styles.servicePrice, { color: '#6D28D9' }]}>{price}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Nhân viên */}
            {getEmployees().length > 0 && (
              <View style={[styles.detailCard, styles.employeeCard]}>
                <View style={styles.detailCardHeader}>
                  <Ionicons name="person-outline" size={18} color="#06B6D4" />
                  <Text style={[styles.detailCardTitle, { color: '#0E7490' }]}>Nhân viên phục vụ</Text>
                </View>
                {getEmployees().map((emp: any, idx: number) => (
                  <Text key={idx} style={[styles.detailCardContent, { color: '#0891B2' }]}>
                    {emp.employeeName || emp.fullName}
                    {emp.phoneNumber ? ` (${emp.phoneNumber})` : ''}
                  </Text>
                ))}
              </View>
            )}

            {/* Tổng tiền */}
            <View style={[styles.detailCard, styles.totalCard]}>
              <View style={styles.detailCardHeader}>
                <Ionicons name="wallet-outline" size={18} color="#16A34A" />
                <Text style={[styles.detailCardTitle, { color: '#166534' }]}>Tổng thanh toán</Text>
              </View>
              <Text style={styles.totalAmount}>
                {confirmedBookingDetails.formattedTotalAmount || 
                 `${(confirmedBookingDetails.totalAmount || confirmedBookingDetails.totalPrice || 0).toLocaleString('vi-VN')}đ`}
              </Text>
              {(confirmedBookingDetails.paymentInfo || confirmedBookingDetails.payment) && (
                <Text style={styles.paymentInfo}>
                  {confirmedBookingDetails.paymentInfo?.methodName || confirmedBookingDetails.payment?.paymentMethod || 'Thanh toán khi hoàn thành'}
                </Text>
              )}
            </View>

            {/* Ghi chú */}
            {(confirmedBookingDetails.notes || confirmedBookingDetails.note) && (
              <View style={[styles.detailCard, styles.noteCard]}>
                <View style={styles.detailCardHeader}>
                  <Ionicons name="document-text-outline" size={18} color="#6B7280" />
                  <Text style={[styles.detailCardTitle, { color: '#4B5563' }]}>Ghi chú</Text>
                </View>
                <Text style={[styles.detailCardContent, { color: '#6B7280' }]}>
                  {confirmedBookingDetails.notes || confirmedBookingDetails.note}
                </Text>
              </View>
            )}
          </View>
        ) : null}
        
        {/* Action Buttons */}
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
              // Clear tất cả state trước khi navigate
              playedAudioIdsRef.current.clear();
              setConfirmedBookingDetails(null);
              setIsPlayingAudioLocal(false);
              setIsRecordingLocal(false);
              resetConversation();
              // Navigate về home
              (navigation as any).reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            }}
          >
            <Ionicons name="home" size={20} color={colors.highlight.teal} />
            <Text style={styles.secondaryButtonText}>Về trang chủ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.successButton, styles.outlineButton]}
            onPress={() => {
              // Clear audio tracking để audio mới có thể phát
              playedAudioIdsRef.current.clear();
              // Reset hết state
              resetConversation();
              setConfirmedBookingDetails(null);
              // Thêm lời chào mới
              setTimeout(() => {
                addAIMessage('Xin chào! Tôi là trợ lý AI của Home Mate. Bạn muốn đặt dịch vụ gì hôm nay? Chúng tôi hiện có Dọn dẹp theo giờ, Tổng vệ sinh, Vệ sinh Sofa - Nệm - Rèm, Vệ sinh máy lạnh, Giặt sấy theo kg, Giặt hấp cao cấp, Nấu ăn gia đình, Đi chợ hộ. Hãy nói với tôi nhé!');
              }, 100);
            }}
          >
            <Ionicons name="add-circle" size={20} color={colors.highlight.teal} />
            <Text style={styles.outlineButtonText}>Đặt lịch mới</Text>
          </TouchableOpacity>
        </View>
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
        // Đang ghi âm → dừng ghi âm và gửi
        handleStopRecording(false);
      } else if (isCurrentlyPlaying) {
        // Đang phát audio → chỉ dừng audio (giống web - không tự ghi âm)
        stopAudioPlayback();
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
        return ['#8B5CF6', '#6366F1']; // Tím - đang phát audio
      }
      return ['#1BB5A6', '#8B5CF6']; // Xanh - sẵn sàng
    };

    const getButtonIcon = () => {
      if (isCurrentlyRecording) {
        return 'stop';
      } else if (isCurrentlyPlaying) {
        return 'pause'; // Icon pause để user biết nhấn sẽ dừng audio
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
                <ActivityIndicator size="small" color="#fff" />
              ) : isProcessing ? (
                <Ionicons
                  name="ellipsis-horizontal"
                  size={32}
                  color="#fff"
                />
              ) : (
                <Ionicons
                  name={getButtonIcon()}
                  size={32}
                  color="#fff"
                />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const statusInfo = getStatusText();

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
        <Text style={styles.headerTitle}>Trợ lý AI đặt lịch</Text>
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleReset}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={20} color={colors.highlight.teal} />
        </TouchableOpacity>
      </View>

      {/* Success Screen - hiển thị khi đặt lịch thành công */}
      {currentStatus === 'COMPLETED' && bookingId ? (
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.successContentContainer}
        >
          {renderSuccessScreen()}
        </ScrollView>
      ) : (
        <>
          {/* Chat Messages Container - giống web */}
          <ScrollView 
            ref={scrollViewRef}
            style={styles.chatContainer} 
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Messages */}
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  msg.type === 'user' ? styles.userBubble : styles.aiBubble,
                ]}
              >
                {/* Avatar */}
                <View style={[
                  styles.avatar,
                  msg.type === 'user' ? styles.userAvatar : styles.aiAvatar,
                ]}>
                  <Ionicons 
                    name={msg.type === 'user' ? 'person' : 'sparkles'} 
                    size={16} 
                    color="#fff" 
                  />
                </View>
                
                {/* Message Content */}
                <View style={[
                  styles.messageContent,
                  msg.type === 'user' ? styles.userMessageContent : styles.aiMessageContent,
                ]}>
                  <Text style={[
                    styles.messageText,
                    msg.type === 'user' ? styles.userMessageText : styles.aiMessageText,
                  ]}>
                    {msg.content}
                  </Text>
                  {msg.audioUrl && msg.type === 'ai' && (
                    <TouchableOpacity 
                      style={styles.playAudioBtn}
                      onPress={() => playAudio(msg.audioUrl!)}
                    >
                      <Ionicons name="volume-high" size={14} color={colors.highlight.purple} />
                      <Text style={styles.playAudioText}>Nghe lại</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            {/* AI Thinking Indicator */}
            {(isProcessing || isSendingText) && (
              <View style={[styles.messageBubble, styles.aiBubble]}>
                <View style={[styles.avatar, styles.aiAvatar]}>
                  <Ionicons name="sparkles" size={16} color="#fff" />
                </View>
                <View style={[styles.messageContent, styles.aiMessageContent]}>
                  <View style={styles.thinkingDots}>
                    <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
                    <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
                    <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
                    <Text style={styles.thinkingText}>AI đang xử lý...</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Error Message */}
            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="warning" size={18} color={colors.feedback.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Missing Fields Hint */}
            {currentStatus === 'PARTIAL' && missingFields.length > 0 && (
              <View style={styles.missingFieldsHint}>
                <View style={styles.missingFieldsHeader}>
                  <Ionicons name="alert-circle" size={18} color={colors.feedback.warning} />
                  <Text style={styles.missingFieldsTitle}>Cần bổ sung:</Text>
                </View>
                <View style={styles.missingFieldsChips}>
                  {missingFields.map((field, idx) => (
                    <View key={idx} style={styles.fieldChip}>
                      <Text style={styles.fieldChipText}>
                        {field === 'service' ? '🏠 Dịch vụ' :
                         field === 'address' ? '📍 Địa chỉ' :
                         field === 'bookingTime' ? '🕐 Thời gian' :
                         field === 'quantity' ? '🔢 Số lượng' : field}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Quick Tips - chỉ hiển thị khi chưa có message */}
            {messages.length <= 1 && !currentStatus && (
              <View style={styles.quickTips}>
                <Text style={styles.quickTipsTitle}>💡 Gợi ý để bắt đầu:</Text>
                <Text style={styles.quickTipItem}>• "Đặt dịch vụ dọn dẹp nhà vào 3 giờ chiều mai"</Text>
                <Text style={styles.quickTipItem}>• "Tìm giúp việc tại quận 1"</Text>
                <Text style={styles.quickTipItem}>• "Cần giặt ủi quần áo tại 123 Nguyễn Huệ"</Text>
              </View>
            )}

            {/* Preview Card khi AWAITING_CONFIRMATION */}
            {currentStatus === 'AWAITING_CONFIRMATION' && preview && !showConfirmModal && (
              <View style={styles.previewCard}>
                <View style={styles.previewCardHeader}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.highlight.teal} />
                  <Text style={styles.previewCardTitle}>Sẵn sàng xác nhận</Text>
                </View>
                <TouchableOpacity
                  style={styles.confirmPreviewBtn}
                  onPress={() => setShowConfirmModal(true)}
                >
                  <LinearGradient
                    colors={['#1BB5A6', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.confirmPreviewGradient}
                  >
                    <Text style={styles.confirmPreviewText}>Xem & Xác nhận đặt lịch</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Bottom Control - Voice + Text Input */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.bottomControl}
          >
            {/* Text Input Row */}
            <View style={styles.textInputRow}>
              <TextInput
                ref={textInputRef}
                style={styles.textInput}
                placeholder={currentRequestId ? "Nhập thêm thông tin..." : "Nhấn mic để nói trước"}
                value={textInput}
                onChangeText={setTextInput}
                placeholderTextColor={colors.neutral.label}
                editable={!isRecording && !isProcessing && currentStatus !== 'COMPLETED'}
                onSubmitEditing={handleSendText}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[
                  styles.sendTextBtn,
                  (!textInput.trim() || isSendingText) && styles.sendTextBtnDisabled,
                ]}
                onPress={handleSendText}
                disabled={!textInput.trim() || isSendingText || isRecording}
              >
                {isSendingText ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>hoặc</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Voice Button + Status */}
            <View style={styles.voiceControlRow}>
              {renderRecordButton()}
            </View>

            {/* Status Text */}
            <View style={styles.statusTextRow}>
              <Text style={[styles.statusMainText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
              {statusInfo.subtext ? (
                <Text style={styles.statusSubText}>{statusInfo.subtext}</Text>
              ) : null}
            </View>
          </KeyboardAvoidingView>
        </>
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
                <Text style={styles.modalSubtitle}>Kiểm tra thông tin trước khi xác nhận</Text>
              </View>

              {preview ? (
                <View style={styles.modalContent}>
                  {/* Thời gian */}
                  {preview.bookingTime && (
                    <View style={styles.infoCard}>
                      <View style={[styles.infoIconBox, { backgroundColor: '#EDE9FE' }]}>
                        <Ionicons name="time" size={18} color="#8B5CF6" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Thời gian</Text>
                        <Text style={styles.infoValue}>
                          {new Date(preview.bookingTime).toLocaleString('vi-VN', {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Dịch vụ */}
                  {preview.services && preview.services.length > 0 && (
                    <View style={styles.infoCard}>
                      <View style={[styles.infoIconBox, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="briefcase" size={18} color="#F59E0B" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Dịch vụ ({preview.services.length})</Text>
                        {preview.services.map((service, idx) => (
                          <Text key={idx} style={styles.infoValue}>
                            {service.serviceName} x{service.quantity || 1}
                          </Text>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Địa chỉ */}
                  {(preview.fullAddress || preview.address) && (
                    <View style={styles.infoCard}>
                      <View style={[styles.infoIconBox, { backgroundColor: '#DBEAFE' }]}>
                        <Ionicons name="location" size={18} color="#3B82F6" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Địa chỉ</Text>
                        <Text style={styles.infoValue}>
                          {preview.fullAddress || preview.address}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Ghi chú */}
                  {preview.note && (
                    <View style={styles.infoCard}>
                      <View style={[styles.infoIconBox, { backgroundColor: '#F3F4F6' }]}>
                        <Ionicons name="document-text" size={18} color="#6B7280" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Ghi chú</Text>
                        <Text style={styles.infoValue}>{preview.note}</Text>
                      </View>
                    </View>
                  )}

                  {/* Tổng tiền */}
                  <View style={styles.totalCard}>
                    <Text style={styles.totalLabel}>Tổng cộng</Text>
                    <Text style={styles.totalValue}>
                      {preview.formattedTotalAmount || preview.totalAmountFormatted || 
                       (preview.totalAmount ? `${preview.totalAmount.toLocaleString('vi-VN')}đ` : '0đ')}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.modalContent}>
                  <ActivityIndicator size="large" color={colors.highlight.teal} />
                  <Text style={styles.loadingText}>Đang tải thông tin...</Text>
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
                    (!preview || confirmingBooking) && styles.modalConfirmBtnDisabled
                  ]} 
                  onPress={handleConfirm}
                  activeOpacity={0.7}
                  disabled={!preview || confirmingBooking}
                >
                  <LinearGradient
                    colors={preview && !confirmingBooking ? ['#1BB5A6', '#8B5CF6'] : ['#9CA3AF', '#6B7280']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalConfirmGradient}
                  >
                    {confirmingBooking ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    )}
                    <Text style={styles.modalConfirmBtnText}>
                      {confirmingBooking ? 'Đang xử lý...' : 'Xác nhận'}
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
  
  // Header
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
  },
  resetBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Success Screen
  content: {
    flex: 1,
  },
  successContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: responsiveSpacing.lg,
  },
  successScreen: {
    alignItems: 'center',
    padding: responsiveSpacing.xl,
  },
  successIconContainer: {
    marginBottom: responsiveSpacing.lg,
  },
  successIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '700',
    color: colors.feedback.success,
    textAlign: 'center',
    marginBottom: responsiveSpacing.xs,
  },
  successSubtitle: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: responsiveSpacing.md,
  },
  successBookingId: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    marginBottom: responsiveSpacing.xl,
  },
  bookingIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 20,
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.xs,
    marginBottom: responsiveSpacing.lg,
  },
  bookingIdLabel: {
    fontSize: responsiveFontSize.caption,
    color: '#15803D',
    marginRight: responsiveSpacing.xs,
  },
  bookingIdValue: {
    fontSize: responsiveFontSize.caption,
    fontWeight: '700',
    color: '#166534',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveSpacing.xl,
  },
  loadingText: {
    marginLeft: responsiveSpacing.sm,
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
  },
  bookingDetailsContainer: {
    width: '100%',
    gap: responsiveSpacing.sm,
    marginBottom: responsiveSpacing.lg,
  },
  detailCard: {
    borderRadius: 16,
    padding: responsiveSpacing.md,
    borderWidth: 1,
  },
  timeCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  addressCard: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  serviceCard: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
  },
  employeeCard: {
    backgroundColor: '#ECFEFF',
    borderColor: '#A5F3FC',
  },
  totalCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  noteCard: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSpacing.xs,
    gap: responsiveSpacing.xs,
  },
  detailCardTitle: {
    fontSize: responsiveFontSize.caption,
    fontWeight: '600',
  },
  detailCardContent: {
    fontSize: responsiveFontSize.body,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  serviceName: {
    fontSize: responsiveFontSize.body,
    flex: 1,
  },
  servicePrice: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    marginLeft: responsiveSpacing.sm,
  },
  totalAmount: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '700',
    color: '#15803D',
    marginTop: responsiveSpacing.xs,
  },
  totalLabel: {
    fontSize: responsiveFontSize.caption,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  paymentInfo: {
    fontSize: responsiveFontSize.caption,
    color: '#22C55E',
    marginTop: responsiveSpacing.xs,
  },
  successButtonsContainer: {
    width: '100%',
    gap: responsiveSpacing.md,
  },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveSpacing.md,
    borderRadius: 12,
    gap: responsiveSpacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.highlight.teal,
  },
  primaryButtonText: {
    color: '#fff',
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
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  outlineButtonText: {
    color: colors.highlight.teal,
    fontSize: responsiveFontSize.body,
    fontWeight: '500',
  },

  // Chat Container
  chatContainer: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  chatContent: {
    padding: responsiveSpacing.md,
    paddingBottom: responsiveSpacing.lg,
  },

  // Message Bubble
  messageBubble: {
    flexDirection: 'row',
    marginBottom: responsiveSpacing.md,
    alignItems: 'flex-start',
  },
  userBubble: {
    flexDirection: 'row-reverse',
  },
  aiBubble: {
    flexDirection: 'row',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    backgroundColor: colors.highlight.teal,
    marginLeft: responsiveSpacing.sm,
  },
  aiAvatar: {
    backgroundColor: '#8B5CF6',
    marginRight: responsiveSpacing.sm,
  },
  messageContent: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: responsiveSpacing.md,
  },
  userMessageContent: {
    backgroundColor: colors.highlight.teal,
    borderTopRightRadius: 4,
  },
  aiMessageContent: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  messageText: {
    fontSize: responsiveFontSize.body,
    lineHeight: responsiveFontSize.body * 1.5,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: colors.primary.navy,
  },
  playAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: responsiveSpacing.xs,
    gap: 4,
  },
  playAudioText: {
    fontSize: responsiveFontSize.caption,
    color: colors.highlight.purple,
  },

  // Thinking Indicator
  thinkingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.highlight.teal,
  },
  thinkingText: {
    marginLeft: responsiveSpacing.sm,
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
  },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsiveSpacing.md,
    backgroundColor: colors.feedback.error + '15',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.feedback.error + '30',
    marginBottom: responsiveSpacing.md,
    gap: responsiveSpacing.sm,
  },
  errorText: {
    flex: 1,
    color: colors.feedback.error,
    fontSize: responsiveFontSize.caption,
  },

  // Missing Fields Hint
  missingFieldsHint: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: responsiveSpacing.md,
    marginBottom: responsiveSpacing.md,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  missingFieldsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing.sm,
    marginBottom: responsiveSpacing.sm,
  },
  missingFieldsTitle: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: '#92400E',
  },
  missingFieldsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsiveSpacing.xs,
  },
  fieldChip: {
    backgroundColor: '#fff',
    paddingHorizontal: responsiveSpacing.sm,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  fieldChipText: {
    fontSize: responsiveFontSize.caption,
    color: '#92400E',
  },

  // Quick Tips
  quickTips: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: responsiveSpacing.md,
    marginTop: responsiveSpacing.md,
  },
  quickTipsTitle: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: responsiveSpacing.sm,
  },
  quickTipItem: {
    fontSize: responsiveFontSize.caption,
    color: '#1E3A8A',
    marginBottom: 4,
    lineHeight: responsiveFontSize.caption * 1.5,
  },

  // Preview Card
  previewCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: responsiveSpacing.md,
    marginTop: responsiveSpacing.md,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  previewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing.sm,
    marginBottom: responsiveSpacing.md,
  },
  previewCardTitle: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
  },
  confirmPreviewBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmPreviewGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveSpacing.md,
    gap: responsiveSpacing.sm,
  },
  confirmPreviewText: {
    color: '#fff',
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
  },

  // Bottom Control
  bottomControl: {
    backgroundColor: colors.neutral.white,
    padding: responsiveSpacing.md,
    paddingBottom: responsiveSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing.sm,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.neutral.background,
    borderRadius: 22,
    paddingHorizontal: responsiveSpacing.md,
    fontSize: responsiveFontSize.body,
    color: colors.primary.navy,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  sendTextBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.highlight.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendTextBtnDisabled: {
    backgroundColor: colors.neutral.border,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: responsiveSpacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral.border,
  },
  dividerText: {
    paddingHorizontal: responsiveSpacing.md,
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
  },
  voiceControlRow: {
    alignItems: 'center',
  },
  statusTextRow: {
    alignItems: 'center',
    marginTop: responsiveSpacing.sm,
  },
  statusMainText: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusSubText: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginTop: 2,
  },

  // Record Button
  recordButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 100,
  },
  recordWave: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.highlight.teal,
    opacity: 0.3,
  },
  recordWave2: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  playingIndicator: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.highlight.purple,
    opacity: 0.2,
  },
  processingRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: colors.highlight.purple,
    borderRightColor: colors.highlight.teal,
  },
  recordButtonWrapper: {
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: responsiveSpacing.lg,
    paddingHorizontal: responsiveSpacing.lg,
    paddingBottom: responsiveSpacing.xl,
  },
  modalCloseButton: {
    position: 'absolute',
    top: responsiveSpacing.sm,
    right: responsiveSpacing.sm,
    zIndex: 10,
    padding: 4,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: responsiveSpacing.lg,
  },
  modalTitle: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '700',
    color: colors.primary.navy,
    marginTop: responsiveSpacing.sm,
  },
  modalSubtitle: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginTop: 4,
  },
  modalContent: {
    marginBottom: responsiveSpacing.lg,
    gap: responsiveSpacing.sm,
  },
  
  // Info Cards in Modal
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.neutral.background,
    borderRadius: 12,
    padding: responsiveSpacing.md,
    gap: responsiveSpacing.sm,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.neutral.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
  },
  
  // Total Value (for preview modal)
  totalValue: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '700',
    color: '#fff',
  },

  // Modal Buttons
  modalButtons: {
    gap: responsiveSpacing.sm,
  },
  modalCancelBtn: {
    paddingVertical: responsiveSpacing.md,
    borderRadius: 12,
    backgroundColor: colors.neutral.background,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
  },
  modalConfirmBtn: {
    borderRadius: 12,
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
    color: '#fff',
  },
});

export default VoiceBookingScreen;
