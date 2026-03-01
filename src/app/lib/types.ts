export type TaskToken = {
  pl: string;
  en: string;
  phon?: string;
};

export type Task = {
  id: string;
  pl: string;
  tokens: TaskToken[];
  answerEn: string;
  answerPhon?: string;
  category?: string;
  level?: number;
  createdAt?: number;
};

export type Vocab = {
  id: string;
  pl: string;
  en: string;
  phon?: string;
  category?: string;
  tags?: string[];
  createdAt?: number;
}; 