import { TransitionPresets, StackNavigationOptions, StackCardInterpolationProps } from '@react-navigation/stack';
import { Platform } from 'react-native';

// Custom animation configurations
export const ANIMATION_CONFIGS = {
  // Smooth slide from right (forward navigation)
  slideFromRight: {
    ...TransitionPresets.SlideFromRightIOS,
    transitionSpec: {
      open: {
        animation: 'timing' as const,
        config: {
          duration: 300,
        },
      },
      close: {
        animation: 'timing' as const,
        config: {
          duration: 250,
        },
      },
    },
  },

  // Slide from left (backward navigation - back to previous screen)
  slideFromLeft: {
    cardStyleInterpolator: ({ current, layouts }: StackCardInterpolationProps) => {
      return {
        cardStyle: {
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-layouts.screen.width, 0],
              }),
            },
          ],
        },
      };
    },
    transitionSpec: {
      open: {
        animation: 'timing' as const,
        config: {
          duration: 300,
        },
      },
      close: {
        animation: 'timing' as const,
        config: {
          duration: 250,
        },
      },
    },
  },

  // Fade transition for auth/main switch
  fade: {
    ...TransitionPresets.FadeFromBottomAndroid,
    transitionSpec: {
      open: {
        animation: 'timing' as const,
        config: {
          duration: 400,
        },
      },
      close: {
        animation: 'timing' as const,
        config: {
          duration: 350,
        },
      },
    },
  },

  // Modal style for overlays
  modal: {
    ...TransitionPresets.ModalSlideFromBottomIOS,
    transitionSpec: {
      open: {
        animation: 'timing' as const,
        config: {
          duration: 350,
        },
      },
      close: {
        animation: 'timing' as const,
        config: {
          duration: 300,
        },
      },
    },
  },
};

// Helper function to get base navigation options
export const getBaseScreenOptions = (backgroundColor: string): StackNavigationOptions => ({
  headerShown: false,
  cardStyle: { backgroundColor },
  gestureEnabled: Platform.OS === 'ios',
  gestureDirection: 'horizontal',
});

// Animation for auth flow with better direction handling
export const getAuthTransition = (fromRoute: string, toRoute: string) => {
  // Define route flow for better animation direction
  const routeOrder = ['Login', 'Register', 'ForgotPassword', 'VerifyOTP', 'ResetPassword'];
  
  const fromIndex = routeOrder.indexOf(fromRoute);
  const toIndex = routeOrder.indexOf(toRoute);
  
  // If moving forward in flow, slide from right
  if (toIndex > fromIndex) {
    return ANIMATION_CONFIGS.slideFromRight;
  }
  
  // If moving backward in flow, slide from left
  if (toIndex < fromIndex) {
    return ANIMATION_CONFIGS.slideFromLeft;
  }
  
  // Default animation
  return ANIMATION_CONFIGS.slideFromRight;
};
