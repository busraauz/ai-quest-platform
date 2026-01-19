export type QuestionType = "mcq" | "open";

export type GeneratedQuestion = {
  id: string;
  user_id: string;
  session_id: string;
  document_id?: string | null;
  source_type: "pdf" | "document" | "similarity";
  question_type: QuestionType;
  question_text: string;
  options?: Record<string, string> | null;
  correct_answer: string;
  explanation: string;
  tags?: Record<string, any> | null;
  confidence_score?: number | null;
  created_at: string;
};

export type DocumentGenerateResponse = {
  session_id: string;
  document_id: string;
  questions: GeneratedQuestion[];
};

export type SimilarGenerateResponse = {
  session_id: string;
  questions: GeneratedQuestion[];
};
