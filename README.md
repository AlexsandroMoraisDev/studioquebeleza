# One-Page Modelo — landing page editável

Landing page de página única em **Next.js 16 + React 19 + Tailwind CSS 4**, feita para ser
reutilizada como modelo: **todo o conteúdo do site vive em um único arquivo JSON**
(`content/site-config.json`).

O código do template não muda de cliente para cliente — só o JSON. Isso permite:
- trocar textos, imagens, listas, cores e SEO **sem tocar em código**;
- editar tudo por um **painel web** com pré-visualização de campos;
- versionar o conteúdo junto com o projeto (o JSON é commitado).

O conteúdo atual é o da **Busca Vida Garden** (plantas, vasos e produtos para piscina — Camaçari/BA),
usado como exemplo real de preenchimento.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + Tailwind CSS 4 + componentes shadcn/ui |
| Ícones | lucide-react |
| Tema | next-themes (claro/escuro) |
| Conteúdo | JSON (`content/site-config.json`) + painel próprio |
| Analytics | @vercel/analytics |
| Gerência de pacotes | pnpm |

---

## Como rodar

```bash
pnpm install     # instala as dependências (lockfile preservado)
pnpm dev         # servidor de desenvolvimento em http://localhost:3000
pnpm build       # build de produção (valida os tipos)
pnpm start       # sobe o build de produção
pnpm lint        # ESLint
pnpm typecheck   # TypeScript (tsc --noEmit)
pnpm test        # testes de unidade (Vitest)
```

Toda alteração é validada no CI (`.github/workflows/ci.yml`): lint, tipos, testes e build.

> Requer Node.js 20+ e pnpm. Se não tiver o pnpm: `corepack enable` ou `npm i -g pnpm`.

---

## Estrutura do projeto

```
app/
  layout.tsx            # metadata/SEO, fontes, tema, CSS das cores do painel
  page.tsx              # monta a página na ordem das seções
  globals.css           # design tokens (Tailwind) + variáveis de tema
  api/site-config/      # API que lê/grava content/site-config.json (usada pelo painel)
  api/uploads/          # recebe as fotos do painel e as serve de content/uploads/
  painel/               # editor de conteúdo (rota oculta — ver abaixo)
  robots.ts, sitemap.ts # SEO
  opengraph-image.tsx   # imagem de compartilhamento 1200x630 gerada no build
components/
  navbar, hero-section, services-section, about-section, process-section,
  testimonials-section, faq-section, contact-section, portfolio-section, footer,
  structured-data.tsx   # JSON-LD LocalBusiness + FAQPage
  painel/field-editor.tsx  # editor genérico de campos (texto, lista, ícone, cor)
content/
  site-config.json      # ✅ FONTE ÚNICA DE CONTEÚDO
  uploads/              # fotos enviadas pelo painel
lib/
  site-config.ts        # tipos, esqueleto neutro, merge e CSS das cores
  panel-sections.ts     # ordem dos blocos no painel + rótulos em português
  config-utils.ts       # utilidades de edição (atualizar/mover/remover itens)
  icons.ts              # mapa de ícones disponíveis no painel
```

---

## Editando o conteúdo

### Opção 1 — painel web (recomendado)

O painel roda em uma **rota oculta** definida por `ADMIN_PATH` (padrão `/painel-interno`).
A rota `/painel` responde **404** de propósito para quem tentar adivinhar, e o caminho
oculto está fora do `robots.txt`.

1. Copie `.env.example` para `.env.local` e ajuste:
   ```bash
   ADMIN_PATH=/seu-caminho-secreto
   ADMIN_KEY=uma-chave-forte             # opcional, mas recomendado
   ```
2. Rode `pnpm dev` e abra `http://localhost:3000/seu-caminho-secreto`.
3. Edite os blocos na ordem em que o visitante lê a página e clique em **Salvar**.
   O painel grava direto em `content/site-config.json`.

A API protege a escrita com:
- **Origem**: requisições `PUT` de outro domínio são recusadas (403);
- **Chave**: se `ADMIN_KEY` estiver definida, a requisição precisa enviar o cabeçalho
  `x-admin-key` com o mesmo valor.

> ⚠️ Em ambientes **serverless** (Vercel, etc.) o disco não é gravável de forma persistente.
> Nesse caso o botão Salvar avisa e você deve usar **Baixar JSON** e substituir
> `content/site-config.json` no repositório (o conteúdo é aplicado no próximo deploy).

### Portfólio de fotos (upload pelo painel)

No bloco **“5. Portfólio (fotos)”** do painel, clique em **Adicionar** e:
1. **Foto** — clique em *Escolher arquivo* e envie a imagem do computador
   (JPG, PNG, WEBP, GIF ou AVIF, até 8 MB). A foto é gravada em `content/uploads/`
   e o endereço (`/api/uploads/...`) é preenchido automaticamente. Também é possível
   colar o endereço de uma imagem já hospedada.
2. **Título**, **Categoria** e **Descrição** — opcionais, mas ajudam no Google e no visual.
3. Clique em **Salvar**.

Comportamento automático do site:
- **Com uma ou mais fotos**: a seção `#portfolio` aparece entre “Serviços” e “Sobre nós”,
  em grade responsiva (3 colunas no desktop).
- **Sem nenhuma foto**: a seção **não é exibida** e o item de menu “Portfólio”
  também **desaparece** sozinho — o site nunca mostra uma seção vazia.

> Em ambiente serverless, grave as fotos em um host de imagens e cole o endereço no campo
> “Foto”, ou faça o upload localmente e commite a pasta `content/uploads/`.

### Opção 2 — editar o JSON diretamente

Abra `content/site-config.json` e altere os campos. Qualquer campo ausente é preenchido
automaticamente por um esqueleto neutro (`emptySiteConfig` em `lib/site-config.ts`), então o
site nunca quebra por conteúdo incompleto.

---

## Como usar como modelo para outro cliente

1. Substitua o conteúdo em `content/site-config.json` (marca, serviços, contato, SEO, cores).
2. Reaproveite os blocos existentes: hero, serviços, sobre, processo, depoimentos, FAQ,
   contato e rodapé. Cada lista aceita **adicionar, reordenar e remover** itens pelo painel.
3. Ajuste as cores de marca em `colors` (aplicadas via `siteThemeCss` no `<html>`).
   A cor primária informada é convertida automaticamente em duas variações com
   contraste WCAG AA (≥ 4,5:1) — uma para o tema claro e outra para o escuro —
   então qualquer marca continua legível sem ajuste manual.
4. Troque `meta.siteUrl` (ou defina `NEXT_PUBLIC_SITE_URL`) para o domínio final.
5. Os ícones disponíveis estão em `lib/icons.ts` e são escolhidos no painel.

---

## Variáveis de ambiente

Veja `.env.example`. Nenhuma é obrigatória para rodar localmente.

| Variável | Para que serve |
|---|---|
| `ADMIN_PATH` | Caminho oculto do painel (padrão `/painel-interno`) |
| `ADMIN_KEY` | Chave extra exigida no cabeçalho `x-admin-key` para salvar |
| `NEXT_PUBLIC_SITE_URL` | URL pública final do site (SEO, canonical, sitemap) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Código de verificação do Search Console |

---

## SEO

- `app/layout.tsx`: título, descrição, keywords, canonical, OpenGraph e Twitter Card.
- `app/opengraph-image.tsx`: imagem 1200×630 gerada no build.
- `app/sitemap.ts` e `app/robots.ts`: sitemap e robots (bloqueiam o painel e `/api`).
- `components/structured-data.tsx`: JSON-LD `LocalBusiness` e `FAQPage` a partir do JSON.

---

## Deploy

Aplicação Next.js padrão: qualquer host que rode Node (Vercel, VPS, Docker).

```bash
pnpm build
pnpm start
```

Lembre-se: em host serverless, o painel não salva em disco — edite o JSON e faça deploy.
