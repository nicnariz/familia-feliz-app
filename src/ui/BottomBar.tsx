// Barra inferior fixa: os cinco destinos primários ficam visíveis em todas as telas do app.
import { Feather } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../hooks';
import { colors, fonts, MIN_TOUCH } from '../theme';

type IconName = React.ComponentProps<typeof Feather>['name'];
type Item = { path: string; label: string; icon: IconName; owns: string[] };

export function BottomBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { canApprove } = useSession();

  // `owns` = telas internas que pertencem a cada destino (a aba fica marcada nelas também).
  const items: Item[] = [
    { path: '/', label: 'Início', icon: 'sun', owns: ['/notifications', '/notification-settings'] },
    { path: '/tasks', label: canApprove ? 'Tarefas' : 'Minhas tarefas', icon: 'check-square', owns: ['/task', '/task-edit', '/assignment', '/approvals'] },
    { path: '/rewards', label: 'Recompensas', icon: 'gift', owns: ['/reward', '/reward-edit', '/redemptions', '/wallet', '/allowance'] },
    { path: '/family', label: 'Família', icon: 'users', owns: ['/member', '/invitations', '/family-edit', '/values', '/progress', '/goal-edit'] },
    { path: '/settings', label: 'Ajustes', icon: 'settings', owns: ['/profile', '/about', '/switch-person', '/delete-account'] },
  ];
  const isActive = (it: Item) =>
    pathname === it.path || it.owns.some((p) => pathname === p || pathname.startsWith(p + '/'));

  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 8) }]} accessibilityRole="tablist">
      {items.map((it) => {
        const active = isActive(it);
        const color = active ? colors.teal : colors.inkMuted;
        return (
          <Pressable
            key={it.path}
            testID={`tab-${it.path === '/' ? 'index' : it.path.slice(1)}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={it.label}
            onPress={() => {
              if (pathname !== it.path) router.navigate(it.path as never);
            }}
            style={s.item}
          >
            <Feather name={it.icon} size={22} color={color} />
            <Text style={[s.label, { color }, active && { fontFamily: fonts.bodySemi }]} numberOfLines={1}>
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingTop: 6 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: MIN_TOUCH + 6, gap: 2 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 11 },
});
