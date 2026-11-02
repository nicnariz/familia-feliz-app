import React from 'react';
import { View } from 'react-native';
import { actions } from '../../src/data/store';
import { useRun, useSession } from '../../src/hooks';
import { colors, spacing } from '../../src/theme';
import { useFeedback } from '../../src/ui/Feedback';
import { Button, Card, Empty, FeNote, Txt } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';

export default function Values() {
  const { s, family, canManage } = useSession();
  const fb = useFeedback();
  const run = useRun();
  const values = s.values.filter((v) => v.familyId === family?.id);

  const edit = async (id?: string) => {
    const current = values.find((v) => v.id === id);
    const title = await fb.prompt({ title: id ? 'Editar valor' : 'Novo valor', placeholder: 'Ex.: Cooperação', initial: current?.title, minLength: 2, confirmLabel: 'Continuar' });
    if (!title) return;
    const description = await fb.prompt({ title: 'O que isso significa para vocês?', placeholder: 'Opcional', initial: current?.description, minLength: 0, confirmLabel: 'Salvar' });
    run(() => actions.saveValue({ title, description: description ?? undefined }, id), 'Valor salvo');
  };

  return (
    <Screen title="Nossos valores" footer={canManage ? <Button label="Adicionar valor" icon="plus" onPress={() => edit()} /> : undefined}>
      <FeNote mode="orientar">Valores dão sentido aos combinados. Ligue cada tarefa a um valor para lembrar o porquê.</FeNote>
      <View style={{ gap: spacing.xs, marginTop: spacing.lg }}>
        {values.length ? (
          values.map((v) => (
            <Card key={v.id} tone="sand" style={{ gap: 4 }}>
              <Txt v="bodyStrong">{v.title}</Txt>
              {v.description ? (
                <Txt v="small" color={colors.ink}>
                  {v.description}
                </Txt>
              ) : null}
              {canManage ? (
                <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                  <Button label="Editar" variant="ghost" small onPress={() => edit(v.id)} />
                  <Button
                    label="Remover"
                    variant="ghost"
                    small
                    onPress={async () => {
                      const ok = await fb.confirm({ title: `Remover “${v.title}”?`, message: 'As tarefas ligadas a ele continuam existindo.', confirmLabel: 'Remover', destructive: true });
                      if (ok) run(() => actions.removeValue(v.id), 'Valor removido');
                    }}
                  />
                </View>
              ) : null}
            </Card>
          ))
        ) : (
          <Empty icon="heart" title="Ainda sem valores" />
        )}
      </View>
    </Screen>
  );
}
