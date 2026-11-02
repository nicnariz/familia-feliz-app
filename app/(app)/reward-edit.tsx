import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { actions, errorMessage } from '../../src/data/store';
import { useSession } from '../../src/hooks';
import { useFeedback } from '../../src/ui/Feedback';
import { Banner, Button, Field, ToggleRow, Txt } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';

export default function RewardEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { s } = useSession();
  const fb = useFeedback();
  const existing = id ? s.rewards.find((r) => r.id === id) : undefined;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [cost, setCost] = useState(String(existing?.cost ?? 50));
  const [limited, setLimited] = useState(existing ? existing.stock !== null : false);
  const [stock, setStock] = useState(String(existing?.stock ?? 1));
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setError(null);
    try {
      actions.saveReward({ title, description: description || undefined, cost: Number(cost), stock: limited ? Number(stock) : null }, existing?.id);
      fb.toast(existing ? 'Recompensa atualizada' : 'Recompensa criada');
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <Screen title={existing ? 'Editar recompensa' : 'Nova recompensa'} footer={<>{error ? <Banner tone="attention" text={error} /> : null}<Button testID="reward-save" label="Salvar" onPress={save} /></>}>
      <Field testID="reward-title" label="Recompensa" value={title} onChangeText={setTitle} placeholder="Ex.: Escolher o jantar de domingo" maxLength={80} />
      <Field label="Detalhes (opcional)" value={description} onChangeText={setDescription} multiline maxLength={240} />
      <Field testID="reward-cost" label="Custo em pontos" value={cost} onChangeText={(v) => setCost(v.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={6} />
      <ToggleRow label="Quantidade limitada" hint="Útil para coisas que acabam, como um livro ou um passeio." value={limited} onChange={setLimited} />
      {limited ? <Field label="Quantidade disponível" value={stock} onChangeText={(v) => setStock(v.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={4} /> : null}
      <Txt v="small">Momentos juntos e pequenos privilégios costumam valer mais que coisas.</Txt>
    </Screen>
  );
}
