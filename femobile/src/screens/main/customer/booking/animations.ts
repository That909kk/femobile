import { Animated, Easing } from 'react-native';

// Animation utilities for booking flow
export class BookingAnimations {
  // Fade animation
  static createFadeAnimation(
    value: Animated.Value,
    toValue: number = 1,
    duration: number = 300,
    delay: number = 0
  ): Animated.CompositeAnimation {
    return Animated.timing(value, {
      toValue,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
  }

  // Scale animation for buttons and cards
  static createScaleAnimation(
    value: Animated.Value,
    toValue: number = 1,
    duration: number = 200
  ): Animated.CompositeAnimation {
    return Animated.spring(value, {
      toValue,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    });
  }

  // Slide animation for screen transitions
  static createSlideAnimation(
    value: Animated.Value,
    toValue: number = 0,
    duration: number = 400,
    delay: number = 0
  ): Animated.CompositeAnimation {
    return Animated.timing(value, {
      toValue,
      duration,
      delay,
      easing: Easing.out(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
      useNativeDriver: true,
    });
  }

  // Bounce animation for success states
  static createBounceAnimation(
    value: Animated.Value,
    toValue: number = 1,
    duration: number = 600
  ): Animated.CompositeAnimation {
    return Animated.spring(value, {
      toValue,
      tension: 80,
      friction: 6,
      useNativeDriver: true,
    });
  }

  // Stagger animation for list items
  static createStaggerAnimation(
    values: Animated.Value[],
    duration: number = 300,
    stagger: number = 100
  ): Animated.CompositeAnimation {
    const animations = values.map((value, index) => 
      Animated.timing(value, {
        toValue: 1,
        duration,
        delay: index * stagger,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );
    
    return Animated.parallel(animations);
  }

  // Progress animation
  static createProgressAnimation(
    value: Animated.Value,
    toValue: number,
    duration: number = 800
  ): Animated.CompositeAnimation {
    return Animated.timing(value, {
      toValue,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // Cannot use native driver for width/height
    });
  }

  // Pulse animation for loading states
  static createPulseAnimation(
    value: Animated.Value,
    minValue: number = 0.8,
    maxValue: number = 1.2,
    duration: number = 1000
  ): Animated.CompositeAnimation {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: maxValue,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: minValue,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
  }

  // Shake animation for error states
  static createShakeAnimation(
    value: Animated.Value,
    duration: number = 500
  ): Animated.CompositeAnimation {
    return Animated.sequence([
      Animated.timing(value, { toValue: 10, duration: duration / 8, useNativeDriver: true }),
      Animated.timing(value, { toValue: -10, duration: duration / 8, useNativeDriver: true }),
      Animated.timing(value, { toValue: 10, duration: duration / 8, useNativeDriver: true }),
      Animated.timing(value, { toValue: -10, duration: duration / 8, useNativeDriver: true }),
      Animated.timing(value, { toValue: 5, duration: duration / 8, useNativeDriver: true }),
      Animated.timing(value, { toValue: -5, duration: duration / 8, useNativeDriver: true }),
      Animated.timing(value, { toValue: 0, duration: duration / 4, useNativeDriver: true }),
    ]);
  }

  // Rotate animation for loading spinners
  static createRotateAnimation(
    value: Animated.Value,
    duration: number = 1000
  ): Animated.CompositeAnimation {
    return Animated.loop(
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
  }
}

// Pre-configured animation sequences
export const BookingAnimationSequences = {
  // Screen enter animation
  screenEnter: (fadeValue: Animated.Value, slideValue: Animated.Value) => {
    return Animated.parallel([
      BookingAnimations.createFadeAnimation(fadeValue, 1, 400),
      BookingAnimations.createSlideAnimation(slideValue, 0, 400),
    ]);
  },

  // Screen exit animation
  screenExit: (fadeValue: Animated.Value, slideValue: Animated.Value) => {
    return Animated.parallel([
      BookingAnimations.createFadeAnimation(fadeValue, 0, 300),
      BookingAnimations.createSlideAnimation(slideValue, -50, 300),
    ]);
  },

  // Button press animation
  buttonPress: (scaleValue: Animated.Value) => {
    return Animated.sequence([
      BookingAnimations.createScaleAnimation(scaleValue, 0.95, 100),
      BookingAnimations.createScaleAnimation(scaleValue, 1, 100),
    ]);
  },

  // Card select animation
  cardSelect: (scaleValue: Animated.Value, fadeValue: Animated.Value) => {
    return Animated.parallel([
      BookingAnimations.createScaleAnimation(scaleValue, 1.02, 200),
      BookingAnimations.createFadeAnimation(fadeValue, 1, 200),
    ]);
  },

  // Card deselect animation
  cardDeselect: (scaleValue: Animated.Value, fadeValue: Animated.Value) => {
    return Animated.parallel([
      BookingAnimations.createScaleAnimation(scaleValue, 1, 200),
      BookingAnimations.createFadeAnimation(fadeValue, 0.8, 200),
    ]);
  },

  // Success celebration animation
  successCelebration: (scaleValue: Animated.Value, fadeValue: Animated.Value) => {
    return Animated.sequence([
      Animated.parallel([
        BookingAnimations.createBounceAnimation(scaleValue, 1.1, 400),
        BookingAnimations.createFadeAnimation(fadeValue, 1, 300),
      ]),
      BookingAnimations.createScaleAnimation(scaleValue, 1, 200),
    ]);
  },
};

// Animation timing constants
export const AnimationTiming = {
  fast: 200,
  normal: 300,
  slow: 500,
  stagger: 100,
  bounce: 600,
  pulse: 1000,
} as const;

// Easing presets
export const AnimationEasing = {
  easeOut: Easing.out(Easing.cubic),
  easeIn: Easing.in(Easing.cubic),
  easeInOut: Easing.inOut(Easing.cubic),
  bounce: Easing.bounce,
  elastic: Easing.elastic(2),
  back: Easing.back(1.5),
  bezier: Easing.bezier(0.25, 0.46, 0.45, 0.94),
} as const;