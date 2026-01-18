import type {
  Settings,
  PageContent,
  SummaryResponse,
  ComparisonResponse,
  ChatMessage,
  ApiResponse,
  StreamChunk,
} from './types';

export class ApiClient {
  private backendUrl: string;
  private localLLMUrl: string;

  constructor(settings: Settings) {
    this.backendUrl = settings.backendUrl;
    this.localLLMUrl = settings.localLLMUrl;
  }

  // Summarize using local LLM (LM Studio)
  async summarizeLocal(content: PageContent): Promise<SummaryResponse> {
    const prompt = this.buildSummaryPrompt(content);

    const response = await fetch(`${this.localLLMUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'local-model',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes web pages. Provide concise, informative summaries.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Local LLM request failed: ${response.status}`);
    }

    const data = await response.json();
    return this.parseSummaryResponse(data.choices[0].message.content);
  }

  // Summarize using remote backend
  async summarizeRemote(content: PageContent): Promise<SummaryResponse> {
    const response = await fetch(`${this.backendUrl}/api/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status}`);
    }

    const data: ApiResponse<SummaryResponse> = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Summarization failed');
    }

    return data.data;
  }

  // Compare product with alternatives
  async compareProduct(url: string, content: PageContent): Promise<ComparisonResponse> {
    const response = await fetch(`${this.backendUrl}/api/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, content }),
    });

    if (!response.ok) {
      throw new Error(`Comparison request failed: ${response.status}`);
    }

    const data: ApiResponse<ComparisonResponse> = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Comparison failed');
    }

    return data.data;
  }

  // Chat with local LLM
  async chatLocal(messages: ChatMessage[], context: PageContent): Promise<ChatMessage> {
    const systemPrompt = this.buildChatSystemPrompt(context);

    const response = await fetch(`${this.localLLMUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'local-model',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Local chat request failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: data.choices[0].message.content,
      timestamp: new Date().toISOString(),
    };
  }

  // Chat with remote backend
  async chatRemote(messages: ChatMessage[], context: PageContent): Promise<ChatMessage> {
    const response = await fetch(`${this.backendUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, context }),
    });

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.status}`);
    }

    const data: ApiResponse<{ message: ChatMessage }> = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Chat failed');
    }

    return data.data.message;
  }

  // Stream chat response (for local LLM)
  async *streamChatLocal(
    messages: ChatMessage[],
    context: PageContent
  ): AsyncGenerator<StreamChunk> {
    const systemPrompt = this.buildChatSystemPrompt(context);

    const response = await fetch(`${this.localLLMUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'local-model',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Streaming request failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            yield { content: '', done: true };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              yield { content, done: false };
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  // Health check for local LLM
  async checkLocalLLMHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.localLLMUrl}/v1/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Health check for backend
  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Build summary prompt
  private buildSummaryPrompt(content: PageContent): string {
    let prompt = `Please summarize the following web page:\n\n`;
    prompt += `Title: ${content.title}\n`;
    prompt += `URL: ${content.url}\n`;
    prompt += `Page Type: ${content.pageType}\n\n`;
    prompt += `Content:\n${content.text.substring(0, 8000)}\n\n`;

    if (content.product) {
      prompt += `Product Info:\n`;
      prompt += `- Name: ${content.product.name}\n`;
      prompt += `- Price: ${content.product.currency} ${content.product.price}\n`;
      prompt += `- Rating: ${content.product.rating}/5 (${content.product.reviewCount} reviews)\n`;
    }

    prompt += `\nProvide a concise summary with key points. Format your response as JSON:
{
  "summary": "A 2-3 sentence summary",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "sentiment": "positive|negative|neutral",
  "topics": ["topic1", "topic2"]
}`;

    return prompt;
  }

  // Build chat system prompt
  private buildChatSystemPrompt(context: PageContent): string {
    let prompt = `You are a helpful assistant that helps users understand and interact with web pages. `;
    prompt += `You have access to the following page content:\n\n`;
    prompt += `Title: ${context.title}\n`;
    prompt += `URL: ${context.url}\n`;
    prompt += `Page Type: ${context.pageType}\n\n`;
    prompt += `Content:\n${context.text.substring(0, 6000)}\n\n`;

    if (context.product) {
      prompt += `This is a product page for: ${context.product.name}\n`;
      prompt += `Price: ${context.product.currency} ${context.product.price}\n`;
      prompt += `Rating: ${context.product.rating}/5\n\n`;
    }

    prompt += `Answer questions about this page helpfully and accurately. `;
    prompt += `If asked about something not on the page, say so clearly.`;

    return prompt;
  }

  // Parse summary response from LLM
  private parseSummaryResponse(content: string): SummaryResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If JSON parsing fails, create a structured response
    }

    return {
      summary: content,
      keyPoints: [],
    };
  }
}
