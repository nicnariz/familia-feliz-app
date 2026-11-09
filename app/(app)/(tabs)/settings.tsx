import { router } from 'expo-router';
import React from 'react';
import { Linking, View } from 'react-native';
import { roleLabel } from '../../../src/data/rules';
import { PRIVACY_URL } from '../../../src/api/config';
import { account } from '../../../src/data/account';
import { myMemberships } from '../../../src/data/store';
import { useSession } from '../../../src/hooks';
import { colors, spacing } from '../../../src/theme';
import { ListCard } from '../../../src/ui/domain';
import { useFeedback } from '../../../src/ui/Feedback';
import { Avatar, Button, Icon, Row, Section, Txt } from '../../../src/ui/primitives';
import { Screen } from '../../../src/ui/Screen';

export default function Settings() {
  const { s, me, user, family } = useSession();
  const fb = useFeedback();
  if (!me || !family || !user) return null;
  const memberships = myMemberships(s);

  const logout = async () => {
    const ok = await fb.confirm({ title: 'Sair da conta?', message: account.isDemo() ? 'A família de exemplo continua guardada neste aparelho.' : 'Seus dados continuam guardados no servidor. É só entrar de novo.', confirmLabel: 'Sair' });
    if (ok) await account.logout();
  };

  const reset = async () => {
    const ok = await fb.confirm({
      title: 'Apagar todos os dados deste aparelho?',
      message: account.isDemo()
        ? 'A família de exemplo e tudo o que foi feito nela serão removidos. Isso não pode ser desfeito.'
        : 'Você sai da conta e este celular esquece o que tinha guardado. Nada é apagado do servidor: é só entrar de novo.',
      confirmLabel: 'Apagar tudo',
      destructive: true,
    });
    if (ok) {
      await account.resetEverything();
      router.replace('/welcome');
    }
  };

  const icon = (name: React.ComponentProps<typeof Icon>['name']) => <Icon name={name} color={colors.teal} />;

  return (
    <Screen tab back={false} title="Ajustes">
      <ListCard>
        <Row
          title={me.nickname || me.displayName}
          subtitle={`${user.email} · ${roleLabel[me.role]}`}
          left={<Avatar name={me.nickname || me.displayName} tone={me.tone} size={48} />}
          onPress={() => router.push('/profile')}
        />
      </ListCard>

      <Section title="Preferências">
        <ListCard>
          <Row title="Notificações" subtitle="O que avisar e horário de silêncio" left={icon('bell')} onPress={() => router.push('/notification-settings')} />
          <Row title="Aparência" subtitle="Tema claro (único tema disponível)" left={icon('sun')} />
        </ListCard>
      </Section>

      {memberships.length > 1 ? (
        <Section title="Suas famílias">
          <ListCard>
            {memberships.map((m) => {
              const f = s.families.find((x) => x.id === m.familyId);
              return (
                <Row
                  key={m.id}
                  title={f?.name ?? 'Família'}
                  subtitle={roleLabel[m.role]}
                  left={icon(m.familyId === family.id ? 'check-circle' : 'circle')}
                  onPress={() => account.setActiveFamily(m.familyId).catch(() => undefined)}
                  chevron={false}
                />
              );
            })}
          </ListCard>
        </Section>
      ) : null}

      <Section title="Família">
        <ListCard>
          <Row title="Criar ou entrar em outra família" left={icon('plus-circle')} onPress={() => router.push('/start')} />
          {s.session?.demo ? (
            <Row title="Ver o app como outra pessoa" subtitle="Disponível na família de exemplo" left={icon('repeat')} onPress={() => router.push('/switch-person')} />
          ) : null}
        </ListCard>
      </Section>

      <Section title="Sobre">
        <ListCard>
          <Row title="Sobre esta versão" subtitle="Onde ficam os dados e decisões pendentes" left={icon('info')} onPress={() => router.push('/about')} />
          <Row title="Política de privacidade" subtitle="Como cuidamos dos dados da família" left={icon('shield')} onPress={() => Linking.openURL(PRIVACY_URL)} />
        </ListCard>
      </Section>

      <View style={{ gap: spacing.xs, marginTop: spacing.xl }}>
        <Button testID="logout" label="Sair da conta" variant="secondary" icon="log-out" onPress={logout} />
        {account.isDemo() ? (
          <Button label="Apagar dados deste aparelho" variant="danger" icon="trash-2" onPress={reset} />
        ) : (
          <Button testID="delete-account" label="Excluir minha conta" variant="danger" icon="user-x" onPress={() => router.push('/delete-account')} />
        )}
      </View>
      <Txt v="small" center style={{ marginTop: spacing.lg }}>
        Família Feliz · versão 1.0.0{account.isDemo() ? ' (exemplo)' : ''}
      </Txt>
    </Screen>
  );
}
