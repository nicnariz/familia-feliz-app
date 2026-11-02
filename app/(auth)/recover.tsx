import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { colors, spacing } from '../../src/theme';
import { Button, Card, FeNote, Txt } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';

/**
 * Recuperação de senha. A API atual ainda não tem as rotas de recuperação
 * (pendência DEC-0022: entrega externa do código). Até lá, a tela orienta com calma.
 */
export default function Recover() {
  const params = useLocalSearchParams<{ email?: string }>();
  return (
    <Screen
      title="Recuperar acesso"
      footer={<Button label="Voltar para entrar" onPress={() => router.replace(params.email ? `/login?email=${encodeURIComponent(params.email)}` : '/login')} />}
    >
      <View style={{ gap: spacing.md }}>
        <Txt v="title">Acontece com todo mundo</Txt>
        <FeNote mode="tranquilizar">Sua família e seus dados continuam guardados. Vamos resolver isso juntos.</FeNote>
        <Card style={{ gap: spacing.xs }}>
          <Txt v="bodyStrong">A recuperação por e-mail ainda está chegando</Txt>
          <Txt v="body" color={colors.inkSoft}>
            Enquanto isso, tente as senhas que você costuma usar. Se não der certo, fale com quem cuida do Família Feliz na sua família para receber
            ajuda com o acesso.
          </Txt>
        </Card>
      </View>
    </Screen>
  );
}
