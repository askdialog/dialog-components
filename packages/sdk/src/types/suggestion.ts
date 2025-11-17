export interface Suggestion {
  questions: {
    question: string;
    answer?: string;
  }[];
  assistantName?: string;
  description?: string;
  inputPlaceholder?: string;
}
