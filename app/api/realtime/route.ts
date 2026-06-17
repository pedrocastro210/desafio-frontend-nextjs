import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const MOCK_MESSAGES = [
  "Olá! Obrigado pelo retorno. Como andam as coisas?",
  "Certo, entendi perfeitamente. Você consegue verificar isso para mim?",
  "Poderia me enviar mais detalhes sobre o serviço?",
  "Perfeito! Fico no aguardo.",
  "Muito obrigado pela ajuda hoje! 👍",
  "Você teria um tempo para uma chamada rápida?",
  "Isso resolve meu problema, valeu!",
  "Pode me passar o número do pedido?",
  "Consegui resolver aqui, muito obrigado!",
];

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  // Receber IDs de conversa do cliente como um parâmetro de consulta
  // Ex.: /api/realtime?ids=c-1001,c-1002,c-1003
  const idsParam = req.nextUrl.searchParams.get("ids");
  const conversationIds = idsParam ? idsParam.split(",").filter(Boolean) : [];

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // O stream pode ter sido fechado
        }
      };

      // Enviar confirmação de conexão inicial
      sendEvent("connected", { status: "ready", timestamp: new Date().toISOString() });

      // Se nenhum ID de conversa foi fornecido, apenas manter o stream aberto sem enviar eventos
      if (conversationIds.length === 0) {
        req.signal.addEventListener("abort", () => {
          controller.close();
        });
        return;
      }

      // Loop de envio de eventos
      const intervalId = setInterval(() => {
        const conversationId =
          conversationIds[Math.floor(Math.random() * conversationIds.length)];
        const body = MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)];

        // Enviar evento typing = true
        sendEvent("typing", { conversationId, isTyping: true });

        // Após 3 segundos, enviar typing = false e a mensagem real
        setTimeout(() => {
          sendEvent("typing", { conversationId, isTyping: false });

          const message = {
            id: `realtime-${Date.now()}`,
            direction: "in",
            body,
            status: "read",
            createdAt: new Date().toISOString(),
          };
          sendEvent("message", { conversationId, message });
        }, 3000);
      }, 12000); // A cada 12 segundos

      req.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
