export interface Suggestion {
  questions: {
    /** The product question's id; null while the organization is on the legacy reader. */
    id?: string | null;
    question: string;
    answer?: string;
  }[];
  /** The id of this pick of questions, copied into their view and click events; null or absent when there is none. */
  recommendationId?: string | null;
  assistantName?: string;
  description?: string;
  inputPlaceholder?: string;
}
