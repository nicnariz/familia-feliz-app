import { router } from 'expo-router';
import React, { useState } from 'react';
import { account } from '../../src/data/account';
import { errorMessage } from '../../src/data/store';
import { useSession } from '../../src/hooks';
import { useFeedback } from '../../src/ui/Feedback';
import { Banner, Button, Field, Txt } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';

export default function FamilyEdit() {
  const { family } = useSession();
  const fb = useFeedback();
  const [name, setName] = useState(family?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    try {
      await account.updateFamily(name);
      fb.toast('Família atualizada');
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  return (
    <Screen title="Editar família" footer={<>{error ? <Banner tone="attention" text={error} /> : null}<Button label="Salvar" onPress={save} /></>}>
      <Field label="Nome da família" value={name} onChangeText={setName} maxLength={60} />
      <Txt v="small">Fuso horário: {family?.timezone.replace('_', ' ')} (usado para os dias das tarefas e sequências).</Txt>
    </Screen>
  );
}
