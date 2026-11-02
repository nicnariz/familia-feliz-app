import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useSession } from '../../src/hooks';
import { colors, spacing } from '../../src/theme';
import { Button, Card, FeNote, Icon, Txt, type IconName } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';

export default function Ready() {
  const params = useLocalSearchParams<{ joined?: string }>();
  const { family, canManage, canApprove } = useSession();
  const joined = params.joined === '1';

  const steps: { icon: IconName; text: string }[] = canManage
    ? [
        { icon: 'check-square', text: 'Crie o primeiro combinado da casa' },
        { icon: 'gift', text: 'Monte algumas recompensas que façam sentido para vocês' },
        { icon: 'heart', text: 'Escreva os valores da família' },
      ]
    : canApprove
      ? [
          { icon: 'check-square', text: 'Crie e acompanhe tarefas' },
          { icon: 'eye', text: 'Revise o que foi concluído, com carinho' },
        ]
      : [
          { icon: 'check-square', text: 'Veja as suas tarefas de hoje' },
          { icon: 'gift', text: 'Conheça as recompensas da família' },
        ];

  return (
    <Screen back={false} footer={<Button testID="ready-go" label="Começar" onPress={() => router.replace('/')} />}>
      <View style={{ paddingTop: spacing.xxl, gap: spacing.lg }}>
        <Txt v="overline">TUDO PRONTO</Txt>
        <Txt v="display">{joined ? `Bem-vindo à ${family?.name}` : `${family?.name} está pronta`}</Txt>
        <FeNote mode="celebrar">Que bom começar junto! Cada pequeno combinado conta.</FeNote>
        <Card style={{ gap: spacing.sm }}>
          <Txt v="heading">Próximos passos</Txt>
          {steps.map((s) => (
            <View key={s.text} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
              <Icon name={s.icon} color={colors.teal} />
              <Txt v="body" style={{ flex: 1 }}>
                {s.text}
              </Txt>
            </View>
          ))}
        </Card>
      </View>
    </Screen>
  );
}
