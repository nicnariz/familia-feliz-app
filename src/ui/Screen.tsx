import { router } from 'expo-router';
import React, { createContext, useContext } from 'react';
import { ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

/** Fundo do app: ilustração da Fê lendo, já em tons claros. Enviada pelo PO em 02/11/2026. */
const BACKGROUND = require('../../assets/brand/fundo-app.png');
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, MIN_TOUCH, spacing } from '../theme';
import { Logo } from './Brand';
import { Icon, type IconName, Txt } from './primitives';

/** Verdadeiro dentro da navegação por abas: a barra inferior já cuida da margem de baixo. */
export const InTabs = createContext(false);

export function Screen({
  title,
  subtitle,
  back = true,
  children,
  footer,
  right,
  scroll = true,
  tab = false,
  bg = colors.linen,
}: {
  title?: string;
  subtitle?: string;
  back?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  right?: { icon: IconName; label: string; onPress: () => void; badge?: number };
  scroll?: boolean;
  tab?: boolean;
  bg?: string;
}) {
  const inTabs = useContext(InTabs);
  const header =
    title || back || right ? (
      <View style={[s.header, tab && { paddingTop: spacing.sm }]}>
        {back && !tab ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={s.iconBtn}
            hitSlop={6}
          >
            <Icon name="arrow-left" size={22} color={colors.ink} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          {title ? (
            <Txt v={tab ? 'title' : 'heading'} numberOfLines={2}>
              {title}
            </Txt>
          ) : null}
          {subtitle ? <Txt v="small">{subtitle}</Txt> : null}
        </View>
        {right ? (
          <Pressable accessibilityRole="button" accessibilityLabel={right.label} onPress={right.onPress} style={s.iconBtn} hitSlop={6}>
            <Icon name={right.icon} size={22} color={colors.ink} />
            {right.badge ? (
              <View style={s.badge}>
                <Text style={s.badgeText}>{right.badge > 9 ? '9+' : right.badge}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>
    ) : null;

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[s.content, footer ? { paddingBottom: spacing.lg } : null]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[s.content, { flex: 1 }]}>{children}</View>
  );

  return (
    <ImageBackground source={BACKGROUND} resizeMode="cover" style={[s.safe, { backgroundColor: bg }]} imageStyle={s.bgImage}>
    <SafeAreaView style={s.safe} edges={tab || inTabs ? ['top'] : ['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {header}
        <View style={{ flex: 1 }}>{body}</View>
        {footer ? <View style={s.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  bgImage: { opacity: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, gap: spacing.xs, minHeight: 56 },
  iconBtn: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: MIN_TOUCH / 2 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, paddingTop: spacing.xs, maxWidth: 640, width: '100%', alignSelf: 'center' },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.xs, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, backgroundColor: 'rgba(247,243,236,0.92)', maxWidth: 640, width: '100%', alignSelf: 'center' },
  badge: { position: 'absolute', top: 6, right: 4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.terracotta, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: colors.inkInverse, fontFamily: fonts.bodySemi, fontSize: 11 },
});

/** Assinatura oficial (Fê + Família Feliz + slogan). */
export function Wordmark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return <Logo width={size === 'lg' ? 280 : 240} />;
}
