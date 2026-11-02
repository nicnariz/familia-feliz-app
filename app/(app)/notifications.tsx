import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { actions, visibleNotifications } from '../../src/data/store';
import type { NotificationCategory } from '../../src/data/types';
import { dayKey, formatDateTime, formatDay } from '../../src/data/util';
import { useSession } from '../../src/hooks';
import { colors, spacing } from '../../src/theme';
import { Button, Card, Empty, Icon, Section, Txt, type IconName } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';
import { Pressable } from 'react-native';

const catIcon: Record<NotificationCategory, IconName> = {
  TASKS: 'check-square',
  APPROVAL: 'eye',
  REWARDS: 'gift',
  ALLOWANCE: 'dollar-sign',
  ACHIEVEMENTS: 'award',
  FAMILY: 'users',
};

export default function Notifications() {
  const { s, me } = useSession();
  const list = visibleNotifications(s, me?.id);
  const unread = list.filter((n) => !n.readAt).length;
  const groups = list.reduce<Record<string, typeof list>>((acc, n) => {
    (acc[dayKey(new Date(n.deliverAt))] ||= []).push(n);
    return acc;
  }, {});

  return (
    <Screen title="Notificações" right={{ icon: 'sliders', label: 'Preferências de notificação', onPress: () => router.push('/notification-settings') }}>
      {unread ? <Button label={`Marcar ${unread} como lidas`} variant="ghost" small style={{ alignSelf: 'flex-start' }} onPress={() => actions.markAllRead()} /> : null}
      {list.length ? (
        Object.entries(groups).map(([day, items]) => (
          <Section key={day} title={formatDay(day)} style={{ marginTop: spacing.md }}>
            <View style={{ gap: spacing.xs }}>
              {items.map((n) => (
                <Card
                  key={n.id}
                  tone={n.readAt ? 'linen' : 'surface'}
                  onPress={() => {
                    actions.markRead(n.id);
                    if (n.link) router.push(n.link);
                  }}
                  accessibilityLabel={`${n.readAt ? '' : 'Nova. '}${n.title}. ${n.body}`}
                  style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: n.readAt ? colors.surface : colors.tealSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={catIcon[n.category]} size={16} color={colors.teal} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {!n.readAt ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.terracotta }} /> : null}
                      <Txt v="bodyStrong" style={{ flex: 1 }}>
                        {n.title}
                      </Txt>
                    </View>
                    <Txt v="small" color={colors.ink}>
                      {n.body}
                    </Txt>
                    <Txt v="small">{formatDateTime(n.deliverAt)}</Txt>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel="Descartar notificação" hitSlop={8} onPress={() => actions.dismissNotification(n.id)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: -8, marginRight: -8 }}>
                    <Icon name="x" size={16} color={colors.inkMuted} />
                  </Pressable>
                </Card>
              ))}
            </View>
          </Section>
        ))
      ) : (
        <Empty fe icon="bell" title="Tudo tranquilo por aqui" text="Avisos sobre tarefas, recompensas e conquistas aparecem nesta central." />
      )}
    </Screen>
  );
}
