import React from 'react';
import { Linking, View } from 'react-native';
import { PRIVACY_URL } from '../../src/api/config';
import { account } from '../../src/data/account';
import { spacing } from '../../src/theme';
import { Card, Section, Txt } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';

const PENDING = [
  { id: 'DEC-0020', text: 'Desconto de pontos por atraso: não aplicado. Tarefas concluídas depois do horário recebem os pontos integrais até a decisão.' },
  { id: 'DEC-0021', text: 'Apelido: segue a regra do servidor (somente a administração edita).' },
  { id: 'DEC-0022', text: 'Recuperação de senha: ainda não disponível na conta do servidor. Na família de exemplo, o código aparece na tela.' },
  { id: 'Tokens', text: 'Cores, tipografia e espaçamentos são provisórios até a importação da Token Foundation v1.' },
  { id: 'Fê', text: 'Poses em uso: joinha (oficial), atenção, convite e curiosa (entrega de 02/11/2026, ainda em revisão de semelhança). Orientações ainda aparecem só em texto.' },
  { id: 'Splash', text: 'Abertura padrão até existir o símbolo central oficial para a splash nativa.' },
];

export default function About() {
  return (
    <Screen title="Sobre esta versão">
      <Txt v="body">
        Família Feliz organiza rotinas e combinados familiares, autonomia, pertencimento e educação financeira com cuidado. Tarefas, reconhecimento,
        recompensas e mesada apoiam a ação e o aprendizado; não medem o valor de ninguém.
      </Txt>
      <Section title="Onde ficam os dados">
        <Card style={{ gap: spacing.xs }}>
          {account.isDemo() ? (
            <Txt v="body">
              Você está na família de exemplo: tudo fica só neste aparelho, para experimentar à vontade. Para usar com a sua família em vários celulares, crie
              uma conta.
            </Txt>
          ) : (
            <Txt v="body">
              Sua conta, sua família, tarefas, pontos, recompensas, mesada, metas e avisos ficam no servidor do Família Feliz. Cada pessoa entra pelo próprio
              celular e todos veem as mesmas informações.
            </Txt>
          )}
          <Txt v="small">Sem internet, uma alteração não é guardada para depois: o app avisa e você tenta de novo quando a conexão voltar.</Txt>
          <Txt v="small" style={{ textDecorationLine: 'underline' }} onPress={() => Linking.openURL(PRIVACY_URL)}>
            Ler a política de privacidade
          </Txt>
        </Card>
      </Section>
      <Section title="Decisões em aberto">
        <View style={{ gap: spacing.xs }}>
          {PENDING.map((p) => (
            <Card key={p.id} tone="linen" style={{ gap: 2 }}>
              <Txt v="smallStrong">{p.id}</Txt>
              <Txt v="small">{p.text}</Txt>
            </Card>
          ))}
        </View>
      </Section>
    </Screen>
  );
}
