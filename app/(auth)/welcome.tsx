import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { actions } from '../../src/data/store';
import { DEMO_PASSWORD } from '../../src/data/seed';
import { colors, radius, spacing } from '../../src/theme';
import { useFeedback } from '../../src/ui/Feedback';
import { Button, FeNote, Icon, Txt, type IconName } from '../../src/ui/primitives';
import { Screen, Wordmark } from '../../src/ui/Screen';

const PILLARS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'check-square', title: 'Combinados claros', text: 'Rotinas da casa organizadas, cada um no seu ritmo.' },
  { icon: 'heart', title: 'Reconhecimento sereno', text: 'Celebrar cada passo, sem comparar ninguém.' },
  { icon: 'gift', title: 'Educação financeira', text: 'Recompensas, cofrinhos e mesada com transparência.' },
];

export default function Welcome() {
  const fb = useFeedback();
  const [busy, setBusy] = useState(false);

  const demo = async () => {
    const ok = await fb.confirm({
      title: 'Conhecer a Família Oliveira',
      message: `Vamos abrir uma família de exemplo com tarefas, recompensas e mesada. Você entra como Ana (administração). Senha de todas as pessoas: ${DEMO_PASSWORD}.`,
      confirmLabel: 'Abrir exemplo',
    });
    if (!ok) return;
    setBusy(true);
    actions.startDemo();
    router.replace('/');
  };

  return (
    <Screen back={false}>
      <View style={{ paddingTop: spacing.xxl, gap: spacing.lg }}>
        <Wordmark size="lg" />
        <View style={{ gap: spacing.xs }}>
          <Txt v="display">A vida em família, com mais leveza.</Txt>
          <Txt v="body" color={colors.inkSoft}>
            Organize rotinas e combinados, reconheça cada conquista e aprenda sobre dinheiro com cuidado.
          </Txt>
        </View>
        <FeNote mode="receber">Oi! Eu sou a Fê. Vou acompanhar vocês nos primeiros passos.</FeNote>
        <View style={{ gap: spacing.sm }}>
          {PILLARS.map((p) => (
            <View key={p.title} style={st.pillar}>
              <View style={st.pillarIcon}>
                <Icon name={p.icon} size={18} color={colors.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="bodyStrong">{p.title}</Txt>
                <Txt v="small">{p.text}</Txt>
              </View>
            </View>
          ))}
        </View>
        <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
          <Button testID="go-register" label="Criar minha conta" onPress={() => router.push('/register')} />
          <Button testID="go-login" label="Já tenho conta" variant="secondary" onPress={() => router.push('/login')} />
          <Button label="Recebi um código de convite" variant="ghost" icon="mail" onPress={() => router.push('/register?invite=1')} />
        </View>
        <View style={st.demo}>
          <Txt v="smallStrong" color={colors.ink}>Quer só dar uma olhada?</Txt>
          <Txt v="small">Abra uma família de exemplo e explore tudo sem cadastrar nada.</Txt>
          <Button testID="start-demo" label="Conhecer com uma família de exemplo" variant="quiet" small loading={busy} onPress={demo} style={{ marginTop: spacing.xs }} />
        </View>
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  pillar: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  pillarIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center' },
  demo: { backgroundColor: colors.mist, borderRadius: radius.lg, padding: spacing.md, gap: 2 },
});
