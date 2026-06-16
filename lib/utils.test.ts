import { describe, it, expect } from "vitest";
import { formatMessageTime, parseMediaMessage, formatPhoneNumber } from "./utils";

describe("formatMessageTime", () => {
  it("should return an empty string for invalid or empty input", () => {
    expect(formatMessageTime("")).toBe("");
    expect(formatMessageTime(undefined as any)).toBe("");
  });

  it("should format today's date as HH:MM", () => {
    const today = new Date();
    today.setHours(14, 30, 0, 0);
    const result = formatMessageTime(today.toISOString());
    expect(result).toMatch(/^\d{2}:\d{2}$/);
    expect(result).toBe("14:30");
  });

  it("should format yesterday's date as 'Ontem'", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = formatMessageTime(yesterday.toISOString());
    expect(result).toBe("Ontem");
  });

  it("should format older dates as DD/MM", () => {
    // Fixed date in the past
    const pastDate = new Date("2026-05-15T12:00:00.000Z");
    const result = formatMessageTime(pastDate.toISOString());
    expect(result).toBe("15/05");
  });
});

describe("parseMediaMessage", () => {
  it("should return null for empty body or non-JSON input", () => {
    expect(parseMediaMessage("")).toBeNull();
    expect(parseMediaMessage("Olá, tudo bem?")).toBeNull();
  });

  it("should return null for JSON that is not a media payload", () => {
    expect(parseMediaMessage('{"message":"hello"}')).toBeNull();
    expect(parseMediaMessage('{"type":"text","body":"hello"}')).toBeNull();
  });

  it("should successfully parse valid image media payload", () => {
    const payload = {
      type: "image",
      name: "screenshot.png",
      size: "45KB",
      url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    };
    const bodyString = JSON.stringify(payload);
    const result = parseMediaMessage(bodyString);
    expect(result).not.toBeNull();
    expect(result?.type).toBe("image");
    expect(result?.name).toBe("screenshot.png");
    expect(result?.size).toBe("45KB");
    expect(result?.url).toBe(payload.url);
  });

  it("should successfully parse valid document media payload", () => {
    const payload = {
      type: "document",
      name: "fatura.pdf",
      size: "1.2MB",
      url: "data:application/pdf;base64,JVBERi0xLjQKJ...",
    };
    const bodyString = JSON.stringify(payload);
    const result = parseMediaMessage(bodyString);
    expect(result).not.toBeNull();
    expect(result?.type).toBe("document");
    expect(result?.name).toBe("fatura.pdf");
    expect(result?.size).toBe("1.2MB");
  });
});

describe("formatPhoneNumber", () => {
  it("should format mobile numbers with country code", () => {
    expect(formatPhoneNumber("5511988887766")).toBe("+55 (11) 98888-7766");
  });

  it("should format landline numbers with country code", () => {
    expect(formatPhoneNumber("551133334444")).toBe("+55 (11) 3333-4444");
  });

  it("should format numbers without country code", () => {
    expect(formatPhoneNumber("11988887766")).toBe("+55 (11) 98888-7766");
  });

  it("should return original value for unrecognized formats", () => {
    expect(formatPhoneNumber("123")).toBe("123");
    expect(formatPhoneNumber("")).toBe("");
  });
});
