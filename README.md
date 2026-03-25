# 자소서 PDF 분석기

자기소개서 PDF를 분석하여 면접 질문을 생성하는 MVP 웹 앱입니다.

## 주요 기능

- PDF 파일 업로드
- Google Gemini API를 통한 자소서 분석 (무료 티어 지원)
- 면접 예상 질문 생성 (5개 카테고리, 각 15개 질문)
- 한국어 UI

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Google Gemini SDK (PDF 직접 처리)

## Setup

### 1. API 키 발급

[Google AI Studio](https://aistudio.google.com/)에서 Gemini API 키를 발급받으세요.

무료 티어: 월 1,500회 요청, 분당 15회

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열고 환경 변수를 설정합니다:

```
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-2.5-flash
```

### 4. 로컬 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 앱을 확인할 수 있습니다.

## Vercel 배포

### 1. GitHub에 푸시

프로젝트를 GitHub 레포지토리에 푸시합니다.

### 2. Vercel에서 Import

[Vercel Dashboard](https://vercel.com/dashboard)에서 프로젝트를 Import합니다.

### 3. 환경 변수 설정

Vercel 프로젝트 Settings → Environment Variables에서 다음을 설정합니다:

- `GEMINI_API_KEY`: Gemini API 키
- `GEMINI_MODEL`: (선택) Gemini 모델 이름

### 4. Deploy

Deploy 버튼을 클릭하면 자동으로 배포됩니다.

## 프롬프트 수정

분석 프롬프트를 수정하려면 `lib/prompts.ts` 파일을 편집합니다.

### 프롬프트 구조

- `BASE_PROMPT`: 분석 지시사항 (변경 비권장)
- `JSON_INSTRUCTION`: 출력 형식 지시사항
- `getAnalysisPrompt()`: 결합된 전체 프롬프트

## 프로젝트 구조

```
├── app/
│   ├── api/analyze/route.ts  # PDF 분석 API 엔드포인트
│   ├── page.tsx              # 메인 페이지
│   └── globals.css           # 글로벌 스타일
├── components/
│   ├── upload-form.tsx       # PDF 업로드 폼
│   ├── result-section.tsx    # 분석 결과 표시
│   └── question-card.tsx     # 질문 카드
├── lib/
│   ├── types.ts              # TypeScript 인터페이스
│   ├── prompts.ts            # 프롬프트 정의
│   └── gemini.ts             # Gemini API 래퍼
├── .env.example              # 환경 변수 예시
└── README.md
```

## API 엔드포인트

### POST /api/analyze

PDF 파일을 분석합니다.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` - PDF 파일 (최대 10MB)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": { "text": "..." },
    "traits": ["...", "..."],
    "concerns": ["...", "..."],
    "categories": [
      {
        "category": "지원 동기",
        "questions": [
          {
            "question": "...",
            "intent": "...",
            "goodAnswer": "...",
            "followUp": ["...", "..."]
          }
        ]
      }
    ]
  }
}
```

## 라이선스

MIT
