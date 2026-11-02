/**
 * Família Feliz — tema claro (único tema oficial).
 *
 * ATENÇÃO: os valores abaixo são PROVISÓRIOS. A Token Foundation v1 (81 tokens
 * oficiais, TOKEN_LOCKED) não veio no pacote de documentação. Os nomes seguem a
 * direção aprovada (Mural Sereno / Luz de Cuidado — Linho e Névoa, teal como
 * ação localizada, sálvia/areia/terracota de apoio, lavanda rara). Quando os
 * tokens oficiais forem importados, substitua apenas este arquivo.
 */

export const colors = {
  // Atmosfera — Linho e Névoa
  linen: '#F7F3EC',
  linenDeep: '#EFE8DC',
  mist: '#EEF2F1',
  surface: '#FFFFFF',
  line: '#E3DDD2',
  lineSoft: '#ECE7DE',

  // Texto (contraste AA sobre linho e branco)
  ink: '#1E2A2C',
  inkSoft: '#4A5759',
  inkMuted: '#6B7577',
  inkInverse: '#FFFFFF',

  // Ação localizada
  teal: '#1D6F69',
  tealPressed: '#155752',
  tealSoft: '#DCEEEB',

  // Apoio
  sage: '#7F9B7A',
  sageSoft: '#E5EDE2',
  sand: '#E4D3B4',
  sandSoft: '#F4EBDB',
  terracotta: '#B5603F',
  terracottaSoft: '#F6E2D8',
  lavender: '#8C86B8',
  lavenderSoft: '#ECEAF5',

  // Estados (nunca só cor: sempre acompanhados de texto/ícone)
  success: '#2F6F4E',
  successSoft: '#E1EFE6',
  attention: '#8A5A12',
  attentionSoft: '#F7ECD6',
  danger: '#A13D2D',
  dangerSoft: '#F7E1DC',
};

export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 48 };

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };

export const fonts = {
  title: 'Poppins_600SemiBold',
  titleMedium: 'Poppins_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
};

export const type = {
  display: { fontFamily: fonts.title, fontSize: 28, lineHeight: 36, color: colors.ink },
  title: { fontFamily: fonts.title, fontSize: 22, lineHeight: 30, color: colors.ink },
  heading: { fontFamily: fonts.title, fontSize: 17, lineHeight: 24, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.ink },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 22, color: colors.ink },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.inkSoft },
  smallStrong: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 18, color: colors.inkSoft },
  overline: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 16, letterSpacing: 0.6, color: colors.inkMuted },
};

/** Sombra curta e elevação mínima (Luz de Cuidado). */
export const shadow = {
  shadowColor: '#3B2F1E',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
};

/** Continuidade Serena: durações de referência (ms). */
export const motion = { reveal: 260, fade: 200, scale: 180 };

/** Tons para avatares por pessoa — identificação, nunca hierarquia. */
export const memberTones = [
  { bg: colors.tealSoft, fg: colors.teal },
  { bg: colors.sandSoft, fg: '#7A5A22' },
  { bg: colors.sageSoft, fg: '#4C6848' },
  { bg: colors.terracottaSoft, fg: colors.terracotta },
  { bg: colors.lavenderSoft, fg: '#5C5690' },
];

export const MIN_TOUCH = 44;
