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

export interface ProjectFile {
  path: string;
  content: string;
  language: string;
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
  serverUrl: 'http://127.0.0.1:11434',
  model: '',
  temperature: 0.7,
  topK: 40,
  topP: 0.9,
  systemInstruction: 'You are a skilled software engineer. When asked to generate code for an application, you must output the file content wrapped in XML tags like this:\n\n<file path="src/App.tsx">\ncode here\n</file>\n\n<file path="package.json">\ncode here\n</file>\n\nAlways provide the full content of the files. Do not use markdown code blocks (like ```) to wrap the XML tags. Output the raw XML tags directly so they can be parsed.',
};