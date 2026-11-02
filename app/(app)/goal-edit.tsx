import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { periodBounds } from '../../src/data/rules';
import { actions, errorMessage, memberName } from '../../src/data/store';
import { useSession } from '../../src/hooks';
import { spacing } from '../../src/theme';
import { useFeedback } from '../../src/ui/Feedback';
import { Banner, Button, Chip, Field, Segmented, Txt } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';

export default function GoalEdit() {
  const { s, members } = useSession();
  const fb = useFeedback();
  const week = periodBounds('WEEKLY');
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState<'FAMILY' | 'INDIVIDUAL'>('FAMILY');
  const [memberId, setMemberId] = useState<string | undefined>(members.find((m) => m.role === 'MEMBER')?.id);
  const [target, setTarget] = useState('300');
  const [bonus, setBonus] = useState('10');
  const [start, setStart] = useState(week.start);
  const [end, setEnd] = useState(week.end);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setError(null);
    try {
      actions.saveGoal({ title, scope, memberId: scope === 'INDIVIDUAL' ? memberId : undefined, targetPoints: Number(target), bonusPoints: Number(bonus) || 0, startDate: start, endDate: end });
      fb.toast('Meta criada');
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <Screen title="Nova meta" footer={<>{error ? <Banner tone="attention" text={error} /> : null}<Button label="Criar meta" onPress={save} /></>}>
      <Field label="Nome da meta" value={title} onChangeText={setTitle} placeholder="Ex.: Semana em sintonia" maxLength={60} />
      <Segmented
        label="Para quem"
        value={scope}
        onChange={setScope}
        options={[
          { value: 'FAMILY', label: 'Toda a família' },
          { value: 'INDIVIDUAL', label: 'Uma pessoa' },
        ]}
      />
      {scope === 'INDIVIDUAL' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md }}>
          {members.map((m) => (
            <Chip key={m.id} label={memberName(s, m.id)} selected={memberId === m.id} onPress={() => setMemberId(m.id)} />
          ))}
        </View>
      ) : null}
      <Field label="Alvo em pontos" value={target} onChangeText={(v) => setTarget(v.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={6} />
      <Field label="Bônus ao alcançar (pontos)" value={bonus} onChangeText={(v) => setBonus(v.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={4} hint={scope === 'FAMILY' ? 'Cada participante recebe o bônus.' : undefined} />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Field label="Início" value={start} onChangeText={setStart} placeholder="AAAA-MM-DD" maxLength={10} autoCapitalize="none" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Fim" value={end} onChangeText={setEnd} placeholder="AAAA-MM-DD" maxLength={10} autoCapitalize="none" />
        </View>
      </View>
      <Txt v="small">Contam os pontos reconhecidos no período. Usar pontos em recompensas não diminui o progresso.</Txt>
    </Screen>
  );
}
