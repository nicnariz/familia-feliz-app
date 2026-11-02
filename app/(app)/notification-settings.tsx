import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { actions, errorMessage, prefsOf } from '../../src/data/store';
import type { NotificationCategory } from '../../src/data/types';
import { useSession } from '../../src/hooks';
import { spacing } from '../../src/theme';
import { useFeedback } from '../../src/ui/Feedback';
import { Banner, Button, Card, Field, Section, ToggleRow, Txt } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';

const LABELS: { key: NotificationCategory; label: string; hint: string; approverOnly?: boolean }[] = [
  { key: 'TASKS', label: 'Tarefas', hint: 'Novos combinados, reconhecimentos e ajustes.' },
  { key: 'APPROVAL', label: 'Revisões', hint: 'Quando algo concluído precisa do seu olhar.', approverOnly: true },
  { key: 'REWARDS', label: 'Recompensas', hint: 'Pedidos, aprovações, entregas e cofrinhos.' },
  { key: 'ALLOWANCE', label: 'Mesada', hint: 'Aprovação e pagamento registrados.' },
  { key: 'ACHIEVEMENTS', label: 'Conquistas e metas', hint: 'Celebrações da família.' },
  { key: 'FAMILY', label: 'Família', hint: 'Quem chegou e mudanças na família.' },
];

export default function NotificationSettings() {
  const { s, me, canApprove } = useSession();
  const fb = useFeedback();
  const current = prefsOf(s, me!.id);
  const [cats, setCats] = useState(current.categories);
  const [quiet, setQuiet] = useState(current.quietHoursEnabled);
  const [start, setStart] = useState(current.quietStart);
  const [end, setEnd] = useState(current.quietEnd);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setError(null);
    try {
      actions.savePrefs({ categories: cats, quietHoursEnabled: quiet, quietStart: start, quietEnd: end });
      fb.toast('Preferências salvas');
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <Screen title="Notificações" footer={<>{error ? <Banner tone="attention" text={error} /> : null}<Button label="Salvar" onPress={save} /></>}>
      <Section title="O que avisar" style={{ marginTop: 0 }}>
        <Card>
          {LABELS.filter((l) => !l.approverOnly || canApprove).map((l) => (
            <ToggleRow key={l.key} label={l.label} hint={l.hint} value={cats[l.key]} onChange={(v) => setCats({ ...cats, [l.key]: v })} />
          ))}
        </Card>
      </Section>
      <Section title="Horário de silêncio">
        <Card>
          <ToggleRow label="Silenciar à noite" hint="Avisos comuns ficam guardados e aparecem quando o silêncio terminar." value={quiet} onChange={setQuiet} />
          {quiet ? (
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Field label="Das" value={start} onChangeText={setStart} placeholder="HH:MM" maxLength={5} autoCapitalize="none" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Até" value={end} onChangeText={setEnd} placeholder="HH:MM" maxLength={5} autoCapitalize="none" />
              </View>
            </View>
          ) : null}
        </Card>
      </Section>
      <Txt v="small" style={{ marginTop: spacing.md }}>
        Nesta versão os avisos ficam na central do app. Notificações push no celular dependem do servidor.
      </Txt>
    </Screen>
  );
}
