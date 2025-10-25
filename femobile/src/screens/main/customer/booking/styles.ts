import { StyleSheet, Dimensions } from 'react-native';
import { colors, responsive, responsiveSpacing, responsiveFontSize } from '../../../../styles';

const { width, height } = Dimensions.get('window');

export const commonStyles = StyleSheet.create({
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: responsiveSpacing.md,
    paddingBottom: responsiveSpacing.xxl * 2,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.md,
    backgroundColor: colors.warm.beige,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
    elevation: 2,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: responsiveSpacing.xs,
    marginRight: responsiveSpacing.sm,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '600',
    color: colors.primary.navy,
  },
  headerSubtitle: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginTop: 2,
  },

  // Progress Indicator
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.md,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  progressStep: {
    flex: 1,
    alignItems: 'center',
  },
  progressDot: {
    width: responsive.moderateScale(24),
    height: responsive.moderateScale(24),
    borderRadius: responsive.moderateScale(12),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  progressDotActive: {
    backgroundColor: colors.highlight.teal,
    borderColor: colors.highlight.teal,
  },
  progressDotInactive: {
    backgroundColor: colors.neutral.white,
    borderColor: colors.neutral.border,
  },
  progressDotCompleted: {
    backgroundColor: colors.feedback.success,
    borderColor: colors.feedback.success,
  },
  progressText: {
    fontSize: responsiveFontSize.caption - 4,
    textAlign: 'center',
    marginTop: 4,
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
    backgroundColor: colors.neutral.border,
    position: 'absolute',
    top: 11,
    width: '100%',
    zIndex: -1,
  },
  progressLineCompleted: {
    backgroundColor: colors.feedback.success,
  },

  // Section Styles
  section: {
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(16),
    padding: responsiveSpacing.md,
    marginVertical: responsiveSpacing.sm,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: responsive.moderateScale(4) },
    shadowOpacity: 0.1,
    shadowRadius: responsive.moderateScale(16),
    elevation: 4,
  },
  sectionTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.md,
  },
  sectionSubtitle: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginBottom: responsiveSpacing.sm,
  },

  // Card Styles
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(12),
    padding: responsiveSpacing.md,
    marginVertical: responsiveSpacing.xs,
    borderWidth: 1,
    borderColor: colors.neutral.border,
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
    fontWeight: '600',
    color: colors.primary.navy,
    flex: 1,
  },
  cardSubtitle: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    lineHeight: responsiveFontSize.caption * 1.4,
  },
  cardPrice: {
    fontSize: responsiveFontSize.body,
    fontWeight: '700',
    color: colors.highlight.teal,
    textAlign: 'right',
  },

  // Button Styles
  buttonContainer: {
    padding: responsiveSpacing.md,
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  primaryButton: {
    backgroundColor: colors.highlight.teal,
    paddingVertical: responsiveSpacing.md,
    paddingHorizontal: responsiveSpacing.lg,
    borderRadius: responsive.moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: responsiveSpacing.sm,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: responsive.moderateScale(2) },
    shadowOpacity: 0.15,
    shadowRadius: responsive.moderateScale(6),
    elevation: 3,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.neutral.label,
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.neutral.white,
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.neutral.white,
    paddingVertical: responsiveSpacing.md,
    paddingHorizontal: responsiveSpacing.lg,
    borderRadius: responsive.moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.highlight.teal,
    marginTop: responsiveSpacing.sm,
  },
  secondaryButtonText: {
    color: colors.highlight.teal,
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
  },

  // Input Styles
  inputContainer: {
    marginVertical: responsiveSpacing.sm,
  },
  inputLabel: {
    fontSize: responsiveFontSize.caption,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: responsive.moderateScale(8),
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.sm,
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textPrimary,
    backgroundColor: colors.neutral.white,
  },
  inputFocused: {
    borderColor: colors.highlight.teal,
  },
  inputError: {
    borderColor: colors.feedback.error,
  },
  inputErrorText: {
    color: colors.feedback.error,
    fontSize: responsiveFontSize.caption - 2,
    marginTop: 4,
  },

  // List Styles
  listContainer: {
    paddingHorizontal: responsiveSpacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: responsiveSpacing.md,
    paddingHorizontal: responsiveSpacing.md,
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(12),
    marginVertical: responsiveSpacing.xs,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  listItemSelected: {
    borderColor: colors.highlight.teal,
    backgroundColor: colors.warm.beige,
  },
  listItemContent: {
    flex: 1,
    marginLeft: responsiveSpacing.sm,
  },
  listItemTitle: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
  },
  listItemSubtitle: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginTop: 2,
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: responsiveSpacing.xxl,
  },
  loadingText: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    marginTop: responsiveSpacing.md,
  },

  // Error Styles
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: responsiveSpacing.xxl,
  },
  errorText: {
    fontSize: responsiveFontSize.body,
    color: colors.feedback.error,
    textAlign: 'center',
    marginTop: responsiveSpacing.md,
  },

  // Utility Styles
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flexRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textCenter: {
    textAlign: 'center',
  },
  textRight: {
    textAlign: 'right',
  },
  marginVertical: {
    marginVertical: responsiveSpacing.sm,
  },
  marginHorizontal: {
    marginHorizontal: responsiveSpacing.sm,
  },

  // Checkbox Styles
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: responsiveSpacing.sm,
  },
  checkbox: {
    width: responsive.moderateScale(20),
    height: responsive.moderateScale(20),
    borderRadius: responsive.moderateScale(4),
    borderWidth: 2,
    borderColor: colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: responsiveSpacing.sm,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.highlight.teal,
    borderColor: colors.highlight.teal,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textPrimary,
    lineHeight: responsiveFontSize.caption * 1.4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 28, 45, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(16),
    padding: responsiveSpacing.lg,
    margin: responsiveSpacing.md,
    maxHeight: height * 0.8,
  },
  modalTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.md,
    textAlign: 'center',
  },
  modalContent: {
    marginBottom: responsiveSpacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: responsiveSpacing.sm,
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: responsiveSpacing.sm,
    paddingHorizontal: responsiveSpacing.md,
    borderRadius: responsive.moderateScale(8),
    alignItems: 'center',
  },
  modalActionPrimary: {
    backgroundColor: colors.highlight.teal,
  },
  modalActionSecondary: {
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  modalActionText: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
  },
  modalActionTextPrimary: {
    color: colors.neutral.white,
  },
  modalActionTextSecondary: {
    color: colors.primary.navy,
  },
});

export default commonStyles;