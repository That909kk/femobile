import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BookingStyles, DESIGN_TOKENS, BookingColors } from '../screens/main/customer/booking/styles';
import { BookingAnimations, AnimationTiming } from '../screens/main/customer/booking/animations';
import { COLORS } from '../constants';

const { width } = Dimensions.get('window');

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  animated?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepTitles,
  animated = true,
}) => {
  const progressWidth = useRef(new Animated.Value(0)).current;
  const stepAnimations = useRef(
    Array.from({ length: totalSteps }, () => new Animated.Value(0))
  ).current;
  const scaleAnimations = useRef(
    Array.from({ length: totalSteps }, () => new Animated.Value(1))
  ).current;

  const stepIcons = [
    'search-outline',
    'location-outline', 
    'time-outline',
    'checkmark-circle-outline',
    'trophy-outline'
  ];

  const stepColors = [
    BookingColors.step1,
    BookingColors.step2,
    BookingColors.step3,
    BookingColors.step4,
    BookingColors.step5,
  ];

  useEffect(() => {
    if (animated) {
      // Animate progress bar
      const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
      BookingAnimations.createProgressAnimation(
        progressWidth,
        progressPercentage,
        AnimationTiming.slow
      ).start();

      // Animate step indicators
      stepAnimations.forEach((animation, index) => {
        const delay = index * AnimationTiming.stagger;
        
        if (index < currentStep) {
          // Completed or current step
          BookingAnimations.createFadeAnimation(
            animation,
            1,
            AnimationTiming.normal,
            delay
          ).start();
          
          if (index === currentStep - 1) {
            // Current step - add bounce effect
            BookingAnimations.createBounceAnimation(
              scaleAnimations[index],
              1.1,
              AnimationTiming.bounce
            ).start(() => {
              BookingAnimations.createScaleAnimation(
                scaleAnimations[index],
                1,
                AnimationTiming.fast
              ).start();
            });
          }
        } else {
          // Future step
          BookingAnimations.createFadeAnimation(
            animation,
            0.3,
            AnimationTiming.normal,
            delay
          ).start();
        }
      });
    }
  }, [currentStep, animated]);

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep - 1) return 'completed';
    if (stepIndex === currentStep - 1) return 'current';
    return 'upcoming';
  };

  const getStepColor = (stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    switch (status) {
      case 'completed':
        return COLORS.success;
      case 'current':
        return stepColors[stepIndex] || COLORS.primary;
      default:
        return COLORS.border;
    }
  };

  const getStepIcon = (stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    if (status === 'completed') {
      return 'checkmark-circle';
    }
    return stepIcons[stepIndex] || 'ellipse-outline';
  };

  return (
    <View style={BookingStyles.progressContainer}>
      {/* Progress bar */}
      <View style={BookingStyles.progressTrack}>
        <Animated.View
          style={[
            BookingStyles.progressFill,
            {
              width: progressWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          <LinearGradient
            colors={[COLORS.primary, stepColors[currentStep - 1] || COLORS.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, borderRadius: 2 }}
          />
        </Animated.View>
      </View>

      {/* Step indicators */}
      <View style={BookingStyles.progressSteps}>
        {Array.from({ length: totalSteps }, (_, index) => {
          const status = getStepStatus(index);
          const stepColor = getStepColor(index);
          const stepIcon = getStepIcon(index);
          
          return (
            <Animated.View
              key={index}
              style={[
                BookingStyles.progressStep,
                {
                  opacity: stepAnimations[index],
                  transform: [{ scale: scaleAnimations[index] }],
                },
              ]}
            >
              <View
                style={[
                  BookingStyles.progressStepIcon,
                  status === 'current' && BookingStyles.progressStepIconActive,
                  status === 'completed' && BookingStyles.progressStepIconCompleted,
                  { backgroundColor: stepColor + (status === 'upcoming' ? '20' : '') },
                ]}
              >
                {status === 'current' ? (
                  <LinearGradient
                    colors={[stepColor, stepColor + '80']}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons
                      name={stepIcon as any}
                      size={16}
                      color={COLORS.surface}
                    />
                  </LinearGradient>
                ) : (
                  <Ionicons
                    name={stepIcon as any}
                    size={16}
                    color={status === 'upcoming' ? stepColor : COLORS.surface}
                  />
                )}
              </View>
              
              <Text
                style={[
                  BookingStyles.progressStepText,
                  status === 'current' && BookingStyles.progressStepTextActive,
                  { color: stepColor, maxWidth: width / totalSteps - DESIGN_TOKENS.spacing.md },
                ]}
                numberOfLines={2}
              >
                {stepTitles[index]}
              </Text>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};