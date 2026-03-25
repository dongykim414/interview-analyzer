import { GoogleGenAI } from "@google/genai";
import { getAnalysisPrompt } from "./prompts";
import type { AnalysisResult, AnalysisError } from "./types";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview";

function getGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
}

export interface AnalyzeResult {
  ok: true;
  data: AnalysisResult;
}

export type AnalyzeResponse = AnalyzeResult | AnalysisError;

function createRateLimitError(retryAfterSeconds: number, message?: string): AnalysisError {
  return {
    ok: false,
    type: "rate_limit",
    error: message || "API 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.",
    retryAfterSeconds,
  };
}

function createError(type: AnalysisError["type"], message: string): AnalysisError {
  return { ok: false, type, error: message };
}

function parseRetryDelay(error: unknown): number | null {
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>;
    if (typeof e.retryAfter === "number") return e.retryAfter;
    if (typeof e.retryDelay === "number") return e.retryDelay;
    if (e.error && typeof e.error === "object") {
      const inner = e.error as Record<string, unknown>;
      if (typeof inner.retryAfter === "number") return inner.retryAfter;
    }
  }
  return null;
}

function isQuotaLimitError(error: unknown): { isQuota: boolean; limitInfo?: string } {
  if (!error || typeof error !== "object") return { isQuota: false };

  const errorObj = error as Record<string, unknown>;
  const errorStr = JSON.stringify(error).toLowerCase();

  if (errorStr.includes("429") || 
      errorStr.includes("quota") || 
      errorStr.includes("resource_exhausted") ||
      errorStr.includes("limit: 0") ||
      errorStr.includes("\"limit\":0") ||
      errorStr.includes("rate limit") ||
      errorStr.includes("daily limit")) {
    
    let limitInfo: string | undefined;
    
    if (errorStr.includes("limit: 0") || errorStr.includes("\"limit\":0")) {
      limitInfo = `선택한 모델(${GEMINI_MODEL})의 무료 할당량이 소진되었습니다.`;
    }
    
    return { isQuota: true, limitInfo };
  }

  return { isQuota: false };
}

export async function analyzeResume(pdfBuffer: Buffer, fileName: string): Promise<AnalyzeResponse> {
  if (!process.env.GEMINI_API_KEY) {
    return createError("validation", "GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  if (pdfBuffer.length > 10 * 1024 * 1024) {
    return createError("validation", "파일이 너무 큽니다. 10MB 이하의 PDF만 업로드 가능합니다.");
  }

  console.log(`[Analyze] File: ${fileName}, Size: ${Math.round(pdfBuffer.length / 1024)}KB, Model: ${GEMINI_MODEL}`);

  try {
    const ai = getGeminiClient();
    const prompt = getAnalysisPrompt();

    console.log(`[Analyze] Calling Gemini API with model: ${GEMINI_MODEL}...`);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: pdfBuffer.toString("base64"),
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    const responseText = response.text;

    if (!responseText) {
      return createError("error", "응답을 생성하지 못했습니다. 다시 시도해 주세요.");
    }

    const parsed = parseJsonResponse(responseText);

    if (!parsed) {
      return createError("error", "분석 결과를 파싱하지 못했습니다.");
    }

    const normalized = normalizeResult(parsed);

    if (!normalized) {
      return createError("error", "분석 결과의 형식이 올바르지 않습니다.");
    }

    console.log(`[Analyze] Success! Model: ${GEMINI_MODEL}`);

    return { ok: true, data: normalized };
  } catch (error) {
    console.error(`[Analyze] Error with model ${GEMINI_MODEL}:`, error);

    const quotaCheck = isQuotaLimitError(error);
    if (quotaCheck.isQuota) {
      const retryDelay = parseRetryDelay(error) || 60;
      const message = quotaCheck.limitInfo || "API 사용량이 초과되었습니다.";
      return createRateLimitError(retryDelay, message);
    }

    if (error instanceof Error) {
      const msg = error.message.toLowerCase();

      if (msg.includes("api key") || msg.includes("invalid") || msg.includes("key")) {
        return createError("validation", "Gemini API 키가 유효하지 않습니다.");
      }

      if (msg.includes("model") && (msg.includes("not found") || msg.includes("not support"))) {
        return createError("validation", `모델 '${GEMINI_MODEL}'을(를) 찾을 수 없습니다. 유효한 모델 이름을 사용해주세요.`);
      }

      if (msg.includes("pdf") || msg.includes("inline data") || msg.includes("invalid mime")) {
        return createError("validation", "PDF 파일을 처리할 수 없습니다. 유효한 PDF인지 확인해 주세요.");
      }

      if (msg.includes("pdf size") || msg.includes("too large")) {
        return createError("validation", "PDF 파일이 너무 큽니다. 더 작은 파일을 업로드해 주세요.");
      }
    }

    const retryDelay = parseRetryDelay(error);
    if (retryDelay) {
      return createRateLimitError(retryDelay);
    }

    return createError(
      "error",
      error instanceof Error ? `분석 중 오류: ${error.message}` : "알 수 없는 오류가 발생했습니다."
    );
  }
}

function parseJsonResponse(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {}

  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {}
  }

  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch {}
  }

  return null;
}

function normalizeResult(data: unknown): AnalysisResult | null {
  if (!data || typeof data !== "object") return null;

  const obj = data as Record<string, unknown>;

  if (!obj.summary || typeof obj.summary !== "object") return null;
  const summary = obj.summary as Record<string, unknown>;
  if (typeof summary.text !== "string") return null;

  if (!Array.isArray(obj.traits)) return null;
  if (!Array.isArray(obj.concerns)) return null;

  if (!Array.isArray(obj.categories) || obj.categories.length !== 5) return null;

  const validCategories = ["지원 동기", "인성 / 태도", "경험", "문제 해결 / 성장", "조직 적합도"];
  const categories = obj.categories.map((cat: unknown) => {
    if (!cat || typeof cat !== "object") return null;
    const c = cat as Record<string, unknown>;

    if (typeof c.category !== "string") return null;
    if (!validCategories.includes(c.category)) return null;
    if (!Array.isArray(c.questions) || c.questions.length !== 3) return null;

    const questions = c.questions.map((q: unknown) => {
      if (!q || typeof q !== "object") return null;
      const question = q as Record<string, unknown>;

      if (typeof question.question !== "string") return null;
      if (typeof question.intent !== "string") return null;
      if (typeof question.goodAnswer !== "string") return null;
      if (!Array.isArray(question.followUp)) return null;

      return {
        question: question.question,
        intent: question.intent,
        goodAnswer: question.goodAnswer,
        followUp: question.followUp.filter((f: unknown) => typeof f === "string"),
      };
    });

    if (questions.some((q: unknown) => q === null)) return null;

    return { category: c.category, questions };
  });

  if (categories.some((c: unknown) => c === null)) return null;

  return {
    summary: { text: summary.text },
    traits: obj.traits.filter((t: unknown) => typeof t === "string"),
    concerns: obj.concerns.filter((c: unknown) => typeof c === "string"),
    categories: categories as AnalysisResult["categories"],
  };
}
