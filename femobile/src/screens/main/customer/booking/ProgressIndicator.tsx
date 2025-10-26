import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, responsiveSpacing, responsiveFontSize, responsive } from '../../../../styles';

interface ProgressIndicatorProps {
  currentStep: number;
}

const stepLabels = [
  'Dịch vụ',
  'Địa chỉ', 
  'Thời gian',
  'Nhân viên',
  'Xác nhận',
  'Hoàn thành'
];

const stepIcons = [
  'grid-outline',           // Dịch vụ
  'location-outline',       // Địa chỉ
  'time-outline',          // Thời gian
  'person-outline',        // Nhân viên
  'checkmark-circle-outline', // Xác nhận
  'flag-outline'           // Hoàn thành
];

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep }) => {
  const renderStep = (stepNumber: number, index: number) => {
    const isActive = stepNumber === currentStep;
    const isCompleted = stepNumber < currentStep;
    const isLast = index === stepLabels.length - 1;

    return (
      <React.Fragment key={stepNumber}>
        <View style={styles.stepWrapper}>
          <View style={[
            styles.stepDot,
            isActive && styles.stepDotActive,
            isCompleted && styles.stepDotCompleted,
            !isActive && !isCompleted && styles.stepDotInactive,
          ]}>
            {isActive ? (
              <LinearGradient
                colors={[colors.highlight.teal, '#14A89A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientDot}
              >
                <Ionicons name={stepIcons[index] as any} size={20} color={colors.neutral.white} />
              </LinearGradient>
            ) : isCompleted ? (
              <LinearGradient
                colors={[colors.feedback.success, '#0C8A5E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientDot}
              >
                <Ionicons name="checkmark" size={20} color={colors.neutral.white} />
              </LinearGradient>
            ) : (
              <Ionicons name={stepIcons[index] as any} size={18} color={colors.neutral.label} />
            )}
          </View>
        </View>
        {!isLast && (
          <View style={[
            styles.stepLine,
            isCompleted && styles.stepLineCompleted,
          ]} />
        )}
      </React.Fragment>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        {stepLabels.map((_, index) => renderStep(index + 1, index))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingVertical: responsiveSpacing.sm,
    paddingHorizontal: responsiveSpacing.sm,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral.white,
    borderRadius: 20,
    paddingVertical: responsiveSpacing.sm,
    paddingHorizontal: responsiveSpacing.xs,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  stepWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
  },
  stepDot: {
    width: responsive.moderateScale(40),
    height: responsive.moderateScale(40),
    borderRadius: responsive.moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientDot: {
    width: responsive.moderateScale(40),
    height: responsive.moderateScale(40),
    borderRadius: responsive.moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.highlight.teal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  stepDotActive: {
    backgroundColor: 'transparent',
  },
  stepDotCompleted: {
    backgroundColor: 'transparent',
  },
  stepDotInactive: {
    backgroundColor: colors.neutral.background,
  },
  stepLine: {
    height: 2,
    flex: 1,
    backgroundColor: colors.neutral.border,
    marginHorizontal: 4,
    borderRadius: 1,
  },
  stepLineCompleted: {
    backgroundColor: colors.feedback.success,
  },
});