// Diálogos de confirmação/entrada e avisos breves, renderizados como sobreposição no layout raiz.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, motion, radius, spacing } from '../theme';
import { Button, Txt } from './primitives';
import { onSyncNotice } from '../data/store';

type ConfirmOpts = { title: string; message?: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean };
type PromptOpts = ConfirmOpts & { placeholder?: string; initial?: string; keyboardType?: 'default' | 'number-pad'; minLength?: number };

type DialogState =
  | { kind: 'confirm'; opts: ConfirmOpts; resolve: (v: boolean) => void }
  | { kind: 'prompt'; opts: PromptOpts; resolve: (v: string | null) => void }
  | null;

interface FeedbackApi {
  confirm: (o: ConfirmOpts) => Promise<boolean>;
  prompt: (o: PromptOpts) => Promise<string | null>;
  toast: (message: string) => void;
}

const Ctx = createContext<FeedbackApi | null>(null);

export function useFeedback(): FeedbackApi {
  const c = useContext(Ctx);
  if (!c) throw new Error('FeedbackProvider ausente');
  return c;
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const fade = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const confirm = useCallback(
    (opts: ConfirmOpts) => new Promise<boolean>((resolve) => setDialog({ kind: 'confirm', opts, resolve })),
    [],
  );
  const prompt = useCallback(
    (opts: PromptOpts) =>
      new Promise<string | null>((resolve) => {
        setInput(opts.initial ?? '');
        setDialog({ kind: 'prompt', opts, resolve });
      }),
    [],
  );
  const toast = useCallback(
    (message: string) => {
      setToastMsg(message);
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: motion.fade, useNativeDriver: true }).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        Animated.timing(fade, { toValue: 0, duration: motion.fade, useNativeDriver: true }).start(() => setToastMsg(null));
      }, 2600);
    },
    [fade],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // Quando o servidor recusa uma alteração feita aqui, avisa a pessoa (o app já voltou ao estado oficial).
  useEffect(() => onSyncNotice(toast), [toast]);

  const close = (value: boolean | string | null) => {
    if (!dialog) return;
    if (dialog.kind === 'confirm') dialog.resolve(value === true);
    else dialog.resolve(typeof value === 'string' ? value : null);
    setDialog(null);
  };

  const min = dialog?.kind === 'prompt' ? dialog.opts.minLength ?? 1 : 0;

  return (
    <Ctx.Provider value={{ confirm, prompt, toast }}>
      {children}
      {dialog ? (
        <View style={s.overlay} accessibilityViewIsModal>
          <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Fechar" onPress={() => close(dialog.kind === 'confirm' ? false : null)} />
          <View style={s.sheet} accessibilityRole="alert">
            <Txt v="heading">{dialog.opts.title}</Txt>
            {dialog.opts.message ? (
              <Txt v="body" color={colors.inkSoft} style={{ marginTop: spacing.xs }}>
                {dialog.opts.message}
              </Txt>
            ) : null}
            {dialog.kind === 'prompt' ? (
              <TextInput
                autoFocus
                testID="dialog-input"
                accessibilityLabel={dialog.opts.title}
                value={input}
                onChangeText={setInput}
                placeholder={dialog.opts.placeholder}
                placeholderTextColor={colors.inkMuted}
                keyboardType={dialog.opts.keyboardType}
                multiline={dialog.opts.keyboardType !== 'number-pad'}
                style={s.input}
              />
            ) : null}
            <View style={s.actions}>
              <Button
                label={dialog.opts.cancelLabel ?? 'Voltar'}
                variant="quiet"
                small
                style={{ flex: 1 }}
                onPress={() => close(dialog.kind === 'confirm' ? false : null)}
              />
              <Button
                testID="dialog-confirm"
                label={dialog.opts.confirmLabel ?? 'Confirmar'}
                variant={dialog.opts.destructive ? 'danger' : 'primary'}
                small
                style={{ flex: 1 }}
                disabled={dialog.kind === 'prompt' && input.trim().length < min}
                onPress={() => close(dialog.kind === 'confirm' ? true : input.trim())}
              />
            </View>
          </View>
        </View>
      ) : null}
      {toastMsg ? (
        <Animated.View pointerEvents="none" style={[s.toast, { opacity: fade }]} accessibilityLiveRegion="polite">
          <Text style={s.toastText}>{toastMsg}</Text>
        </Animated.View>
      ) : null}
    </Ctx.Provider>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30,42,44,0.35)',
    justifyContent: 'center',
    padding: spacing.lg,
    zIndex: 100,
  },
  sheet: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, maxWidth: 480, width: '100%', alignSelf: 'center' },
  input: {
    marginTop: spacing.md,
    minHeight: 50,
    maxHeight: 140,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  actions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg },
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: 64,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    zIndex: 110,
    alignSelf: 'center',
    maxWidth: 480,
  },
  toastText: { color: colors.inkInverse, fontFamily: fonts.bodyMedium, fontSize: 14, textAlign: 'center' },
});
