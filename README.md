# Inbox de Atendimento WhatsApp com IA — Frontend

Este é o frontend de um painel de atendimento via WhatsApp integrado a um assistente de Inteligência Artificial, desenvolvido como solução para o desafio técnico. O projeto foi construído utilizando **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS v4** e **TanStack Query v5**.

---

## 🚀 Como Executar o Projeto

1. **Configurar variáveis de ambiente**:
   Copie o arquivo `.env.example` para `.env.local` e configure a URL da API (o valor padrão já aponta para a API hospedada em produção):
   ```bash
   cp .env.example .env.local
   ```

2. **Instalar dependências**:
   ```bash
   npm install
   ```

3. **Executar em modo de desenvolvimento**:
   ```bash
   npm run dev
   ```
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o painel.

4. **Gerar build de produção**:
   ```bash
   npm run build
   ```

5. **Executar testes**:
   ```bash
   npm test
   ```

---

## 🏗️ Decisões de Arquitetura

Resumo das principais escolhas. Para a documentação completa (stack, hooks, workarounds do backend, SSE, virtualização e testes), consulte **[architectural_decisions.md](./architectural_decisions.md)**.

### Separação de Responsabilidades

- **Custom Hooks** concentram toda a lógica de API e cache: `use-me`, `use-conversations`, `use-messages`, `use-mock-message`.
- **Componentes visuais** apenas renderizam UI, organizados por domínio (`components/sidebar`, `components/chat`, `components/ui`).
- **Utilitários puros** em `lib/utils.ts` (formatação de datas, telefone, parsing de mídia) com cobertura de testes.

### Server vs Client Components

A página principal (`app/page.tsx`) é um **async Server Component** que:
1. Faz **prefetch** de `/me` e `/conversations` no servidor via `fetch` (`lib/api-server.ts`).
2. **Desidrata** o cache com `HydrationBoundary` — a UI renderiza sem skeleton na primeira pintura.
3. Compõe **ilhas client** (`InboxWorkspace`) apenas onde há estado e interatividade.

Componentes estáticos renderizados no servidor (zero JS no cliente):
- `ConnectionStatus` / `ConnectionError` — banner de conexão no HTML inicial.
- `ChatEmptyState` — estado vazio do painel de chat.
- `app/loading.tsx` — skeleton exibido pelo Suspense durante o prefetch.

O `layout.tsx` permanece Server Component; `Providers` é client boundary para o QueryClient.

### Sincronização de Dados

1. **Polling (TanStack Query)** — intervalo de **5 segundos** para conversas e mensagens ativas, pausado em background (`refetchIntervalInBackground: false`).
2. **Atualização otimista** — mensagem aparece instantaneamente com ícone de envio; substituída pela confirmação da API; rollback em caso de erro.
3. **Merge inteligente** — `structuralSharing` preserva mensagens transientes (`optimistic-`, `mock-`, `realtime-`) sem duplicar após confirmação do servidor.

### UX & Acessibilidade

- Layout responsivo (mobile: lista → chat fullscreen; desktop: split-screen).
- Estados de loading (skeletons), erro (retry) e vazio em lista e chat.
- `aria-label`, `aria-live` e `lang="pt-BR"`.
- Enter para enviar, foco automático no input ao abrir conversa.

---

## 🚀 Funcionalidades Implementadas

### Requisitos do desafio

| Funcionalidade | Status |
|----------------|--------|
| Lista de conversas (contato, preview, horário, não-lidas) | ✅ |
| Busca e filtro (Todos / Não lidas) | ✅ |
| Chat com bolhas cliente × atendente e timestamps | ✅ |
| Envio com atualização otimista | ✅ |
| Sugestão de resposta com IA (`/ai/suggest`) | ✅ |
| Polling com React Query | ✅ |

### Diferenciais extras

- **Mídias** — anexos (imagem, áudio, PDF) via Base64 em JSON; lightbox, player e download no `ChatBubble`.
- **Simulação de mensagens** — botão Bot (`useMockMessage`) com indicador de digitando.
- **Infraestrutura SSE** — rota `/api/realtime` + hook `useRealtime` implementados, prontos para ativação (hoje o mock manual está ativo na UI por ser mais previsível em demonstrações).
- **VirtualList** — lista lateral virtualizada para performance com muitas conversas.
- **Vitest** — testes em `lib/utils.test.ts`.

---

## 🔮 O que faria com mais tempo

1. **WebSocket ou SSE ativo** — conectar `useRealtime` na UI e desligar o polling quando houver conexão em tempo real, usando polling apenas como fallback.
2. **Rota `PATCH /read` no backend** — eliminar o workaround de timestamps locais para não-lidas; hoje resolvemos no cliente com `useRef` + `select`.
3. **Upload real de mídia** — substituir Base64 por presigned URLs (S3) quando o backend suportar multipart.
4. **Testes de integração** — React Testing Library para hooks e fluxos críticos (envio otimista, busca, sugestão IA).
5. **Acessibilidade avançada** — navegação completa por teclado na lista, `focus trap` no lightbox, contraste WCAG AA auditado.
6. **Histórico infinito** — paginação cursor-based nas mensagens (`useInfiniteQuery`) para conversas longas.
7. **Consolidar `useConversations`** — instância única via Context para evitar refs de leitura duplicados entre `page.tsx` e `ConversationList`.

---

## 🔒 Segurança

- Chaves da OpenAI permanecem no backend; o frontend chama apenas `POST /ai/suggest`.
- Inputs textuais renderizados pelo React sem `dangerouslySetInnerHTML`.
