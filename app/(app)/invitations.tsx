import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { roleLabel } from '../../src/data/rules';
import { account } from '../../src/data/account';
import { memberName } from '../../src/data/store';
import { formatDateTime } from '../../src/data/util';
import { useRun, useSession } from '../../src/hooks';
import { spacing } from '../../src/theme';
import { ListCard } from '../../src/ui/domain';
import { useFeedback } from '../../src/ui/Feedback';
import { Button, Empty, Pill, Row, Section, Txt } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';

export default function Invitations() {
  const { s, family, canManage } = useSession();
  const fb = useFeedback();
  const run = useRun();
  useEffect(() => {
    if (canManage) void account.loadInvitations().catch(() => undefined);
  }, [canManage]);
  if (!canManage) return <Screen title="Convites"><Empty icon="lock" title="Somente a administração gerencia convites" /></Screen>;
  const now = Date.now();
  const list = s.invitations.filter((i) => i.familyId === family?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const state = (i: (typeof list)[number]) =>
    i.revokedAt ? 'Encerrado' : i.uses >= i.maxUses ? 'Usado' : new Date(i.expiresAt).getTime() < now ? 'Expirado' : 'Ativo';

  return (
    <Screen title="Convites" footer={<Button testID="new-invite" label="Novo convite" icon="user-plus" onPress={() => router.push('/invite')} />}>
      <Txt v="small" style={{ marginBottom: spacing.md }}>
        Cada código vale para uma pessoa, por 7 dias. Por segurança, o código completo só aparece na hora em que é criado; aqui ele fica escondido.
      </Txt>
      {list.length ? (
        <Section title="Convites criados" style={{ marginTop: 0 }}>
          <ListCard>
            {list.map((i) => {
              const st = state(i);
              return (
                <Row
                  key={i.id}
                  title={i.code}
                  subtitle={`${roleLabel[i.role]} · criado por ${memberName(s, i.createdBy)} · vale até ${formatDateTime(i.expiresAt)}`}
                  right={
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Pill label={st} tone={st === 'Ativo' ? 'teal' : st === 'Usado' ? 'success' : 'neutral'} />
                      {st === 'Ativo' ? (
                        <Button
                          label="Encerrar"
                          variant="ghost"
                          small
                          onPress={async () => {
                            const ok = await fb.confirm({ title: `Encerrar o convite ${i.code}?`, message: 'O código deixa de funcionar.', confirmLabel: 'Encerrar', destructive: true });
                            if (ok) await run(() => account.revokeInvitation(i.id), 'Convite encerrado');
                          }}
                        />
                      ) : null}
                    </View>
                  }
                />
              );
            })}
          </ListCard>
        </Section>
      ) : (
        <Empty icon="mail" title="Nenhum convite ainda" text="Crie um código para cada pessoa que vai participar." />
      )}
    </Screen>
  );
}
