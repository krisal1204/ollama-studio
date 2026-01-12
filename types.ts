export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

export interface AppSettings {
  serverUrl: string;
  model: string;
  temperature: number;
  topK: number;
  topP: number;
  systemInstruction: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  serverUrl: 'http://localhost:11434',
  model: '',
  temperature: 0.7,
  topK: 40,
  topP: 0.9,
  systemInstruction: 'You are a helpful AI assistant.',
};