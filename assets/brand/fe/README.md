# Fê — três poses e três rostos

Entrega de 02/11/2026. Seis PNGs individuais com canal alpha, baseados nas direções da linha inferior selecionadas pelo usuário. Não inclui as três poses da linha superior nem a pose original de joinha.

| Expressão | Corpo inteiro | Somente rosto |
| --- | --- | --- |
| Atenção | [fe-atencao-corpo.png](fe-atencao-corpo.png) | [fe-atencao-rosto.png](fe-atencao-rosto.png) |
| Convite | [fe-convite-corpo.png](fe-convite-corpo.png) | [fe-convite-rosto.png](fe-convite-rosto.png) |
| Curiosa | [fe-curiosa-corpo.png](fe-curiosa-corpo.png) | [fe-curiosa-rosto.png](fe-curiosa-rosto.png) |

Corpos: 1024×1536. Rostos: 1254×1254 (dimensão efetivamente retornada pela ferramenta). Nos rostos, corpo, patas e lenço ficam fora do recorte, conforme pedido de somente rosto.

Abra [PREVIA.html](PREVIA.html) para comparar os arquivos sobre fundos claro #F7F3EC e escuro #1E2A3A, incluindo exibição a 64 px de altura de imagem. Essa prévia não certifica integração runtime ou acessibilidade.

## Verificação e limites

- PNG RGBA e transparência real verificados nos seis arquivos.
- Margens do contorno principal (alpha >= 16) acima de 100 px em todos os lados. As margens foram ampliadas após detectar versões iniciais apertadas.
- Medidas e contagem de alpha em VALIDACAO.json; integridade em HASHES.json.
- Ainda requerem revisão final de semelhança, escala entre poses, acabamento das bordas e leitura no app. Não são automaticamente promovidos ao catálogo oficial.
- O canal alpha inclui pixels parcialmente transparentes também no personagem; não foi aplicada normalização de opacidade por processamento externo.
- Não há PSD/Krita/Procreate com camadas; PNGs são raster. Não há contrato de cessão de direitos criado por esta entrega.
- Arquivo mestre, assets canônicos, tokens e código do app não foram alterados.
- Mestre: assets-inbox/fe-master.png. SHA-256 antes e depois: 704680198F797F10B0543E4231EAC61F6F9C4BF5B801DBFB596B3A697B6823DA.

Processo: [PROMPTS.md](PROMPTS.md). Produzido com image_gen integrada. Nenhum uso de CLI/API externa.
