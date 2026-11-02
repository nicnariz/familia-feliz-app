# Família Feliz — app

App mobile (Expo / React Native) do Família Feliz, recriado a partir da base de conhecimento do projeto (pacote *Super Knowledge*, consolidação de 16/10/2026).

Família Feliz organiza rotinas e combinados familiares, autonomia, pertencimento e educação financeira com cuidado. Tarefas, reconhecimento, recompensas e mesada apoiam a ação e o aprendizado, **não medem o valor de uma pessoa**. Sem culpa, vergonha, ranking, competição ou vigilância punitiva.

## Como rodar

Requisitos: Node 20 ou mais recente e o app **Expo Go** (SDK 53) no celular, ou um navegador.

```bash
npm install
npx expo install --fix   # alinha as versões exatas do SDK 53
npx expo start           # abre o QR code para o Expo Go
# ou
npx expo start --web     # roda no navegador
```

Outros comandos: `npm test` (regras de negócio), `npm run typecheck`.

### Família de exemplo

Na tela inicial, toque em **“Conhecer com uma família de exemplo”**. Ela abre a Família Oliveira com histórico de tarefas, pedidos, cofrinho e mesada:

| Pessoa | Papel | E-mail |
| --- | --- | --- |
| Ana | Administração | ana@exemplo.com |
| Carlos | Responsável | carlos@exemplo.com |
| Lia | Participante | lia@exemplo.com |
| Theo (“Theozinho”) | Participante | theo@exemplo.com |

Senha de todas: `familia123`. Em **Ajustes → Ver o app como outra pessoa** dá para trocar de ponto de vista.

## O que tem

Stack igual à documentada: Expo 53, React 19, React Native 0.79.6, expo-router, Poppins + Inter, ícones Feather (linha, “Outline Humana”). Tema claro único.

Cinco destinos fixos na barra inferior: **Início, Tarefas, Recompensas, Família, Ajustes**.

| Jornada (Freeze v1.0) | Telas |
| --- | --- |
| Entrada (SCR-001–007) | `welcome`, `register`, `login`, `recover` (código de uso único, 30 min) |
| Primeiros Passos (008–013) | `start`, `create-family`, `join` (prévia do convite + aceite), `invite`, `ready` |
| Vida em Família (014–019) | Início (visão de responsável e de participante), aba Família, linha do tempo |
| Tarefas (020–027) | aba Tarefas, `task-edit` (recorrência única/diária/semanal, revisão, registro, essencial, valor), `task/[id]`, `assignment/[id]` (começar/concluir) |
| Aprovação (028–031) | `approvals`, revisão em `assignment/[id]` (aprovar com recado / pedir ajuste com motivo) |
| Evolução (032–037) | `progress` (conquistas, sequência, histórico de pontos, reconhecimento manual, correção compensatória, metas, números agregados da família), `goal-edit` |
| Recompensas (038–046) | aba Recompensas, `reward/[id]`, `reward-edit`, `redemptions`, `wallet` (carteira, cofrinhos, pedidos, mesada), `allowance`, `allowance/[memberId]` |
| Notificações (047–049) | `notifications` (central, leitura, descarte), `notification-settings` (categorias e horário de silêncio) |
| Administração (050–056) | `member/[id]` (papel, permissões, apelido, remover acesso), `invitations`, `family-edit`, `values` |
| Configurações (057–061) | aba Ajustes, `profile`, `about` |
| Situações Especiais (062–067) | estados vazios, erros amigáveis em todas as ações, `ErrorBoundary` com retomada, `+not-found` |
| Fluxos Futuros (068–072) | não implementados (pós-Beta, conforme a documentação) |

### Regras de negócio aplicadas

- Papéis reais **ADMIN / GUARDIAN / MEMBER**, com `canManage` e `canApprove` checados em cada ação (não só na interface). Ninguém altera as próprias permissões; a família nunca fica sem administração.
- Convite com código de 8 caracteres, validade de 7 dias, uso limitado, sem convite de administração; aceite não duplica membro e reativa quem já esteve na família.
- **Task** (definição) separada de **Assignment** (ocorrência por dia e pessoa). Janela de 30 dias à frente, máximo de 366 ocorrências. Editar uma tarefa só afeta ocorrências futuras em aberto.
- Revisão só em `WAITING_APPROVAL`; pedir ajuste exige motivo; ninguém revisa a própria tarefa; crédito idempotente por evento.
- **Score histórico** (ledger imutável, correção por reversão compensatória) separado da **carteira** resgatável. Gastar ou guardar pontos não muda o histórico.
- Resgate reserva pontos e estoque; recusa ou cancelamento devolvem tudo; entrega é registro, não compra.
- Cofrinhos movem pontos entre disponível e guardado sem criar pontos.
- Mesada com períodos sem sobreposição, cálculo por pontos combinados × obtidos, política proporcional ou integral com mínimo, bônus, teto, acréscimos, arredondamento só no final e a máquina de estados documentada (`OPEN → CALCULATED → CLOSED → APPROVED → PAYMENT_PENDING → PAID`, com `REOPENED` e `CANCELLED`). Ninguém aprova a própria mesada. “Pago” é registro manual, não transferência bancária.
- Conquistas, sequência (dia sem tarefa programada não quebra) e metas da família ou individuais com bônus.
- Notificações idempotentes por evento e destinatário, preferências por categoria e horário de silêncio que adia avisos comuns.
- Números da família sempre agregados, sem ranking.

## O que é provisório

| Item | Situação | Onde trocar |
| --- | --- | --- |
| **Tokens visuais** | A Token Foundation v1 (81 tokens oficiais) não veio no pacote. As cores seguem a direção aprovada (Linho e Névoa, teal como ação, sálvia, areia e terracota de apoio, lavanda rara), mas os valores são provisórios. | `src/theme.ts` (único arquivo) |
| **Logo e Fê** | Logo e Fê-mestre oficiais (beta-approved) copiados sem alteração para `assets/brand/`. Poses novas da Fê (atenção, convite, curiosa; corpo e rosto) em `assets/brand/fe/`, colocadas no app por decisão do PO em 02/11/2026; a própria entrega pede revisão de semelhança antes de virar oficial. O modo “orientar” ainda não tem pose e mostra só texto. | `src/ui/Brand.tsx` (catálogo de poses) |
| **Ícones** | Ícone do app, ícone adaptativo Android e favicon do pacote de marca, usados por decisão do PO (as fichas do pacote ainda os marcavam como candidatos). Ícone monocromático e de notificação Android seguem bloqueados no pacote. | `assets/icons/`, `app.json` |
| **Splash** | Padrão do Expo. Os mestres de splash são composições de tela cheia e o template nativo está bloqueado no pacote (pede um símbolo central oficial). | `app.json` |
| **Dados** | Ficam só no aparelho (AsyncStorage). Toda regra está em `src/data/store.ts`, pronta para ser trocada por chamadas à API NestJS (`/api/v1/...`) sem mexer nas telas. | `src/data/` |

## Servidor (API)

O app está ligado à API do Família Feliz no Railway, com banco no Neon (`familia_feliz_app`, projeto `familia-feliz-staging-m1`). **Na conta do servidor, tudo fica no servidor**: vários aparelhos da mesma família veem as mesmas tarefas, pontos, recompensas, mesada, metas e notificações.

- **Motor de regras único:** `src/data/engine.ts` (+ `rules.ts`, `util.ts`, `types.ts`) são funções puras, sem tela nem armazenamento. A mesma cópia roda no servidor (`apps/api/src/domain/engine/`). Ao mudar uma regra, altere no app e copie os quatro arquivos para a API.
- **Como uma ação acontece:** a tela chama `actions.x()` (`src/data/store.ts`); a regra vale na hora no aparelho e a operação segue para a rota REST do módulo (`src/api/routes.ts`), junto com os ids criados no aparelho. O servidor aplica a mesma regra com trava por família (dois aparelhos aprovando ao mesmo tempo não creditam duas vezes), grava e devolve o estado oficial da família.
- **Se o servidor recusar** (ex.: a recompensa saiu do catálogo em outro aparelho), o app avisa e volta ao estado oficial.
- **Outros aparelhos** recebem as mudanças ao abrir o app, ao voltar para ele e a cada 10 segundos.
- **Cada pessoa recebe** só as próprias notificações e preferências; a mesada de todos só aparece para a administração.
- Endereço: `app.json` → `expo.extra.apiUrl` (sempre com `/api/v1`).
- Conta, famílias, membros e convites: `src/data/account.ts`. A família de exemplo continua 100% local e não usa o servidor.
- Convites usam código de 8 caracteres (sem 0/O e 1/I) e não diferenciam maiúsculas de minúsculas.
- Limites atuais: ainda não há recuperação de senha; sem internet, uma alteração não é guardada para depois (o app avisa e desfaz).

## Decisões em aberto: o que o app faz até o PO decidir

- **DEC-0020, desconto por atraso:** não é aplicado. Concluir depois do horário recebe os pontos integrais e aparece como “passou do horário — ainda dá para concluir”.
- **DEC-0021, apelido:** segue a regra da API, ou seja, só a administração edita. No perfil, quem não é da administração vê uma orientação para pedir.
- **DEC-0022, recuperação de senha:** sem envio externo. No modo local, o código de 6 dígitos aparece na tela.

## Estrutura

```
app/                      rotas (expo-router)
  (auth)/                 entrada
  (onboarding)/           primeiros passos
  (app)/(tabs)/           os 5 destinos
  (app)/...               telas de detalhe e gestão
src/
  theme.ts                tokens provisórios
  data/types.ts           modelo de dados
  data/rules.ts           regras puras (recorrência, mesada, carteira, conquistas, silêncio)
  data/store.ts           estado, persistência e ações com validação e permissões
  data/seed.ts            família de exemplo
  ui/                     componentes (primitivos, Screen, diálogos, domínio)
__tests__/rules.test.ts   testes das regras
```
