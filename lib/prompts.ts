export const BASE_PROMPT = `아래 지원자 자기소개서를 분석하여 면접 질문을 생성하라.

5가지 기준:
1. 지원 동기 (회사 및 직무 이해도)
2. 인성 / 태도
3. 경험 (STAR 기반)
4. 문제 해결 및 성장 가능성
5. 조직 적합도 (협업, 갈등 해결)

[STEP 1] 분석
- 5줄 이내 요약
- 지원자 특징(강점, 성향, 패턴)
- 의심되는 부분 / 확인 필요 부분

[STEP 2] 면접 질문
카테고리당 3개 질문 (총 15개).
각 질문: 질문, 의도, 좋은 답변 방향, 꼬리 질문(1~2개).

요구사항:
- 구체적, 현실적 질문
- 내용 기반
- 최소 1~2개 압박성 질문
- 중복 금지`;

export const JSON_INSTRUCTION = `
응답은 JSON만 반환. 다른 텍스트/설명/마크다운 금지.

{
  "summary": {"text": "string"},
  "traits": ["string"],
  "concerns": ["string"],
  "categories": [
    {"category": "지원 동기", "questions": [{"question": "string", "intent": "string", "goodAnswer": "string", "followUp": ["string"]}]},
    {"category": "인성 / 태도", "questions": []},
    {"category": "경험", "questions": []},
    {"category": "문제 해결 / 성장", "questions": []},
    {"category": "조직 적합도", "questions": []}
  ]
}

규칙: 5 카테고리, 카테고리당 3 질문, 총 15개`;

export function getAnalysisPrompt(): string {
  return `${BASE_PROMPT}${JSON_INSTRUCTION}`;
}
