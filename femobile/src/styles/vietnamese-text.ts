import { StyleSheet, TextStyle } from 'react-native';
import { COLORS, UI } from '../constants';

// Vietnamese text styles with proper font support
export const vietnameseTextStyles = StyleSheet.create({
  heading1: {
    fontSize: UI.TYPOGRAPHY.fontSize['3xl'],
    fontWeight: UI.TYPOGRAPHY.fontWeight.bold as TextStyle['fontWeight'],
    fontFamily: UI.TYPOGRAPHY.fontFamily.primary,
    color: COLORS.text.primary,
    lineHeight: UI.TYPOGRAPHY.fontSize['3xl'] * UI.TYPOGRAPHY.lineHeight.tight,
  },
  heading2: {
    fontSize: UI.TYPOGRAPHY.fontSize['2xl'],
    fontWeight: UI.TYPOGRAPHY.fontWeight.semibold as TextStyle['fontWeight'],
    fontFamily: UI.TYPOGRAPHY.fontFamily.primary,
    color: COLORS.text.primary,
    lineHeight: UI.TYPOGRAPHY.fontSize['2xl'] * UI.TYPOGRAPHY.lineHeight.tight,
  },
  heading3: {
    fontSize: UI.TYPOGRAPHY.fontSize.xl,
    fontWeight: UI.TYPOGRAPHY.fontWeight.semibold as TextStyle['fontWeight'],
    fontFamily: UI.TYPOGRAPHY.fontFamily.primary,
    color: COLORS.text.primary,
    lineHeight: UI.TYPOGRAPHY.fontSize.xl * UI.TYPOGRAPHY.lineHeight.normal,
  },
  body: {
    fontSize: UI.TYPOGRAPHY.fontSize.base,
    fontWeight: UI.TYPOGRAPHY.fontWeight.normal as TextStyle['fontWeight'],
    fontFamily: UI.TYPOGRAPHY.fontFamily.vietnamese,
    color: COLORS.text.primary,
    lineHeight: UI.TYPOGRAPHY.fontSize.base * UI.TYPOGRAPHY.lineHeight.normal,
  },
  bodySecondary: {
    fontSize: UI.TYPOGRAPHY.fontSize.base,
    fontWeight: UI.TYPOGRAPHY.fontWeight.normal as TextStyle['fontWeight'],
    fontFamily: UI.TYPOGRAPHY.fontFamily.vietnamese,
    color: COLORS.text.secondary,
    lineHeight: UI.TYPOGRAPHY.fontSize.base * UI.TYPOGRAPHY.lineHeight.normal,
  },
  caption: {
    fontSize: UI.TYPOGRAPHY.fontSize.sm,
    fontWeight: UI.TYPOGRAPHY.fontWeight.normal as TextStyle['fontWeight'],
    fontFamily: UI.TYPOGRAPHY.fontFamily.vietnamese,
    color: COLORS.text.secondary,
    lineHeight: UI.TYPOGRAPHY.fontSize.sm * UI.TYPOGRAPHY.lineHeight.normal,
  },
  button: {
    fontSize: UI.TYPOGRAPHY.fontSize.base,
    fontWeight: UI.TYPOGRAPHY.fontWeight.semibold as TextStyle['fontWeight'],
    fontFamily: UI.TYPOGRAPHY.fontFamily.primary,
    textAlign: 'center' as TextStyle['textAlign'],
  },
});

export default vietnameseTextStyles;