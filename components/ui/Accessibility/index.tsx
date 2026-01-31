import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

interface AccessibilitySettings { isScreenReaderEnabled: boolean; isHighContrastEnabled: boolean; useLargerTouchTargets: boolean; reduceMotion: boolean; fontScale: 'normal' | 'large' | 'xlarge'; }
interface AccessibilityContextType extends AccessibilitySettings { toggleHighContrast: () => void; toggleLargerTouchTargets: () => void; setFontScale: (scale: 'normal' | 'large' | 'xlarge') => void; }

const defaultSettings: AccessibilitySettings = { isScreenReaderEnabled: false, isHighContrastEnabled: false, useLargerTouchTargets: false, reduceMotion: false, fontScale: 'normal' };
const AccessibilityContext = createContext<AccessibilityContextType>({ ...defaultSettings, toggleHighContrast: () => {}, toggleLargerTouchTargets: () => {}, setFontScale: () => {} });

export const useAccessibility = () => useContext(AccessibilityContext);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then((e) => setSettings((p) => ({ ...p, isScreenReaderEnabled: e })));
    AccessibilityInfo.isReduceMotionEnabled().then((e) => setSettings((p) => ({ ...p, reduceMotion: e })));
    const s = AccessibilityInfo.addEventListener('screenReaderChanged', (e) => setSettings((p) => ({ ...p, isScreenReaderEnabled: e })));
    const r = AccessibilityInfo.addEventListener('reduceMotionChanged', (e) => setSettings((p) => ({ ...p, reduceMotion: e })));
    return () => { s.remove(); r.remove(); };
  }, []);
  const value: AccessibilityContextType = { ...settings, toggleHighContrast: () => setSettings((p) => ({ ...p, isHighContrastEnabled: !p.isHighContrastEnabled })), toggleLargerTouchTargets: () => setSettings((p) => ({ ...p, useLargerTouchTargets: !p.useLargerTouchTargets })), setFontScale: (scale) => setSettings((p) => ({ ...p, fontScale: scale })) };
  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export const highContrastColors = {
  light: { background: '#FFFFFF', text: '#000000', textSecondary: '#1A1A1A', primary: '#0052CC', primaryDark: '#003D99', success: '#006644', error: '#CC0000', warning: '#995700', border: '#000000', card: '#F5F5F5', divider: '#333333' },
  dark: { background: '#000000', text: '#FFFFFF', textSecondary: '#E5E5E5', primary: '#66B3FF', primaryDark: '#3399FF', success: '#66FF99', error: '#FF6666', warning: '#FFCC66', border: '#FFFFFF', card: '#1A1A1A', divider: '#CCCCCC' },
};

export function useHighContrastColors() {
  const { isHighContrastEnabled } = useAccessibility();
  const { colors, isDark } = useAppTheme();
  return isHighContrastEnabled ? (isDark ? highContrastColors.dark : highContrastColors.light) : colors;
}

interface BtnProps { onPress: () => void; label: string; hint?: string; icon?: keyof typeof Ionicons.glyphMap; disabled?: boolean; variant?: 'primary' | 'secondary' | 'outline'; size?: 'small' | 'medium' | 'large'; style?: StyleProp<ViewStyle>; children?: React.ReactNode; }

export function AccessibleButton({ onPress, label, hint, icon, disabled = false, variant = 'primary', size = 'medium', style, children }: BtnProps) {
  const { useLargerTouchTargets, reduceMotion, fontScale } = useAccessibility();
  const colors = useHighContrastColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const getMinSize = () => useLargerTouchTargets ? { minHeight: 56, minWidth: 56 } : size === 'small' ? { minHeight: 44, minWidth: 44 } : { minHeight: 48, minWidth: 48 };
  const getFontSize = () => (size === 'small' ? 14 : size === 'large' ? 18 : 16) * (fontScale === 'xlarge' ? 1.4 : fontScale === 'large' ? 1.2 : 1);
  const vs = variant === 'secondary' ? { bg: colors.card, text: colors.text, border: colors.border } : variant === 'outline' ? { bg: 'transparent', text: colors.primary, border: colors.primary } : { bg: colors.primary, text: '#FFF', border: colors.primary };
  const pressIn = () => { if (!reduceMotion) Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start(); };
  const pressOut = () => { if (!reduceMotion) Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start(); };
  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} disabled={disabled} accessible accessibilityLabel={label} accessibilityHint={hint} accessibilityRole="button" accessibilityState={{ disabled }}>
      <Animated.View style={[st.btn, { backgroundColor: vs.bg, borderColor: vs.border, borderWidth: variant === 'outline' ? 2 : 0, ...getMinSize(), opacity: disabled ? 0.5 : 1, transform: [{ scale: scaleAnim }] }, style]}>
        {icon && <Ionicons name={icon} size={getFontSize() + 4} color={vs.text} style={st.btnIcon} />}
        {children || <Text style={[st.btnText, { color: vs.text, fontSize: getFontSize() }]}>{label}</Text>}
      </Animated.View>
    </Pressable>
  );
}


interface CardProps { children: React.ReactNode; label: string; hint?: string; onPress?: () => void; style?: StyleProp<ViewStyle>; }
export function AccessibleCard({ children, label, hint, onPress, style }: CardProps) {
  const { useLargerTouchTargets, isHighContrastEnabled } = useAccessibility();
  const colors = useHighContrastColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressIn = () => { if (onPress) Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true, speed: 50 }).start(); };
  const pressOut = () => { if (onPress) Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start(); };
  const content = <Animated.View style={[st.card, { backgroundColor: colors.card, borderColor: isHighContrastEnabled ? colors.border : 'transparent', borderWidth: isHighContrastEnabled ? 2 : 0, padding: useLargerTouchTargets ? 20 : 16, transform: [{ scale: scaleAnim }] }, style]}>{children}</Animated.View>;
  if (onPress) return <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} accessible accessibilityLabel={label} accessibilityHint={hint} accessibilityRole="button">{content}</Pressable>;
  return <View accessible accessibilityLabel={label} accessibilityRole="summary">{content}</View>;
}

interface TxtProps { children: React.ReactNode; variant?: 'heading' | 'subheading' | 'body' | 'caption' | 'label'; weight?: 'normal' | 'medium' | 'bold'; color?: string; align?: 'left' | 'center' | 'right'; style?: StyleProp<TextStyle>; }
export function AccessibleText({ children, variant = 'body', weight = 'normal', color, align = 'left', style }: TxtProps) {
  const { fontScale } = useAccessibility();
  const colors = useHighContrastColors();
  const base = variant === 'heading' ? 28 : variant === 'subheading' ? 20 : variant === 'caption' ? 12 : variant === 'label' ? 14 : 16;
  const scaled = base * (fontScale === 'xlarge' ? 1.4 : fontScale === 'large' ? 1.2 : 1);
  const fw: TextStyle['fontWeight'] = variant === 'heading' ? '700' : variant === 'subheading' ? '600' : weight === 'bold' ? '700' : weight === 'medium' ? '500' : '400';
  return <Text style={[{ fontSize: scaled, fontWeight: fw, color: color || (variant === 'caption' ? colors.textSecondary : colors.text), textAlign: align, lineHeight: scaled * 1.4 }, style]} accessible accessibilityRole={variant === 'heading' ? 'header' : 'text'}>{children}</Text>;
}

interface IconBtnProps { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; label: string; hint?: string; size?: 'small' | 'medium' | 'large'; color?: string; backgroundColor?: string; disabled?: boolean; style?: StyleProp<ViewStyle>; }
export function AccessibleIconButton({ icon, onPress, label, hint, size = 'medium', color, backgroundColor, disabled = false, style }: IconBtnProps) {
  const { useLargerTouchTargets, reduceMotion } = useAccessibility();
  const colors = useHighContrastColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const btnSize = (size === 'small' ? 40 : size === 'large' ? 60 : 48) + (useLargerTouchTargets ? 12 : 0);
  const iconSize = size === 'small' ? 20 : size === 'large' ? 28 : 24;
  const iconColor = color || colors.primary;
  const pressIn = () => { if (!reduceMotion) Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true, speed: 50 }).start(); };
  const pressOut = () => { if (!reduceMotion) Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 8 }).start(); };
  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} disabled={disabled} accessible accessibilityLabel={label} accessibilityHint={hint} accessibilityRole="button" accessibilityState={{ disabled }}>
      <Animated.View style={[st.iconBtn, { width: btnSize, height: btnSize, borderRadius: btnSize / 2, backgroundColor: backgroundColor || `${iconColor}15`, opacity: disabled ? 0.5 : 1, transform: [{ scale: scaleAnim }] }, style]}>
        <Ionicons name={icon} size={iconSize} color={iconColor} />
      </Animated.View>
    </Pressable>
  );
}

interface ProgressProps { progress: number; label: string; showPercentage?: boolean; color?: string; height?: number; style?: StyleProp<ViewStyle>; }
export function AccessibleProgress({ progress, label, showPercentage = true, color, height = 8, style }: ProgressProps) {
  const { useLargerTouchTargets, isHighContrastEnabled, reduceMotion } = useAccessibility();
  const colors = useHighContrastColors();
  const widthAnim = useRef(new Animated.Value(0)).current;
  const barHeight = useLargerTouchTargets ? height + 4 : height;
  const clamped = Math.min(Math.max(progress, 0), 100);
  useEffect(() => { reduceMotion ? widthAnim.setValue(clamped) : Animated.timing(widthAnim, { toValue: clamped, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [clamped, reduceMotion]);
  const animWidth = widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View style={[st.progressContainer, style]} accessible accessibilityLabel={`${label}: ${Math.round(clamped)} percent`} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: clamped }}>
      {showPercentage && <View style={st.progressHeader}><AccessibleText variant="label">{label}</AccessibleText><AccessibleText variant="label" weight="bold">{Math.round(clamped)}%</AccessibleText></View>}
      <View style={[st.progressTrack, { height: barHeight, backgroundColor: colors.card, borderColor: isHighContrastEnabled ? colors.border : 'transparent', borderWidth: isHighContrastEnabled ? 1 : 0 }]}>
        <Animated.View style={[st.progressFill, { width: animWidth, backgroundColor: color || colors.primary, height: barHeight }]} />
      </View>
    </View>
  );
}

interface ToggleProps { value: boolean; onValueChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean; style?: StyleProp<ViewStyle>; }
export function AccessibleToggle({ value, onValueChange, label, description, disabled = false, style }: ToggleProps) {
  const { useLargerTouchTargets, isHighContrastEnabled, reduceMotion } = useAccessibility();
  const colors = useHighContrastColors();
  const translateAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const trackW = useLargerTouchTargets ? 60 : 52, trackH = useLargerTouchTargets ? 32 : 28, thumbS = useLargerTouchTargets ? 26 : 22;
  useEffect(() => { reduceMotion ? translateAnim.setValue(value ? 1 : 0) : Animated.spring(translateAnim, { toValue: value ? 1 : 0, useNativeDriver: true, speed: 20, bounciness: 8 }).start(); }, [value, reduceMotion]);
  const thumbX = translateAnim.interpolate({ inputRange: [0, 1], outputRange: [2, trackW - thumbS - 2] });
  return (
    <Pressable onPress={() => !disabled && onValueChange(!value)} disabled={disabled} accessible accessibilityLabel={`${label}${description ? `, ${description}` : ''}`} accessibilityRole="switch" accessibilityState={{ checked: value, disabled }} style={[st.toggleContainer, { opacity: disabled ? 0.5 : 1 }, style]}>
      <View style={st.toggleContent}><AccessibleText variant="body" weight="medium">{label}</AccessibleText>{description && <AccessibleText variant="caption" style={st.toggleDesc}>{description}</AccessibleText>}</View>
      <View style={[st.toggleTrack, { width: trackW, height: trackH, backgroundColor: value ? colors.primary : colors.card, borderColor: isHighContrastEnabled ? colors.border : value ? colors.primary : colors.textSecondary, borderWidth: isHighContrastEnabled ? 2 : 1 }]}>
        <Animated.View style={[st.toggleThumb, { width: thumbS, height: thumbS, backgroundColor: value ? '#FFF' : colors.textSecondary, transform: [{ translateX: thumbX }] }]} />
      </View>
    </Pressable>
  );
}


interface ListItemProps { title: string; subtitle?: string; leftIcon?: keyof typeof Ionicons.glyphMap; rightIcon?: keyof typeof Ionicons.glyphMap; onPress?: () => void; disabled?: boolean; style?: StyleProp<ViewStyle>; }
export function AccessibleListItem({ title, subtitle, leftIcon, rightIcon = 'chevron-forward', onPress, disabled = false, style }: ListItemProps) {
  const { useLargerTouchTargets, isHighContrastEnabled } = useAccessibility();
  const colors = useHighContrastColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const minH = useLargerTouchTargets ? 64 : 56;
  const pressIn = () => { if (onPress) Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true, speed: 50 }).start(); };
  const pressOut = () => { if (onPress) Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start(); };
  const content = (
    <Animated.View style={[st.listItem, { minHeight: minH, backgroundColor: colors.card, borderColor: isHighContrastEnabled ? colors.border : 'transparent', borderWidth: isHighContrastEnabled ? 1 : 0, transform: [{ scale: scaleAnim }] }, style]}>
      {leftIcon && <View style={[st.listItemIcon, { backgroundColor: `${colors.primary}15` }]}><Ionicons name={leftIcon} size={22} color={colors.primary} /></View>}
      <View style={st.listItemContent}><AccessibleText variant="body" weight="medium">{title}</AccessibleText>{subtitle && <AccessibleText variant="caption" style={st.listItemSub}>{subtitle}</AccessibleText>}</View>
      {onPress && rightIcon && <Ionicons name={rightIcon} size={20} color={colors.textSecondary} />}
    </Animated.View>
  );
  if (onPress) return <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} disabled={disabled} accessible accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ''}`} accessibilityHint="Double tap to open" accessibilityRole="button" accessibilityState={{ disabled }}>{content}</Pressable>;
  return <View accessible accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ''}`}>{content}</View>;
}

export const announceForAccessibility = (msg: string) => AccessibilityInfo.announceForAccessibility(msg);
export const setAccessibilityFocus = (ref: React.RefObject<View>) => { if (ref.current && Platform.OS !== 'web') AccessibilityInfo.setAccessibilityFocus(ref.current as unknown as number); };

const st = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 12 },
  btnIcon: { marginRight: 8 },
  btnText: { fontWeight: '600' },
  card: { borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  iconBtn: { alignItems: 'center', justifyContent: 'center' },
  progressContainer: { width: '100%' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressTrack: { borderRadius: 100, overflow: 'hidden' },
  progressFill: { borderRadius: 100 },
  toggleContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  toggleContent: { flex: 1, marginRight: 16 },
  toggleDesc: { marginTop: 2 },
  toggleTrack: { borderRadius: 100, justifyContent: 'center' },
  toggleThumb: { borderRadius: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginBottom: 8 },
  listItemIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  listItemContent: { flex: 1 },
  listItemSub: { marginTop: 2 },
});

export default AccessibilityProvider;