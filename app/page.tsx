"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import { UploadForm } from "@/components/upload-form";
import { ResultSection } from "@/components/result-section";

type ErrorType = "rate_limit" | "error" | "validation" | "";

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<ErrorType>("");

  const handleReset = () => {
    setResult(null);
    setError("");
    setErrorType("");
  };

  const handleError = (msg: string, type: ErrorType = "error") => {
    setError(msg);
    setErrorType(type);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            자소서 PDF 분석기
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            PDF 파일을 업로드하면 AI가 자기소개서를 분석하고
            면접에서 활용할 수 있는 질문을 생성해 드립니다.
          </p>
        </header>

        {error && (
          <div
            className={`max-w-md mx-auto mb-6 p-4 rounded-lg text-center ${
              errorType === "rate_limit"
                ? "bg-amber-50 border border-amber-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <p className={errorType === "rate_limit" ? "text-amber-700" : "text-red-700"}>
              {error}
            </p>
          </div>
        )}

        {result ? (
          <ResultSection result={result} onReset={handleReset} />
        ) : (
          <div className="flex flex-col items-center">
            <UploadForm
              onAnalysisComplete={setResult}
              onError={handleError}
            />
          </div>
        )}

        <footer className="mt-16 text-center text-sm text-gray-500">
          <p>모든 분석은 Google Gemini API를 통해 처리됩니다.</p>
        </footer>
      </div>
    </div>
  );
}
