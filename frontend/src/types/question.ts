export type Question = {
  id: string;
  type: "MULTIPLE CHOICE" | "OPEN ENDED";
  question_text: string;
  options: Record<string, string> | null;
  correct_answer: string | null;
  explanation: string;
  version: string;
  subject: string;
  topic: string;
};

export type QuestionType = "mcq" | "open";
export type SourceType = "similarity" | "document";

export enum QuestionTypeMapping {
  mcq = "MULTIPLE CHOICE",
  open = "OPEN ENDED",
}

export enum SourceTypeMapping {
  document = "PDF WORKSPACE",
  similarity = "SIMILAR QUESTIONS",
}
export type QuestionContent = {
  question_type: QuestionType;
  question_text: string;
  options: Record<string, string> | null;
  correct_answer: string;
  explanation: string;
  tags?: Record<string, unknown> | null;
  confidence_score?: number | null;
};

export type RefinementResponse = {
  question_id: string;
  version: number;
  question: QuestionContent;
};

export type RecentQuestion = {
  session_id: string;
  question_type: QuestionType;
  source_type: SourceType;
  quantity: number;
  created_at: string;
};
