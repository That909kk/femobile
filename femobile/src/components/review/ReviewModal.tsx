import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, responsive, responsiveSpacing, responsiveFontSize } from '../../styles';
import { reviewService, type ReviewCriterion } from '../../services';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (ratings: Array<{ criterionId: number; score: number }>, comment: string) => Promise<void>;
  employeeName?: string;
  bookingCode?: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  onSubmit,
  employeeName = 'Nhân viên',
  bookingCode,
}) => {
  const [criteria, setCriteria] = useState<ReviewCriterion[]>([]);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadCriteria();
    }
  }, [visible]);

  const loadCriteria = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reviewService.getReviewCriteria();
      setCriteria(data);
      
      // Initialize all ratings to 5 stars (default)
      const initialRatings: Record<number, number> = {};
      data.forEach(c => {
        initialRatings[c.criterionId] = 5;
      });
      setRatings(initialRatings);
    } catch (err: any) {
      console.error('Error loading review criteria:', err);
      setError('Không thể tải tiêu chí đánh giá');
      
      // Fallback to default criteria
      const defaultCriteria: ReviewCriterion[] = [
        { criterionId: 1, criterionName: 'Thái độ', description: 'Đánh giá thái độ phục vụ', maxScore: 5, displayOrder: 1 },
        { criterionId: 2, criterionName: 'Đúng giờ', description: 'Đánh giá sự đúng giờ', maxScore: 5, displayOrder: 2 },
        { criterionId: 3, criterionName: 'Chất lượng', description: 'Đánh giá chất lượng công việc', maxScore: 5, displayOrder: 3 },
      ];
      setCriteria(defaultCriteria);
      
      const initialRatings: Record<number, number> = {};
      defaultCriteria.forEach(c => {
        initialRatings[c.criterionId] = 5;
      });
      setRatings(initialRatings);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (criterionId: number, score: number) => {
    setRatings(prev => ({
      ...prev,
      [criterionId]: score,
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      const ratingsArray = Object.entries(ratings).map(([criterionId, score]) => ({
        criterionId: parseInt(criterionId),
        score,
      }));
      
      await onSubmit(ratingsArray, comment.trim());
      
      // Reset form
      setComment('');
      onClose();
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (criterionId: number, currentRating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRatingChange(criterionId, star)}
            activeOpacity={0.7}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= currentRating ? 'star' : 'star-outline'}
              size={responsive.moderateScale(28)}
              color={star <= currentRating ? '#FFC107' : colors.neutral.border}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getAverageRating = () => {
    const values = Object.values(ratings);
    if (values.length === 0) return 0;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Đánh giá dịch vụ</Text>
              {bookingCode && (
                <Text style={styles.bookingCode}>Đơn hàng: {bookingCode}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={responsive.moderateScale(24)} color={colors.neutral.label} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.highlight.teal} />
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Employee Info */}
              <View style={styles.employeeSection}>
                <View style={styles.employeeAvatar}>
                  <Ionicons name="person" size={responsive.moderateScale(32)} color={colors.neutral.white} />
                </View>
                <Text style={styles.employeeName}>{employeeName}</Text>
                <View style={styles.averageRating}>
                  <Ionicons name="star" size={responsive.moderateScale(18)} color="#FFC107" />
                  <Text style={styles.averageRatingText}>{getAverageRating()}</Text>
                </View>
              </View>

              {/* Criteria Ratings */}
              <View style={styles.criteriaSection}>
                {criteria.map(criterion => (
                  <View key={criterion.criterionId} style={styles.criterionItem}>
                    <Text style={styles.criterionName}>{criterion.criterionName}</Text>
                    {renderStars(criterion.criterionId, ratings[criterion.criterionId] || 5)}
                  </View>
                ))}
              </View>

              {/* Comment */}
              <View style={styles.commentSection}>
                <Text style={styles.commentLabel}>Nhận xét (tùy chọn)</Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                  placeholderTextColor={colors.neutral.label}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Error */}
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={responsive.moderateScale(18)} color={colors.feedback.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.neutral.white} />
              ) : (
                <>
                  <Ionicons name="send" size={responsive.moderateScale(18)} color={colors.neutral.white} />
                  <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: responsive.moderateScale(20),
    borderTopRightRadius: responsive.moderateScale(20),
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: responsiveSpacing.lg,
    paddingTop: responsiveSpacing.lg,
    paddingBottom: responsiveSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '700',
    color: colors.primary.navy,
  },
  bookingCode: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.label,
    marginTop: responsiveSpacing.xs,
  },
  closeButton: {
    padding: responsiveSpacing.xs,
  },
  loadingContainer: {
    padding: responsiveSpacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: responsiveSpacing.md,
    fontSize: responsiveFontSize.body,
    color: colors.neutral.label,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: responsiveSpacing.lg,
  },
  employeeSection: {
    alignItems: 'center',
    marginBottom: responsiveSpacing.lg,
  },
  employeeAvatar: {
    width: responsive.moderateScale(64),
    height: responsive.moderateScale(64),
    borderRadius: responsive.moderateScale(32),
    backgroundColor: colors.highlight.teal,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSpacing.sm,
  },
  employeeName: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.xs,
  },
  averageRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing.xs,
  },
  averageRatingText: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
  },
  criteriaSection: {
    marginBottom: responsiveSpacing.lg,
  },
  criterionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: responsiveSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  criterionName: {
    fontSize: responsiveFontSize.body,
    fontWeight: '500',
    color: colors.primary.navy,
    flex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: responsiveSpacing.xs,
  },
  starButton: {
    padding: responsiveSpacing.xs / 2,
  },
  commentSection: {
    marginBottom: responsiveSpacing.md,
  },
  commentLabel: {
    fontSize: responsiveFontSize.body,
    fontWeight: '500',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.sm,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: responsive.moderateScale(12),
    padding: responsiveSpacing.md,
    fontSize: responsiveFontSize.body,
    color: colors.primary.navy,
    minHeight: responsive.moderateScale(100),
    backgroundColor: colors.neutral.background,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing.sm,
    padding: responsiveSpacing.md,
    backgroundColor: colors.feedback.error + '15',
    borderRadius: responsive.moderateScale(8),
  },
  errorText: {
    flex: 1,
    fontSize: responsiveFontSize.caption,
    color: colors.feedback.error,
  },
  footer: {
    flexDirection: 'row',
    gap: responsiveSpacing.md,
    padding: responsiveSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: responsiveSpacing.md,
    borderRadius: responsive.moderateScale(12),
    borderWidth: 1,
    borderColor: colors.neutral.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.neutral.label,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsiveSpacing.sm,
    paddingVertical: responsiveSpacing.md,
    borderRadius: responsive.moderateScale(12),
    backgroundColor: colors.highlight.teal,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.neutral.white,
  },
});

export default ReviewModal;
