import { router } from 'expo-router';
import React from 'react';
import { roleLabel } from '../../src/data/rules';
import { actions } from '../../src/data/store';
import { useSession } from '../../src/hooks';
import { spacing } from '../../src/theme';
import { ListCard } from '../../src/ui/domain';
import { Avatar, FeNote, Icon, Row } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';
import { View } from 'react-native';

export default function SwitchPerson() {
  const { s, me, family } = useSession();
  const people = s.members.filter((m) => m.familyId === family?.id && m.status === 'ACTIVE');
  return (
    <Screen title="Ver como outra pessoa">
      <FeNote mode="orientar">Na família de exemplo, você pode experimentar o app do ponto de vista de cada pessoa.</FeNote>
      <View style={{ height: spacing.lg }} />
      <ListCard>
        {people.map((m) => (
          <Row
            key={m.id}
            testID={`switch-${m.id}`}
            title={m.nickname || m.displayName}
            subtitle={roleLabel[m.role]}
            left={<Avatar name={m.nickname || m.displayName} tone={m.tone} />}
            right={m.id === me?.id ? <Icon name="check" /> : undefined}
            chevron={false}
            onPress={() => {
              actions.switchDemoMember(m.id);
              router.replace('/');
            }}
          />
        ))}
      </ListCard>
    </Screen>
  );
}
