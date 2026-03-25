"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import { QuestionCard } from "./question-card";

interface ResultSectionProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function ResultSection({ result, onReset }: ResultSectionProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const text = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">분석 결과</h2>
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            {copied ? "복사됨" : "복사"}
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            다시 분석하기
          </button>
        </div>
      </div>

      <section className="bg-blue-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-bold text-blue-900 mb-3">요약</h3>
        <p className="text-blue-800 leading-relaxed">{result.summary.text}</p>
      </section>

      <section className="bg-green-50 rounded-xl p-6 border border-green-100">
        <h3 className="text-lg font-bold text-green-900 mb-3">지원자 특징</h3>
        <ul className="space-y-2">
          {result.traits.map((trait, i) => (
            <li key={i} className="text-green-800 flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>{trait}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-amber-50 rounded-xl p-6 border border-amber-100">
        <h3 className="text-lg font-bold text-amber-900 mb-3">의문점</h3>
        <ul className="space-y-2">
          {result.concerns.map((concern, i) => (
            <li key={i} className="text-amber-800 flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">?</span>
              <span>{concern}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-bold text-gray-800 mb-6">예상 면접 질문</h3>
        <div className="space-y-8">
          {result.categories.map((category) => (
            <div key={category.category}>
              <h4 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                {category.category}
              </h4>
              <div className="grid gap-4">
                {category.questions.map((question, i) => (
                  <QuestionCard
                    key={`${category.category}-${i}`}
                    question={question}
                    index={i + 1}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-center pt-4">
        <button
          onClick={onReset}
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          다시 분석하기
        </button>
      </div>
    </div>
  );
}
