import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Share, View } from 'react-native';
import { account } from '../../src/data/account';
import { useRun, useSession } from '../../src/hooks';
import type { Invitation } from '../../src/data/types';
import { colors, spacing } from '../../src/theme';
import { useFeedback } from '../../src/ui/Feedback';
import { Button, Card, FeNote, Segmented, Txt } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';

export default function Invite() {
  const params = useLocalSearchParams<{ first?: string }>();
  const first = params.first === '1';
  const { family } = useSession();
  const fb = useFeedback();
  const run = useRun();
  const [role, setRole] = useState<'MEMBER' | 'GUARDIAN'>('MEMBER');
  const [inv, setInv] = useState<Invitation | null>(null);

  const [busy, setBusy] = useState(false);
  const create = async () => {
    setBusy(true);
    await run(async () => setInv(await account.createInvitation(role, 1, 7)));
    setBusy(false);
  };

  const message = inv
    ? `Oi! Entre na ${family?.name} no app Família Feliz com o código ${inv.code}. Ele vale por 7 dias.`
    : '';

  return (
    <Screen
      title={first ? 'Convide a sua família' : 'Novo convite'}
      back={!first}
      footer={
        <Button
          label={first ? (inv ? 'Continuar' : 'Fazer isso depois') : 'Concluir'}
          variant={first && !inv ? 'ghost' : 'primary'}
          onPress={() => (first ? router.replace('/ready') : router.back())}
        />
      }
    >
      <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
        <Txt v="title">Quem vai participar?</Txt>
        <Txt v="body" color={colors.inkSoft}>
          Cada convite gera um código de uso único, válido por 7 dias. Crie um para cada pessoa.
        </Txt>
      </View>
      <Segmented
        label="Papel de quem vai entrar"
        value={role}
        onChange={(v) => {
          setRole(v);
          setInv(null);
        }}
        options={[
          { value: 'MEMBER', label: 'Participante' },
          { value: 'GUARDIAN', label: 'Responsável' },
        ]}
      />
      <Txt v="small" style={{ marginBottom: spacing.md }}>
        {role === 'MEMBER'
          ? 'Participantes recebem tarefas, juntam pontos e escolhem recompensas.'
          : 'Responsáveis também criam tarefas e revisam o que foi feito.'}
      </Txt>
      {inv ? (
        <Card tone="teal" style={{ gap: spacing.sm }}>
          <Txt v="overline">CÓDIGO DO CONVITE</Txt>
          <Txt v={inv.code.length > 12 ? 'bodyStrong' : 'display'} style={inv.code.length > 12 ? { fontSize: 16 } : { letterSpacing: 4 }}>
            {inv.code}
          </Txt>
          {inv.code.length > 12 ? <Txt v="small" color={colors.ink}>Use os botões abaixo: o código é longo e diferencia maiúsculas de minúsculas.</Txt> : null}
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <Button
              label="Copiar"
              icon="copy"
              variant="secondary"
              small
              style={{ flex: 1 }}
              onPress={async () => {
                await Clipboard.setStringAsync(inv.code);
                fb.toast('Código copiado');
              }}
            />
            <Button label="Enviar" icon="share-2" small style={{ flex: 1 }} onPress={() => Share.share({ message })} />
          </View>
          <Button label="Criar outro convite" variant="ghost" small onPress={create} loading={busy} />
        </Card>
      ) : (
        <Button testID="invite-create" label="Gerar código" icon="plus" variant="secondary" onPress={create} loading={busy} />
      )}
      <View style={{ marginTop: spacing.lg }}>
        <FeNote mode="convite">Para crianças pequenas, um responsável pode criar a conta junto com elas.</FeNote>
      </View>
    </Screen>
  );
}
