# InHire Design System

O frontend usa shadcn como base estrutural e tokens semânticos como única fonte de verdade visual.

## Regras

- Priorize componentes existentes em `src/components/ui` antes de criar HTML isolado.
- Personalize componentes shadcn nos próprios arquivos; evite sobrescrever estilos em cada página.
- Use apenas nomes semânticos (`bg-background`, `text-foreground`, `border-border`, `bg-primary`).
- Não use hex ou medidas arbitrárias em páginas, salvo arte editorial excepcional documentada.
- Ícones são exclusivamente `lucide-react`, normalmente em 16, 20 ou 24 px.
- A fonte oficial é Bricolage Grotesque, pesos 200–800, com optical sizing.
- Espaçamento segue grade de 4 px, com predominância de 8, 12, 16, 20, 24, 32 e 40 px.

## Tokens

Os tokens vivem em `src/styles/globals.css`:

- Cores e temas: `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--border`.
- Raios: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-shell`.
- Movimento: `--duration-fast`, `--ease-expo`; sequências editoriais usam GSAP.
- Elevação: `--shadow-shell`.
- Tipografia: `--font-sans`, `text-display`, `text-title`, `text-eyebrow`.

Alterações nesses tokens afetam todos os componentes e ambos os temas.

## Componentes shadcn iniciais

- `Button`: variantes default, secondary, outline, ghost e link; tamanhos sm, default, lg, icon e pill.
- `Input`: suporte nativo a ícones inicial/final e estado inválido.
- `Label`: acessível via Radix.
- `Card`: estrutura semântica com header, content e footer.

## Autenticação

- Formulários usam React Hook Form e Zod.
- A sessão deve vir do backend em cookie `httpOnly`, `Secure` e `SameSite`.
- Nunca armazenar token de autenticação em `localStorage`.
- Requisições autenticadas devem usar `credentials: 'include'`.

## Movimento e mídia

- GSAP coordena apenas animações editoriais e interações complexas; estados simples continuam usando os tokens CSS.
- A entrada usa stagger curto, o ponteiro produz parallax limitado e o scroll altera profundidade sem esconder conteúdo.
- Toda experiência precisa respeitar `prefers-reduced-motion`; sequências decorativas devem ser pausáveis e manter um frame estático como fallback.
- O hero de login usa 180 imagens Full HD em `/mascote-frames`, com playhead GSAP independente do estado React.
- A sequência deve manter os arquivos 1920×1080 originais, sem recompressão ou redimensionamento prévio.
- O frame nítido usa 125% da largura do painel, mantém a proporção 16:9 e nunca ultrapassa a resolução nativa em layouts suportados.
- Uma cópia escurecida e desfocada usa `object-cover` apenas como preenchimento ambiental; ela não é a camada focal.
- A composição mantém o personagem inteiro na região inferior e reduz o recorte horizontal responsável pela sensação de zoom.
- A camada focal deve usar `media-blend-mask`, com transição de 0% a 32% da altura, evitando emendas horizontais entre as duas composições.
- O footer da mídia usa `video-footer-blend`: transição longa e sem bordas, do transparente ao preto, integrada à imagem.
- Barras de progresso sobre mídia usam track arredondado e translúcido; divisores sólidos de 1 px devem ser evitados.
- Overlays globais da mídia devem permanecer leves (`60%` na área de texto e `25%` na base); escurecimento forte fica restrito ao footer.
- A camada focal pode usar filtros CSS moderados de brilho e saturação, preservando os arquivos Full HD originais sem recompressão.
- No desktop, a página de login ocupa exatamente `100svh`; o shell usa a altura disponível e seus filhos devem manter `min-height: 0`.
- Espaçamentos verticais do login usam `clamp()` para caber em telas baixas sem perder a proporção em telas maiores.
- Sequências de imagens devem atualizar o `src` por referência e pré-carregar em lotes; não devem causar um render React por frame.
- No login, o playhead é controlado exclusivamente pelo formulário: e-mail, senha, envio, sucesso ou erro.
- Progresso de formulário deve ser elevado para a página e entregue à sequência como estado semântico, sem acoplar o hero ao React Hook Form.
- Novos hotspots devem ser botões acessíveis e operar por teclado, nunca elementos visuais clicáveis sem semântica.
