export interface MediaPayload {
  type: "image" | "document" | "audio";
  name: string;
  size: string;
  url: string;
}

/**
 * Formata uma string ISO de data em um timestamp amigável no WhatsApp
 */
export function formatMessageTime(dateString: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const now = new Date();

    // Verificar se é hoje
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }

    // Verificar se é ontem
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    }

    // Caso contrário, mostrar DD/MM
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

/**
 * Tenta analisar uma string JSON de payload de mídia
 */
export function parseMediaMessage(body: string): MediaPayload | null {
  if (!body) return null;
  if (body.startsWith('{"type":') && body.endsWith("}")) {
    try {
      const parsed = JSON.parse(body);
      if (
        parsed &&
        (parsed.type === "image" || parsed.type === "document" || parsed.type === "audio") &&
        parsed.url
      ) {
        return parsed as MediaPayload;
      }
    } catch {
      // Ignore
    }
  }
  return null;
}

/**
 * Formata número de telefone brasileiro para exibição.
 * Ex.: "5511988887766" → "+55 (11) 98888-7766"
 */
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return phone;

  let national = digits;
  if (digits.startsWith("55") && digits.length >= 12) {
    national = digits.slice(2);
  }

  if (national.length === 11) {
    const ddd = national.slice(0, 2);
    const part1 = national.slice(2, 7);
    const part2 = national.slice(7);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }

  if (national.length === 10) {
    const ddd = national.slice(0, 2);
    const part1 = national.slice(2, 6);
    const part2 = national.slice(6);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }

  return phone;
}
