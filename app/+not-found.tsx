import { router } from 'expo-router';
import React from 'react';
import { Screen } from '../src/ui/Screen';
import { Button, Empty } from '../src/ui/primitives';

export default function NotFound() {
  return (
    <Screen title="Página não encontrada">
      <Empty icon="compass" title="Esse caminho não existe" text="Pode ter sido um link antigo. Vamos voltar para o início." />
      <Button label="Ir para o início" onPress={() => router.replace('/')} />
    </Screen>
  );
}
