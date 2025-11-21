import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, UI } from '../constants';

interface SkeletonPlaceholderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonPlaceholder: React.FC<SkeletonPlaceholderProps> = ({
  width = '100%',
  height = 16,
  borderRadius = UI.BORDER_RADIUS.medium,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.surfaceElevated,
    overflow: 'hidden',
  },
});
