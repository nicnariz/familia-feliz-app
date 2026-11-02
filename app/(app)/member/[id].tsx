import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { memberStats, roleLabel, scoreTotal, walletAvailable } from '../../../src/data/rules';
import { account } from '../../../src/data/account';
import { actions } from '../../../src/data/store';
import { memberName } from '../../../src/data/store';
import type { Role } from '../../../src/data/types';
import { formatShortDate } from '../../../src/data/util';
import { useRun, useSession } from '../../../src/hooks';
import { spacing } from '../../../src/theme';
import { useFeedback } from '../../../src/ui/Feedback';
import { Avatar, Banner, Button, Card, Empty, Section, Segmented, Stat, ToggleRow, Txt } from '../../../src/ui/primitives';
import { Screen } from '../../../src/ui/Screen';

export default function MemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { s, me, family, canManage, canApprove } = useSession();
  const fb = useFeedback();
  const run = useRun();
  const m = s.members.find((x) => x.id === id && x.familyId === family?.id);
  if (!m || !me) return <Screen title="Pessoa"><Empty icon="user" title="Pessoa não encontrada" /></Screen>;
  const isMe = m.id === me.id;
  const stats = memberStats(s, m.id);
  const name = m.nickname || m.displayName;

  const nickname = async () => {
    const v = await fb.prompt({ title: 'Apelido', message: 'Como a família chama essa pessoa no dia a dia?', initial: m.nickname ?? '', placeholder: 'Deixe vazio para usar o nome', minLength: 0, confirmLabel: 'Salvar' });
    if (v !== null) await run(() => account.updateMember(m.id, { nickname: v }), 'Apelido salvo');
  };

  const deactivate = async () => {
    const ok = await fb.confirm({
      title: `Remover ${memberName(s, m.id)} da família?`,
      message: 'A pessoa perde o acesso a esta família. O histórico de tarefas e pontos é mantido e o acesso pode ser devolvido com um novo convite.',
      confirmLabel: 'Remover acesso',
      destructive: true,
    });
    if (ok && await run(() => account.updateMember(m.id, { status: 'INACTIVE' }), 'Acesso removido')) router.back();
  };

  return (
    <Screen title={name}>
      <View style={{ alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md }}>
        <Avatar name={name} tone={m.tone} size={72} />
        <Txt v="title">{name}</Txt>
        <Txt v="small">
          {m.nickname ? `${m.displayName} · ` : ''}
          {roleLabel[m.role]} · na família desde {formatShortDate(m.joinedAt.slice(0, 10))}
        </Txt>
      </View>
      {canApprove ? (
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          <Stat label="concluídas" value={String(stats.done)} icon="check" />
          <Stat label="pontos no histórico" value={String(scoreTotal(s, m.id))} icon="star" />
          <Stat label="para usar" value={String(walletAvailable(s, m.id))} icon="gift" />
        </View>
      ) : null}
      {canApprove ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md }}>
          <Button label="Ver evolução" icon="trending-up" variant="secondary" small onPress={() => router.push('/progress')} />
          {canManage ? <Button label="Mesada" icon="dollar-sign" variant="secondary" small onPress={() => router.push(`/allowance/${m.id}`)} /> : null}
        </View>
      ) : null}

      {canManage ? (
        <>
          <Section title="Apelido">
            <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Txt v="body" style={{ flex: 1 }}>
                {m.nickname || 'Sem apelido'}
              </Txt>
              <Button label="Alterar" variant="ghost" small onPress={nickname} />
            </Card>
          </Section>
          <Section title="Papel e permissões">
            {isMe ? (
              <Banner tone="info" text="Você não pode alterar as próprias permissões." />
            ) : (
              <Card>
                <Segmented<Role>
                  value={m.role}
                  onChange={(role) => run(() => account.updateMember(m.id, { role }), 'Papel atualizado')}
                  options={[
                    { value: 'MEMBER', label: 'Participante' },
                    { value: 'GUARDIAN', label: 'Responsável' },
                    { value: 'ADMIN', label: 'Administração' },
                  ]}
                />
                <ToggleRow label="Pode revisar e aprovar" hint="Tarefas, recompensas e reconhecimentos." value={m.canApprove} onChange={(v) => run(() => account.updateMember(m.id, { canApprove: v }))} />
                <ToggleRow
                  label="Pode administrar a família"
                  hint={account.isDemo() ? (m.role === 'ADMIN' ? 'Membros, convites, mesada e catálogo.' : 'Disponível apenas para o papel Administração.') : 'Vem junto com o papel Administração.'}
                  value={m.canManage}
                  disabled={!account.isDemo() || m.role !== 'ADMIN'}
                  onChange={(v) => run(async () => { if (account.isDemo()) actions.updateMember(m.id, { canManage: v }); })}
                />
              </Card>
            )}
          </Section>
          {!isMe ? <Button label="Remover acesso à família" variant="danger" icon="user-x" style={{ marginTop: spacing.xl }} onPress={deactivate} /> : null}
        </>
      ) : null}
    </Screen>
  );
}
