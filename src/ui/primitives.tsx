import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, fonts, memberTones, MIN_TOUCH, radius, shadow, spacing, type } from '../theme';
import { initials } from '../data/util';
import { FE_POSES, FeImage, type FeMode } from './Brand';

export type IconName = React.ComponentProps<typeof Feather>['name'];

export function Icon({ name, size = 20, color = colors.inkSoft }: { name: IconName; size?: number; color?: string }) {
  return <Feather name={name} size={size} color={color} />;
}

type Variant = keyof typeof type;
export function Txt({
  v = 'body',
  style,
  children,
  center,
  color,
  numberOfLines,
  onPress,
}: {
  v?: Variant;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
  center?: boolean;
  color?: string;
  numberOfLines?: number;
  onPress?: () => void;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      onPress={onPress}
      suppressHighlighting
      style={[type[v], center && { textAlign: 'center' }, color ? { color } : null, style]}
      accessibilityRole={onPress ? 'link' : v === 'display' || v === 'title' || v === 'heading' ? 'header' : undefined}
    >
      {children}
    </Text>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  small,
  style,
  testID,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'quiet' | 'danger';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const palette = {
    primary: { bg: colors.teal, fg: colors.inkInverse, border: colors.teal, pressed: colors.tealPressed },
    secondary: { bg: colors.surface, fg: colors.teal, border: colors.line, pressed: colors.tealSoft },
    ghost: { bg: 'transparent', fg: colors.teal, border: 'transparent', pressed: colors.tealSoft },
    quiet: { bg: colors.linenDeep, fg: colors.ink, border: colors.linenDeep, pressed: colors.line },
    danger: { bg: colors.surface, fg: colors.danger, border: colors.dangerSoft, pressed: colors.dangerSoft },
  }[variant];
  const off = disabled || loading;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: pressed && !off ? palette.pressed : palette.bg, borderColor: palette.border },
        off && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={small ? 16 : 18} color={palette.fg} /> : null}
          <Text style={[styles.btnText, small && { fontSize: 14 }, { color: palette.fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Card({
  children,
  style,
  tone = 'surface',
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'surface' | 'linen' | 'mist' | 'teal' | 'sand' | 'sage' | 'lavender' | 'terracotta';
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const bg = {
    surface: colors.surface,
    linen: colors.linenDeep,
    mist: colors.mist,
    teal: colors.tealSoft,
    sand: colors.sandSoft,
    sage: colors.sageSoft,
    lavender: colors.lavenderSoft,
    terracotta: colors.terracottaSoft,
  }[tone];
  const base = [styles.card, { backgroundColor: bg }, tone === 'surface' && shadow, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, pressed && { opacity: 0.85 }]}
    >
      {children}
    </Pressable>
  );
}

export function Section({
  title,
  action,
  onAction,
  children,
  style,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ marginTop: spacing.xl }, style]}>
      <View style={styles.sectionHead}>
        <Txt v="heading">{title}</Txt>
        {action && onAction ? (
          <Pressable accessibilityRole="link" onPress={onAction} hitSlop={10} style={styles.sectionAction}>
            <Text style={styles.link}>{action}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  error,
  secure,
  keyboardType,
  autoCapitalize,
  multiline,
  maxLength,
  testID,
  autoComplete,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string | null;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  maxLength?: number;
  testID?: string;
  autoComplete?: 'email' | 'password' | 'new-password' | 'name' | 'off';
}) {
  const [hidden, setHidden] = React.useState(!!secure);
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error ? { borderColor: colors.danger } : null]}>
        <TextInput
          testID={testID}
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inkMuted}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          autoComplete={autoComplete}
          multiline={multiline}
          maxLength={maxLength}
          style={[styles.input, multiline && { minHeight: 88, textAlignVertical: 'top', paddingTop: 12 }]}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Esconder senha'}
            onPress={() => setHidden((h) => !h)}
            style={styles.eye}
          >
            <Icon name={hidden ? 'eye' : 'eye-off'} size={18} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Icon name="info" size={14} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.segment} accessibilityRole="tablist">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(o.value)}
              style={[styles.segmentItem, active && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, active && { color: colors.ink, fontFamily: fonts.bodySemi }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}
    >
      {selected ? <Icon name="check" size={14} color={colors.teal} /> : icon ? <Icon name={icon} size={14} /> : null}
      <Text style={[styles.chipText, selected && { color: colors.teal }]}>{label}</Text>
    </Pressable>
  );
}

export function ToggleRow({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
      onPress={disabled ? undefined : () => onChange(!value)}
      style={[styles.toggleRow, disabled && { opacity: 0.5 }]}
    >
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Txt v="bodyStrong">{label}</Txt>
        {hint ? <Txt v="small">{hint}</Txt> : null}
      </View>
      <Switch
        value={value}
        onValueChange={disabled ? undefined : onChange}
        disabled={disabled}
        trackColor={{ true: colors.teal, false: colors.line }}
        thumbColor={colors.surface}
      />
    </Pressable>
  );
}

export function Avatar({ name, tone = 0, size = 40 }: { name: string; tone?: number; size?: number }) {
  const t = memberTones[tone % memberTones.length];
  return (
    <View
      accessible={false}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontFamily: fonts.titleMedium, fontSize: size * 0.38, color: t.fg }}>{initials(name)}</Text>
    </View>
  );
}

export function Pill({ label, tone = 'neutral', icon }: { label: string; tone?: 'neutral' | 'teal' | 'success' | 'attention' | 'danger' | 'lavender'; icon?: IconName }) {
  const p = {
    neutral: { bg: colors.linenDeep, fg: colors.inkSoft },
    teal: { bg: colors.tealSoft, fg: colors.teal },
    success: { bg: colors.successSoft, fg: colors.success },
    attention: { bg: colors.attentionSoft, fg: colors.attention },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    lavender: { bg: colors.lavenderSoft, fg: '#5C5690' },
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: p.bg }]}>
      {icon ? <Icon name={icon} size={12} color={p.fg} /> : null}
      <Text style={[styles.pillText, { color: p.fg }]}>{label}</Text>
    </View>
  );
}

export function Row({
  title,
  subtitle,
  left,
  right,
  onPress,
  chevron = !!onPress,
  testID,
  meta,
}: {
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  testID?: string;
}) {
  const content = (
    <>
      {left ? <View style={{ marginRight: spacing.sm }}>{left}</View> : null}
      <View style={{ flex: 1 }}>
        <Txt v="bodyStrong" numberOfLines={2}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt v="small" numberOfLines={3}>
            {subtitle}
          </Txt>
        ) : null}
        {meta ? <View style={{ marginTop: 6 }}>{meta}</View> : null}
      </View>
      {right ? <View style={{ marginLeft: spacing.xs }}>{right}</View> : null}
      {chevron ? <Icon name="chevron-right" size={18} color={colors.inkMuted} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.linen }]}
    >
      {content}
    </Pressable>
  );
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginLeft: spacing.md }} />;
}

export function ProgressBar({ percent, color = colors.teal, label }: { percent: number; color?: string; label?: string }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(p) }}
      style={styles.track}
    >
      <View style={[styles.fill, { width: `${p}%`, backgroundColor: color }]} />
    </View>
  );
}

/** Estado vazio. Com `fe`, a Fê curiosa (corpo inteiro) aparece no lugar do ícone — use no vazio principal da tela. */
export function Empty({ icon = 'feather', title, text, action, onAction, fe }: { icon?: IconName; title: string; text?: string; action?: string; onAction?: () => void; fe?: boolean }) {
  return (
    <View style={styles.empty}>
      {fe ? (
        <FeImage mode="curiosa" variant="body" height={112} style={{ marginBottom: spacing.sm }} />
      ) : (
        <View style={styles.emptyIcon}>
          <Icon name={icon} size={22} color={colors.teal} />
        </View>
      )}
      <Txt v="heading" center>
        {title}
      </Txt>
      {text ? (
        <Txt v="small" center style={{ marginTop: 4, maxWidth: 300 }}>
          {text}
        </Txt>
      ) : null}
      {action && onAction ? <Button label={action} onPress={onAction} variant="secondary" small style={{ marginTop: spacing.md }} /> : null}
    </View>
  );
}

/**
 * Fê — companheira narrativa. Mostra a arte do modo (catálogo em Brand.tsx); modo sem arte
 * aprovada (hoje, “orientar”) usa o selo de texto.
 */
export function FeNote({ children, mode = 'orientar' }: { children: React.ReactNode; mode?: FeMode }) {
  const tone = {
    receber: colors.sandSoft,
    convite: colors.sandSoft,
    orientar: colors.mist,
    curiosa: colors.mist,
    celebrar: colors.sageSoft,
    tranquilizar: colors.lavenderSoft,
    atencao: colors.attentionSoft,
  }[mode];
  return (
    <View style={[styles.fe, { backgroundColor: tone }]} accessibilityLabel="Mensagem da Fê">
      {FE_POSES[mode] ? (
        <FeImage height={mode === 'celebrar' ? 64 : 52} mode={mode} />
      ) : (
        <View style={styles.feBadge}>
          <Text style={styles.feBadgeText}>Fê</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        {typeof children === 'string' ? <Txt v="small" color={colors.ink}>{children}</Txt> : children}
      </View>
    </View>
  );
}

export function Stat({ label, value, icon }: { label: string; value: string; icon?: IconName }) {
  return (
    <View style={styles.stat}>
      {icon ? <Icon name={icon} size={16} color={colors.teal} /> : null}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function Banner({ tone = 'info', text, icon }: { tone?: 'info' | 'attention' | 'success'; text: string; icon?: IconName }) {
  const p = {
    info: { bg: colors.mist, fg: colors.inkSoft, i: 'info' as IconName },
    attention: { bg: colors.attentionSoft, fg: colors.attention, i: 'clock' as IconName },
    success: { bg: colors.successSoft, fg: colors.success, i: 'check-circle' as IconName },
  }[tone];
  return (
    <View style={[styles.banner, { backgroundColor: p.bg }]}>
      <Icon name={icon ?? p.i} size={16} color={p.fg} />
      <Text style={[styles.bannerText, { color: p.fg }]}>{text}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  btn: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
  },
  btnSmall: { minHeight: MIN_TOUCH, paddingHorizontal: spacing.md, borderRadius: radius.sm },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 16 },
  card: { borderRadius: radius.lg, padding: spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionAction: { minHeight: MIN_TOUCH, justifyContent: 'center' },
  link: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.teal },
  label: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
  },
  input: { flex: 1, minHeight: 50, paddingHorizontal: spacing.md, fontFamily: fonts.body, fontSize: 16, color: colors.ink },
  eye: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  hint: { fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, marginTop: 6 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.danger, flex: 1 },
  segment: { flexDirection: 'row', backgroundColor: colors.linenDeep, borderRadius: radius.md, padding: 4 },
  segmentItem: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, paddingHorizontal: 6 },
  segmentActive: { backgroundColor: colors.surface, ...shadow },
  segmentText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.inkSoft, textAlign: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipOn: { borderColor: colors.teal, backgroundColor: colors.tealSoft },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.inkSoft },
  toggleRow: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingVertical: spacing.xs },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  pillText: { fontFamily: fonts.bodySemi, fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.linenDeep, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  fe: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', padding: spacing.md, borderRadius: radius.lg },
  feBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  feBadgeText: { fontFamily: fonts.title, fontSize: 14, color: colors.teal },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, gap: 2, ...shadow },
  statValue: { fontFamily: fonts.title, fontSize: 20, color: colors.ink },
  statLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.sm, borderRadius: radius.md },
  bannerText: { fontFamily: fonts.bodyMedium, fontSize: 13, flex: 1 },
});
