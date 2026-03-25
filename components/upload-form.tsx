"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { AnalysisResult, AnalysisError } from "@/lib/types";

interface UploadFormProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
  onError: (error: string, type?: "rate_limit" | "error" | "validation", retryAfter?: number) => void;
}

export function UploadForm({ onAnalysisComplete, onError }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleFile = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      onError("PDF 파일만 업로드 가능합니다.", "validation");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      onError("파일이 너무 큽니다. 10MB 이하의 PDF만 업로드 가능합니다.", "validation");
      return;
    }
    setFile(selectedFile);
    onError("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || isLoading) return;

    if (countdownRef.current) {
      onError("잠시 후 다시 시도해주세요.", "rate_limit", retryCountdown || undefined);
      return;
    }

    setIsLoading(true);
    onError("");

    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        if (data.type === "rate_limit" && data.retryAfterSeconds) {
          setRetryCountdown(data.retryAfterSeconds);
          onError(data.error, "rate_limit", data.retryAfterSeconds);

          countdownRef.current = setInterval(() => {
            setRetryCountdown((prev) => {
              if (prev === null || prev <= 1) {
                if (countdownRef.current) {
                  clearInterval(countdownRef.current);
                  countdownRef.current = null;
                }
                setIsLoading(false);
                onError("다시 분석할 수 있습니다.", "error");
                return null;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          onError(data.error || "분석 중 오류가 발생했습니다.", data.type || "error");
        }
        setIsLoading(false);
        return;
      }

      onAnalysisComplete(data.data);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      onError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [file, isLoading, retryCountdown, onError, onAnalysisComplete]);

  const removeFile = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setRetryCountdown(null);
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const isDisabled = !file || isLoading || retryCountdown !== null;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : isDisabled
            ? "border-gray-200 bg-gray-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isDisabled}
        />

        {file ? (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-gray-800 font-medium truncate max-w-full px-4">
              {file.name}
            </p>
            <p className="text-gray-500 text-sm">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              className="text-sm text-red-500 hover:text-red-600"
              disabled={isLoading}
            >
              파일 제거
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-gray-700 font-medium">
                PDF 파일을 드래그하거나 클릭하여 업로드
              </p>
              <p className="text-gray-500 text-sm mt-1">
                최대 10MB까지 지원
              </p>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isDisabled}
        className={`w-full mt-6 py-3 px-6 rounded-xl font-semibold text-white transition-colors ${
          isDisabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
        }`}
      >
        {retryCountdown !== null ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {retryCountdown}초 후 재시도 가능
          </span>
        ) : isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            분석 중...
          </span>
        ) : (
          "분석 시작"
        )}
      </button>
    </form>
  );
}
