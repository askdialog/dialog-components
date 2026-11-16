export interface Suggestion {
  questions: {
    /** The product question's id; null while the organization is on the legacy reader. */
    id?: string | null;
    question: string;
    answer?: string;
  }[];
  assistantName?: string;
  description?: string;
  inputPlaceholder?: string;
}
