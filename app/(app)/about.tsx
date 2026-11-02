import React from 'react';
import { View } from 'react-native';
import { spacing } from '../../src/theme';
import { Card, Section, Txt } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';

const PENDING = [
  { id: 'DEC-0020', text: 'Desconto de pontos por atraso: não aplicado. Tarefas concluídas depois do horário recebem os pontos integrais até a decisão.' },
  { id: 'DEC-0021', text: 'Apelido: segue a regra do servidor (somente a administração edita).' },
  { id: 'DEC-0022', text: 'Recuperação de senha: sem envio externo; no modo local o código aparece na tela.' },
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
      <Section title="Modo local">
        <Card style={{ gap: spacing.xs }}>
          <Txt v="body">
            Nesta versão, contas e dados ficam guardados apenas neste aparelho. Cada pessoa da família entra pelo mesmo aparelho ou usa a família de exemplo
            para experimentar.
          </Txt>
          <Txt v="small">A camada de dados foi escrita para ser trocada pela API oficial (NestJS) sem mudar as telas.</Txt>
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
