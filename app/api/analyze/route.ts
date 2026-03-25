import { NextRequest, NextResponse } from "next/server";
import { analyzeResume } from "@/lib/gemini";

const ALLOWED_TYPES = ["application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { ok: false, type: "validation" as const, error: "파일이 업로드되지 않았습니다." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { ok: false, type: "validation" as const, error: "PDF 파일만 업로드 가능합니다." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, type: "validation" as const, error: "파일이 너무 큽니다. 10MB 이하의 PDF만 업로드 가능합니다." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await analyzeResume(buffer, file.name);

    if (!result.ok) {
      const status = result.type === "rate_limit" ? 429 : 500;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { ok: false, type: "error" as const, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
