export interface Question {
  question: string;
  intent: string;
  goodAnswer: string;
  followUp: string[];
}

export interface Category {
  category: string;
  questions: Question[];
}

export interface AnalysisResult {
  summary: {
    text: string;
  };
  traits: string[];
  concerns: string[];
  categories: Category[];
}

export interface AnalysisError {
  ok: false;
  type: "error" | "rate_limit" | "validation";
  error: string;
  retryAfterSeconds?: number;
}
