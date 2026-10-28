interface InputMessages {
  placeholder: string;
  aiDisclosure: string;
  askSomethingElse: string;
}

const MESSAGES: Record<string, InputMessages> = {
  en: {
    placeholder: "Ask the AI a question",
    aiDisclosure:
      "You're chatting with an AI assistant. It can make mistakes, so please double-check important information",
    askSomethingElse: "Ask something else",
  },
  fr: {
    placeholder: "Posez une question à l'IA",
    aiDisclosure:
      "Vous discutez avec un assistant IA. Il peut se tromper, pensez à vérifier les informations importantes",
    askSomethingElse: "Posez une autre question",
  },
  es: {
    placeholder: "Haz una pregunta a la IA",
    aiDisclosure:
      "Estás chateando con un asistente de IA. Puede cometer errores, así que verifica la información importante",
    askSomethingElse: "Pregunta otra cosa",
  },
};

export const getInputMessages = (locale: string | undefined): InputMessages => {
  const language = locale?.split("-")[0]?.toLowerCase() ?? "en";

  return MESSAGES[language] ?? MESSAGES.en;
};
