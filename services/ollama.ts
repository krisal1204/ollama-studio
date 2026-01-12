import { OllamaModel, ChatMessage } from '../types';

export class OllamaService {
  private static normalizeUrl(url: string): string {
    let normalized = url.trim();
    // If no protocol is provided, assume http
    if (!normalized.match(/^https?:\/\//)) {
      normalized = `http://${normalized}`;
    }
    return normalized.replace(/\/$/, '');
  }

  static async getModels(baseUrl: string): Promise<OllamaModel[]> {
    const url = `${this.normalizeUrl(baseUrl)}/api/tags`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  static async chatStream(
    baseUrl: string,
    model: string,
    messages: ChatMessage[],
    options: { temperature: number; top_k: number; top_p: number },
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const url = `${this.normalizeUrl(baseUrl)}/api/chat`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        options: {
          temperature: options.temperature,
          top_k: options.top_k,
          top_p: options.top_p,
        },
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error('Failed to initiate chat stream');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          if (json.message && json.message.content) {
            onChunk(json.message.content);
          }
          if (json.done) {
            return;
          }
        } catch (e) {
          console.warn('Error parsing JSON chunk', e);
        }
      }
    }
  }
}