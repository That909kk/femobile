import { StyleSheet } from 'react-native';
import { colors, responsive, responsiveSpacing, responsiveFontSize } from '../../../../styles';

// Design tokens
export const DESIGN_TOKENS = {
  spacing: {
    xs: responsiveSpacing.xs,
    sm: responsiveSpacing.sm,
    md: responsiveSpacing.md,
    lg: responsiveSpacing.lg,
    xl: responsiveSpacing.xl,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
  },
};

// Booking step colors
export const BookingColors = {
  step1: colors.highlight.teal,
  step2: '#FF8A65', // Coral
  step3: '#9B86BD', // Lavender
  step4: colors.primary.navy,
  step5: colors.feedback.success,
};

export const commonStyles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: responsiveSpacing.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.md,
    backgroundColor: colors.warm.beige,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSpacing.sm,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '700',
    color: colors.primary.navy,
  },
  headerSubtitle: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginTop: 2,
  },

  // Section
  section: {
    marginBottom: responsiveSpacing.md,
  },
  sectionTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '700',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.sm,
  },
  sectionSubtitle: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginBottom: responsiveSpacing.md,
  },

  // Card
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: responsiveSpacing.md,
    marginBottom: responsiveSpacing.md,
    borderWidth: 2,
    borderColor: colors.neutral.border,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardSelected: {
    borderColor: colors.highlight.teal,
    backgroundColor: colors.warm.beige,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSpacing.sm,
  },
  cardTitle: {
    fontSize: responsiveFontSize.body,
    fontWeight: '700',
    color: colors.primary.navy,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
  },
  cardDescription: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    lineHeight: responsiveFontSize.caption * 1.4,
  },
  cardPrice: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '700',
    color: colors.highlight.teal,
  },

  // Buttons
  primaryButton: {
    backgroundColor: colors.highlight.teal,
    paddingVertical: responsiveSpacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.highlight.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.neutral.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: colors.neutral.white,
    fontSize: responsiveFontSize.body,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colors.neutral.white,
    paddingVertical: responsiveSpacing.md,
    paddingHorizontal: responsiveSpacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.highlight.teal,
  },
  secondaryButtonText: {
    color: colors.highlight.teal,
    fontSize: responsiveFontSize.body,
    fontWeight: '700',
  },

  // Input
  inputContainer: {
    marginBottom: responsiveSpacing.md,
  },
  inputLabel: {
    fontSize: responsiveFontSize.caption,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    padding: responsiveSpacing.sm,
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textPrimary,
    backgroundColor: colors.neutral.white,
  },
  inputFocused: {
    borderColor: colors.highlight.teal,
    borderWidth: 2,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveSpacing.xxl,
  },
  loadingText: {
    marginTop: responsiveSpacing.sm,
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },

  // Flex
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flexRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flexColumn: {
    flexDirection: 'column',
  },

  // Button Container
  buttonContainer: {
    padding: responsiveSpacing.md,
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },

  // Badge
  badge: {
    paddingHorizontal: responsiveSpacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: responsiveFontSize.caption - 2,
    fontWeight: '600',
  },
  badgeSuccess: {
    backgroundColor: colors.feedback.success + '20',
  },
  badgeSuccessText: {
    color: colors.feedback.success,
  },
  badgeWarning: {
    backgroundColor: colors.feedback.warning + '20',
  },
  badgeWarningText: {
    color: colors.feedback.warning,
  },
  badgeError: {
    backgroundColor: colors.feedback.error + '20',
  },
  badgeErrorText: {
    color: colors.feedback.error,
  },
  badgeInfo: {
    backgroundColor: colors.highlight.teal + '20',
  },
  badgeInfoText: {
    color: colors.highlight.teal,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.neutral.border,
    marginVertical: responsiveSpacing.sm,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveSpacing.xxl,
  },
  emptyTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '700',
    color: colors.neutral.textSecondary,
    marginTop: responsiveSpacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    marginTop: responsiveSpacing.xs,
    textAlign: 'center',
  },

  // Error
  errorContainer: {
    backgroundColor: colors.feedback.error + '15',
    borderRadius: 12,
    padding: responsiveSpacing.md,
    marginBottom: responsiveSpacing.md,
  },
  errorText: {
    fontSize: responsiveFontSize.caption,
    color: colors.feedback.error,
    textAlign: 'center',
  },

  // Info Box
  infoBox: {
    backgroundColor: colors.highlight.teal + '15',
    borderRadius: 12,
    padding: responsiveSpacing.md,
    marginBottom: responsiveSpacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: responsiveSpacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: responsiveFontSize.caption,
    color: colors.primary.navy,
    lineHeight: responsiveFontSize.caption * 1.4,
  },

  // Checkbox
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: responsiveSpacing.md,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textPrimary,
    marginLeft: responsiveSpacing.sm,
    lineHeight: responsiveFontSize.caption * 1.5,
  },

  // Progress Indicator
  progressContainer: {
    paddingHorizontal: responsiveSpacing.lg,
    paddingVertical: responsiveSpacing.lg,
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    marginHorizontal: responsiveSpacing.md,
    marginTop: responsiveSpacing.md,
    marginBottom: responsiveSpacing.sm,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.neutral.border + '40',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: responsiveSpacing.lg,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressStepIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSpacing.xs,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressStepIconActive: {
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  progressStepIconCompleted: {
    shadowColor: colors.feedback.success,
  },
  progressStepText: {
    fontSize: responsiveFontSize.caption - 1,
    textAlign: 'center',
    fontWeight: '500',
  },
  progressStepTextActive: {
    fontWeight: '700',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  progressDotActive: {
    backgroundColor: colors.highlight.teal,
  },
  progressDotCompleted: {
    backgroundColor: colors.feedback.success,
  },
  progressDotInactive: {
    backgroundColor: colors.neutral.border,
  },
  progressText: {
    fontSize: responsiveFontSize.caption - 2,
    textAlign: 'center',
  },
  progressTextActive: {
    color: colors.highlight.teal,
    fontWeight: '600',
  },
  progressTextInactive: {
    color: colors.neutral.textSecondary,
  },
  progressLine: {
    height: 2,
    flex: 1,
    backgroundColor: colors.neutral.border,
    marginHorizontal: 4,
    marginBottom: 20,
  },
  progressLineCompleted: {
    backgroundColor: colors.feedback.success,
  },
});

// Export as BookingStyles for compatibility
export const BookingStyles = commonStyles;
