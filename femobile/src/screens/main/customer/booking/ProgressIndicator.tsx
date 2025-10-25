import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../styles';
import { commonStyles } from './styles';

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

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep }) => {
  const renderStep = (stepNumber: number, index: number) => {
    const isActive = stepNumber === currentStep;
    const isCompleted = stepNumber < currentStep;
    const isLast = index === stepLabels.length - 1;

    return (
      <React.Fragment key={stepNumber}>
        <View style={commonStyles.progressStep}>
          <View style={[
            commonStyles.progressDot,
            isActive && commonStyles.progressDotActive,
            isCompleted && commonStyles.progressDotCompleted,
            !isActive && !isCompleted && commonStyles.progressDotInactive,
          ]}>
            {isCompleted ? (
              <Ionicons name="checkmark" size={12} color={colors.neutral.white} />
            ) : (
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: isActive ? colors.neutral.white : colors.neutral.textSecondary,
              }}>
                {stepNumber}
              </Text>
            )}
          </View>
          <Text style={[
            commonStyles.progressText,
            isActive && commonStyles.progressTextActive,
            !isActive && commonStyles.progressTextInactive,
          ]}>
            {stepLabels[index]}
          </Text>
        </View>
        {!isLast && (
          <View style={[
            commonStyles.progressLine,
            isCompleted && commonStyles.progressLineCompleted,
          ]} />
        )}
      </React.Fragment>
    );
  };

  return (
    <View style={commonStyles.progressContainer}>
      {stepLabels.map((_, index) => renderStep(index + 1, index))}
    </View>
  );
};