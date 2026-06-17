# 🏗️ Documentação de Arquitetura e Implementações

Este documento detalha o conjunto de funcionalidades implementadas para transformar o MVP do desafio em uma aplicação robusta, escalável e pronta para um ambiente de produção real (High-End). Aqui, discorremos sobre o "O quê", o "Porquê" e o "Como" de cada decisão técnica.

---

## 0. Stack Tecnológica e Estrutura do Projeto

### Stack
| Camada | Tecnologia |
|--------|------------|
| Framework | **Next.js 15** (App Router) |
| Linguagem | **TypeScript** |
| UI | **React 19** + **Tailwind CSS v4** |
| Estado / Cache | **TanStack Query v5** (+ SSR dehydration) |
| HTTP (client) | **Axios** (`lib/api.ts`) |
| HTTP (server) | **fetch** nativo (`lib/api-server.ts`) |
| Ícones | **lucide-react** |
| Testes | **Vitest** |

### Estrutura de Pastas
```
app/
  layout.tsx          # Server Component — shell HTML + Providers
  page.tsx            # Server Component — prefetch + HydrationBoundary
  loading.tsx         # Server Component — skeleton Suspense
  providers.tsx       # Client boundary — QueryClientProvider
  api/realtime/       # Rota SSE nativa do Next.js (implementada, ver §8)

components/
  inbox/              # Composição RSC + client islands (workspace, connection)
  sidebar/            # Lista de conversas, busca, filtros, perfil do agente
  chat/               # Área do chat, balões, input, cabeçalho
  ui/                 # Primitivos reutilizáveis (Skeleton, VirtualList)

hooks/                # Lógica de negócio e comunicação com a API (client)
lib/
  api.ts              # Cliente Axios (mutations + queries no browser)
  api-server.ts       # fetch para Server Components / prefetch
  get-query-client.ts # QueryClient por requisição (server) vs singleton (browser)
  query-keys.ts       # Chaves centralizadas do React Query
  utils.ts            # Funções puras testáveis
```

### Server vs Client Components (RSC + Hydration)

`app/page.tsx` é um **async Server Component** que:
1. Executa `fetchQuery` de `/me` e `/conversations` no servidor antes de enviar HTML.
2. Desidrata o cache via `HydrationBoundary` — perfil e lista aparecem sem skeleton na primeira pintura.
3. Passa **Server Components como slots** para a ilha client `InboxWorkspace` (`connectionBanner`, `chatEmptyState`).

| Componente | Tipo | Responsabilidade |
|------------|------|------------------|
| `page.tsx` | Server | Prefetch, composição, erro de API no servidor |
| `ConnectionStatus` / `ConnectionError` | Server | Banner "✓ Conectado" no HTML inicial |
| `ChatEmptyState` | Server | Painel vazio do chat (zero JS) |
| `loading.tsx` | Server | Skeleton durante Suspense |
| `InboxWorkspace` | Client | Estado `selectedId`, busca, envio |
| `Providers` | Client | Boundary do QueryClient |

### Princípio de Organização
Adotamos **Separação de Responsabilidades (SoC)**: componentes visuais apenas renderizam; toda lógica de rede, cache e mutações vive em **custom hooks**. Funções puras (formatação, parsing) ficam em `lib/utils.ts` para serem testáveis sem React.

---

## 1. Single Source of Truth: TanStack Query

A decisão mais importante de arquitetura foi abolir gerenciadores de estado globais (como Redux ou Zustand) em prol do **TanStack Query (React Query)** atuando como a única fonte da verdade (*Single Source of Truth*).

- **Por que?** Em aplicações de mensageria, o estado é primordialmente assíncrono (dados de rede). O React Query nos entrega de graça: cache local, refetching em background (polling), atualizações otimistas e estado de *loading/error* imediato.
- **Como usamos?** Usamos `setQueryData` agressivamente para injetar dados falsos (mocks) ou atualizações em tempo real diretamente na memória cache sem precisar esperar a API responder. Isso manteve a UI incrivelmente rápida e reativa.

### Configuração Global (`app/providers.tsx`)
```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,           // Dados considerados frescos por 5s
      refetchOnWindowFocus: false // Evita refetch ao voltar para a aba
    }
  }
})
```

### Chaves de Cache Utilizadas
| Chave | Conteúdo |
|-------|----------|
| `["me"]` | Perfil do atendente |
| `["conversations"]` | Lista de conversas |
| `["messages", conversationId]` | Mensagens de uma conversa |
| `["typing", conversationId]` | Indicador de digitando (boolean) |

### Polling Inteligente
- Intervalo de **5 segundos** (`refetchInterval: 5000`) para conversas e mensagens ativas.
- Pausado automaticamente quando a aba está em background (`refetchIntervalInBackground: false`), economizando banda e carga no servidor.

---

## 2. Inventário de Custom Hooks

| Hook | Arquivo | Responsabilidade |
|------|---------|------------------|
| `useMe` | `hooks/use-me.ts` | Busca o perfil do atendente (`GET /me`). `staleTime` de 60s — dado estável. |
| `useConversations` | `hooks/use-conversations.ts` | Lista de conversas, busca, filtros, gestão de não-lidas no cliente. |
| `useMessages` | `hooks/use-messages.ts` | Mensagens, envio otimista, sugestão de IA. |
| `useMockMessage` | `hooks/use-mock-message.ts` | Simula mensagem recebida sob demanda (botão Bot). |
| `useRealtime` | `hooks/use-realtime.ts` | Escuta SSE e injeta mensagens/typing no cache. **Implementado, mas não montado na UI** (ver §8). |

---

## 3. Solucionando as Limitações do Backend Fechado

O desafio impôs um backend preexistente e não modificável. Tivemos que usar a engenharia front-end para contornar grandes limitações:

### A. O envio de mídias (Arquivos, Áudios, Imagens)
- **Problema**: A API aceita apenas o envio de uma string simples no payload `{ text: "..." }`. Não há rotas para upload multipart/form-data ou S3.
- **Decisão**: Desenvolvemos um codificador front-end que converte arquivos de até 600KB para Base64. Compactamos o Base64, o tipo do arquivo e o nome em um objeto JSON estrito (`{ type, url, name, size }`), que é salvo como "texto" pela API.
- **Efeito Mágico**: O componente `ChatBubble` consegue identificar se a mensagem de texto é um "JSON de Mídia" ou texto comum e renderiza a interface correspondente (player de áudio, miniaturas interativas com **lightbox**, ou cards de download de documentos). O backend nunca precisou saber que está armazenando arquivos!

### B. Gestão Inteligente das "Mensagens Não Lidas"
- **Problema**: O backend marcava uma conversa como "não lida" permanentemente, a menos que o *atendente* enviasse uma mensagem (POST). Ele não tem uma rota `PATCH /read`. Se o atendente apenas *abrisse* a conversa, o backend continuava mandando o número de não-lidas no próximo *polling*, irritando a UX.
- **Decisão**: O hook `useConversations` rastreia timestamps de leitura no cliente via `useRef<Record<string, string>>`. Ao selecionar uma conversa, guardamos o `lastMessageAt` atual. O `select` do React Query intercepta as respostas do backend: se a última mensagem for anterior ou igual ao momento da leitura, forçamos `unread: 0`. O cache é atualizado imediatamente com `setQueryData` para o badge sumir sem esperar o próximo poll.
- **Observação**: `useConversations` é instanciado em `page.tsx` (com `selectedId`) e em `ConversationList` (sem `selectedId`). Cada instância possui seu próprio `localReadTimestamps`; a lógica de "marcar como lida" roda apenas na instância de `page.tsx`.

### C. Polling Destrutivo vs. Mensagens Transientes
- **Problema**: Mensagens injetadas no cache (mock, SSE ou otimistas) não existem na API. O polling de 5 segundos as apagava da tela ao substituir o cache pelo retorno do servidor.
- **Decisão**: Utilizamos `structuralSharing` no hook `useMessages` com a função `mergeMessagesWithApiResponse`. Ela intercepta os dados da API e preserva mensagens transientes identificadas por prefixos de ID:

| Prefixo | Origem | Exemplo |
|---------|--------|---------|
| `optimistic-` | Envio otimista (aguardando confirmação da API) | `optimistic-1718467200000` |
| `mock-` | Botão Bot (`useMockMessage`) | `mock-1718467200000` |
| `realtime-` | SSE (`useRealtime` / `/api/realtime`) | `realtime-1718467200000` |

- **Deduplicação de envio otimista**: Quando a API confirma o envio, a mensagem real chega com ID diferente (`m-abc123`). Sem tratamento extra, o polling mantinha **duas bolhas** (otimista com relógio + real com ✓). A função `isOptimisticCounterpart` detecta correspondência por `body`, `direction` e proximidade de `createdAt` (30s) e descarta o placeholder otimista. O `onSuccess` da mutation substitui o ID otimista específico pelo retorno do servidor e guarda o `conversationId` no contexto para funcionar mesmo se o usuário trocar de conversa durante o envio.

### D. Sugestão de Resposta com IA
- **Rota**: `POST /ai/suggest` com `{ conversationId }`.
- **Segurança**: A chave da OpenAI permanece no backend; o frontend nunca acessa credenciais de IA.
- **UX**: O botão "Sugerir IA" no `ChatInput` dispara a mutation `suggestReply` em `useMessages`. O texto sugerido preenche o input para revisão do atendente antes do envio.

---

## 4. Sidebar: Busca, Filtros e Perfil

### Busca (`SearchBar` + `useConversations`)
- Campo de busca filtra em tempo real por **nome do contato**, **telefone** e **última mensagem**.
- Botão de limpar (×) quando há texto digitado.
- Estado `searchTerm` local no hook; filtragem via `useMemo`.

### Filtros por Aba
- **Todos**: exibe todas as conversas.
- **Não lidas**: exibe apenas conversas com `unread > 0`.
- Badge com contagem total de não lidas na aba "Não lidas".

### Perfil do Agente (`AgentProfile` + `useMe`)
- Exibe nome, cargo e avatar com iniciais.
- Indicador de status online (ponto verde).
- Skeleton durante carregamento; estado de erro com ícone de alerta.

### Preview de Mídia na Lista
O `ConversationItem` usa `parseMediaMessage` para exibir ícones contextuais (câmera, documento, microfone) em vez do JSON bruto quando a última mensagem é um anexo.

---

## 5. Simulação de Tempo Real e UX (O Botão de Teste)

- Inicialmente, criamos uma rota SSE nativa do Next.js (`app/api/realtime/route.ts`) que empurrava mensagens automaticamente a cada 12 segundos. O hook `useRealtime` escuta esse canal via `EventSource` e injeta mensagens e eventos de typing no cache.
- **Pivot para demonstração**: Para fins de validação (testes do recrutador), a imprevisibilidade de mensagens automáticas dificultava a avaliação. Criamos o hook `useMockMessage` com botões discretos (ícone Bot) no cabeçalho do chat e em cada item da lista.
- **Fluxo do mock**: (1) ativa `["typing", id]` → (2) aguarda 3s → (3) injeta mensagem com ID `mock-` → (4) atualiza preview e badge de não lidas na sidebar.

### Indicador de Digitando (Bounce)
- Estado salvo no cache via chave `["typing", conversationId]`.
- Exibido no cabeçalho do chat ("Digitando..."), na lista lateral e como mini-balão com 3 pontos animados (*bounce*) no `ChatArea`.
- Auto-clear após 5 segundos como rede de segurança (`useRealtime` e `useMockMessage`).

---

## 6. Área do Chat: UX e Ergonomia

### Layout Responsivo (`app/page.tsx`)
- **Mobile**: lista de conversas em tela cheia; ao selecionar, abre o chat com botão voltar (`ArrowLeft`).
- **Desktop**: painel split-screen — sidebar fixa (380px) + área de chat.

### Envio de Mensagens
- **Atualização otimista**: mensagem aparece instantaneamente com ícone de relógio (ID `optimistic-`). Após confirmação da API, substituída pela mensagem real com ✓.
- **Rollback**: em caso de falha, cache restaurado e toast de erro com opção de reenvio (`ChatInput`).
- **Enter para enviar**: `keydown` no input dispara `handleSend` (sem Shift).
- **Foco automático**: ao abrir ou trocar de conversa, o input recebe foco (`useEffect` em `ChatInput` observando `conversationId`).
- **Lista lateral**: conversa sobe para o topo com preview atualizado no `onMutate`.

### Scroll Inteligente (`ChatArea`)
- Scroll instantâneo (`auto`) ao carregar uma conversa.
- Scroll suave (`smooth`) ao receber novas mensagens, durante envio ou quando o indicador de typing aparece.

### Status de Mensagens (`ChatBubble`)
Ícones de confirmação para mensagens enviadas (direção `out`):
| Status | Ícone |
|--------|-------|
| Otimista (enviando) | Relógio animado |
| `sent` | ✓ |
| `delivered` | ✓✓ |
| `read` | ✓✓ (azul) |

### Estados de Erro
- Lista de conversas e histórico de mensagens exibem tela de erro com botão "Tentar novamente" (`refetch`).

### Formatação de Telefone
- Função reutilizável `formatPhoneNumber` em `lib/utils.ts`.
- Converte `5511988887766` → `+55 (11) 98888-7766`.
- Utilizada no cabeçalho do chat; disponível para qualquer componente.

---

## 7. Performance Extrema com Virtualização

- **Por que?** Renderizar milhares de nós no DOM destrói a performance (FPS). A sidebar precisava sobreviver em cenários de call centers grandes.
- **Decisão**: Implementamos o componente proprietário `VirtualList` sem dependências externas pesadas (`react-window`). Baseado em `onScroll` + `ResizeObserver`, calcula os índices visíveis com altura fixa de **76px** por item, renderiza apenas ~10–15 itens com buffer de 2 acima/abaixo, e usa espaçadores (`paddingTop`/`paddingBottom`) para manter a altura total da lista.

---

## 8. Tempo Real (SSE): Estado Atual

| Componente | Status |
|------------|--------|
| `app/api/realtime/route.ts` | ✅ Implementado — stream SSE com typing + mensagens a cada 12s |
| `hooks/use-realtime.ts` | ✅ Implementado — merge no cache, deduplicação, atualização da sidebar |
| Montagem na UI (`page.tsx`) | ❌ **Não conectado** — `useRealtime()` não é chamado |

**Em produção na UI atual**, apenas o `useMockMessage` (botão Bot) está ativo. Para reativar o SSE automático, basta chamar `useRealtime(selectedId)` em `page.tsx` ou `ChatArea`.

---

## 9. Garantia de Qualidade e Vitest

- **O que fizemos**: Lógicas centrais foram extraídas para `lib/utils.ts` — funções puras, testáveis sem React.
- **Funções cobertas**:

| Função | Responsabilidade |
|--------|------------------|
| `formatMessageTime` | Datas estilo WhatsApp (hoje → HH:MM, ontem → "Ontem", antigo → DD/MM) |
| `parseMediaMessage` | Detecta e parseia JSON de mídia com `try/catch` seguro |
| `formatPhoneNumber` | Formata telefones brasileiros para exibição |

- **Execução**: `npm test` (Vitest).
- **Cobertura atual**: `lib/utils.test.ts` — 12 testes cobrindo os três utilitários e cenários de borda (JSON malformado, formatos inválidos de telefone).

---

## 10. Considerações de UI/UX

- **Tipografia e Cores**: Paleta baseada em `slate` profunda (`slate-950`, `slate-800`), detalhes em `emerald` (confirmação/sucesso) e `indigo` (ações de IA). Reduz fadiga visual em jornadas longas de atendimento.
- **Skeletons Inteligentes**: Carregamento com placeholders nas dimensões exatas do conteúdo final — sem saltos de layout (*CLS*).
- **Micro-interações**: Hover suave (200ms), glow no botão de IA durante processamento, animação `fadeIn` em toasts de erro e previews de anexo.
- **Acessibilidade**: `aria-label` em botões de ação, `lang="pt-BR"` no HTML, contraste adequado em badges e estados de foco.

---

## 11. Cliente HTTP e Tipos (`lib/api.ts`)

- Cliente Axios configurado com `NEXT_PUBLIC_API_URL` (padrão: `http://localhost:4000`).
- Timeout de 20 segundos.
- Tipos TypeScript exportados: `Conversation`, `Message`, `Agent`, `AiSuggestion`.
- Rotas utilizadas:

| Método | Rota | Função |
|--------|------|--------|
| GET | `/me` | `getMe()` |
| GET | `/conversations` | `getConversations()` |
| GET | `/conversations/:id/messages` | `getMessages()` |
| POST | `/conversations/:id/messages` | `sendMessage()` |
| POST | `/ai/suggest` | `suggestReply()` |

---

## 12. Considerações Finais

A arquitetura final alcançou excelência porque:

1. **Isolou a complexidade de rede** em hooks coesos com responsabilidade única.
2. **Superou barreiras do backend inflexível** usando cache inteligente no cliente (não-lidas, mídia, mensagens transientes).
3. **Encapsulou lógica pura** em utilitários testados com Vitest.
4. **Priorizou UX de produto real**: otimismo, typing, busca, filtros, responsividade e ergonomia de teclado.
5. **Manteve performance** com virtualização nativa e polling consciente de recursos.

O SSE e o mock coexistem no código — o mock está ativo na UI por decisão de demonstração, enquanto a infraestrutura SSE permanece pronta para ativação com uma linha de integração.
