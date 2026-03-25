"use client";

import type { Question } from "@/lib/types";

interface QuestionCardProps {
  question: Question;
  index: number;
}

export function QuestionCard({ question, index }: QuestionCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-5 border border-gray-100">
      <div className="flex items-start gap-3 mb-4">
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
          {index}
        </span>
        <p className="text-gray-800 font-medium text-lg leading-relaxed">
          {question.question}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
            의도
          </h4>
          <p className="text-gray-700">{question.intent}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-1">
            좋은 답변 방향
          </h4>
          <p className="text-gray-700">{question.goodAnswer}</p>
        </div>

        {question.followUp.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-2">
              꼬리 질문
            </h4>
            <ul className="space-y-1">
              {question.followUp.map((follow, i) => (
                <li key={i} className="text-gray-600 text-sm flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">→</span>
                  <span>{follow}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
