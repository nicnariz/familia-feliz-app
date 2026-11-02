// Marca oficial: arquivos beta-approved copiados byte a byte (hashes conferidos com branding/manifest/assets.json).
// Não redimensionar, recortar ou editar os PNGs. Aqui só ajustamos a apresentação: o contêiner esconde
// apenas a margem transparente do arquivo (alfa ≤ 20), sem tocar em nenhum pixel visível.
import React from 'react';
import { Image, View, type StyleProp, type ViewStyle } from 'react-native';

const LOGO = require('../../assets/brand/logo-familia-feliz-horizontal.png');
const FE = require('../../assets/brand/fe-master.png');

/**
 * Catálogo de artes da Fê. Cada arte guarda a área visível medida no PNG (alfa > 20), para o
 * contêiner esconder só a margem transparente. Arquivos copiados byte a byte; hashes em
 * assets/brand/fe/HASHES.json (entrega de 02/11/2026, colocada no app por decisão do PO).
 */
type Art = { source: number; w: number; h: number; x0: number; x1: number; y0: number; y1: number };
const ART = {
  joinha: { source: FE, w: 1024, h: 1536, x0: 210, x1: 848, y0: 109, y1: 1045 }, // fe-master.png
  atencaoCorpo: { source: require('../../assets/brand/fe/fe-atencao-corpo.png'), w: 1024, h: 1536, x0: 157, x1: 834, y0: 274, y1: 1259 },
  atencaoRosto: { source: require('../../assets/brand/fe/fe-atencao-rosto.png'), w: 1254, h: 1254, x0: 260, x1: 1024, y0: 347, y1: 945 },
  conviteCorpo: { source: require('../../assets/brand/fe/fe-convite-corpo.png'), w: 1024, h: 1536, x0: 163, x1: 882, y0: 299, y1: 1216 },
  conviteRosto: { source: require('../../assets/brand/fe/fe-convite-rosto.png'), w: 1254, h: 1254, x0: 235, x1: 1064, y0: 301, y1: 955 },
  curiosaCorpo: { source: require('../../assets/brand/fe/fe-curiosa-corpo.png'), w: 1024, h: 1536, x0: 170, x1: 849, y0: 322, y1: 1223 },
  curiosaRosto: { source: require('../../assets/brand/fe/fe-curiosa-rosto.png'), w: 1254, h: 1254, x0: 241, x1: 1044, y0: 328, y1: 968 },
} satisfies Record<string, Art>;

/**
 * Modos da Fê (Brand Book, “Uso do Fê por contexto”) e a arte de cada um.
 * - receber / convite: aceno amigável · celebrar: joinha · atencao (atraso) e tranquilizar (erro): atenta e gentil
 * - curiosa: estado vazio · orientar: ainda sem pose aprovada → só texto
 * `face` = arte dos balões pequenos; `body` = corpo inteiro para espaços maiores.
 */
export type FeMode = 'receber' | 'orientar' | 'celebrar' | 'tranquilizar' | 'atencao' | 'convite' | 'curiosa';
export const FE_POSES: Partial<Record<FeMode, { face: Art; body: Art }>> = {
  receber: { face: ART.conviteRosto, body: ART.conviteCorpo },
  convite: { face: ART.conviteRosto, body: ART.conviteCorpo },
  celebrar: { face: ART.joinha, body: ART.joinha },
  atencao: { face: ART.atencaoRosto, body: ART.atencaoCorpo },
  tranquilizar: { face: ART.atencaoRosto, body: ART.atencaoCorpo },
  curiosa: { face: ART.curiosaRosto, body: ART.curiosaCorpo },
};

// Área visível medida nos mestres (px): logo 1536×1024 → x 211–1320, y 336–652; Fê 1024×1536 → x 210–848, y 109–1045.
const LOGO_FILE = { w: 1536, h: 1024, x0: 211, x1: 1320, y0: 336, y1: 652 };

function Trimmed({ source, file, width, height, label, style }: { source: number; file: { w: number; h: number; x0: number; x1: number; y0: number; y1: number }; width?: number; height?: number; label?: string; style?: StyleProp<ViewStyle> }) {
  const visW = file.x1 - file.x0;
  const visH = file.y1 - file.y0;
  const scale = width !== undefined ? width / visW : (height ?? 100) / visH;
  return (
    <View
      style={[{ width: visW * scale, height: visH * scale, overflow: 'hidden' }, style]}
      accessible={!!label}
      accessibilityRole={label ? 'image' : undefined}
      accessibilityLabel={label}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
    >
      <Image
        source={source}
        resizeMode="contain"
        style={{ width: file.w * scale, height: file.h * scale, marginLeft: -file.x0 * scale, marginTop: -file.y0 * scale }}
      />
    </View>
  );
}

/** Assinatura horizontal completa (Fê + nome + slogan). Mínimo digital do Brand Book: 240 px de largura. */
export function Logo({ width = 260, style }: { width?: number; style?: StyleProp<ViewStyle> }) {
  return <Trimmed source={LOGO} file={LOGO_FILE} width={Math.max(240, width)} label="Família Feliz — Conectando hábitos, fortalecendo laços" style={style} />;
}

/** Fê na pose aprovada para o modo pedido (ou nada, se ainda não houver). Decorativa para leitores de tela. */
export function FeImage({ height = 72, mode = 'celebrar', variant = 'face', style }: { height?: number; mode?: FeMode; variant?: 'face' | 'body'; style?: StyleProp<ViewStyle> }) {
  const art = FE_POSES[mode]?.[variant];
  if (!art) return null;
  return <Trimmed source={art.source} file={art} height={height} style={style} />;
}
