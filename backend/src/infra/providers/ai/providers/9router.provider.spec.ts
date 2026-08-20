import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { NineRouterAiProvider } from './9router.provider';
import type { Environment } from '../../../config/environment';

describe('NineRouterAiProvider', () => {
  let provider: NineRouterAiProvider;
  let postMock: jest.Mock;
  let getMock: jest.Mock;

  beforeEach(() => {
    postMock = jest.fn();
    getMock = jest.fn();

    const http = {
      post: postMock,
      get: getMock,
    } as unknown as HttpService;

    const config = {
      get: jest.fn((key: string) => {
        if (key === 'aiBaseUrl') return 'http://localhost:20128/';
        if (key === 'aiApiKey') return 'sk-test-key';
        if (key === 'aiDefaultModel') return 'openai/gpt-4o';
        return undefined;
      }),
    } as unknown as ConfigService<Environment, true>;

    provider = new NineRouterAiProvider(http, config);
  });

  it('initializes with normalized base URL and key', () => {
    expect(provider.name).toBe('9router');
  });

  it('performs chat completion sending OpenAI format', async () => {
    const mockResponse: AxiosResponse = {
      data: {
        model: 'openai/gpt-4o',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Olá, mundo!' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as unknown as AxiosResponse['config'],
    };

    postMock.mockReturnValue(of(mockResponse));

    const result = await provider.chatCompletion({
      messages: [{ role: 'user', content: 'Olá' }],
      temperature: 0.7,
      maxTokens: 500,
    });

    expect(result).toEqual({
      text: 'Olá, mundo!',
      model: 'openai/gpt-4o',
      finishReason: 'stop',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      raw: mockResponse.data,
    });

    expect(postMock).toHaveBeenCalledWith(
      'http://localhost:20128/v1/chat/completions',
      {
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: 'Olá' }],
        temperature: 0.7,
        max_tokens: 500,
        stream: false,
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test-key',
        }),
      }),
    );
  });

  it('discovers available models', async () => {
    const mockResponse: AxiosResponse = {
      data: {
        data: [
          { id: 'openai/gpt-4o', context_window: 128000, owned_by: 'openai' },
          { id: 'anthropic/claude-3-5-sonnet', context_window: 200000 },
        ],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as unknown as AxiosResponse['config'],
    };

    getMock.mockReturnValue(of(mockResponse));

    const models = await provider.getAvailableModels('chat');
    expect(models).toHaveLength(2);
    expect(models[0]).toMatchObject({
      id: 'openai/gpt-4o',
      category: 'chat',
      contextWindow: 128000,
    });
    expect(getMock).toHaveBeenCalledWith(
      'http://localhost:20128/v1/models/chat',
      expect.any(Object),
    );
  });

  it('checks health status returning true on 200 ok', async () => {
    getMock.mockReturnValue(
      of({
        status: 200,
        data: { ok: true },
      } as AxiosResponse),
    );

    const isHealthy = await provider.checkHealth();
    expect(isHealthy).toBe(true);
    expect(getMock).toHaveBeenCalledWith(
      'http://localhost:20128/api/health',
      expect.any(Object),
    );
  });

  it('handles health check errors gracefully returning false', async () => {
    getMock.mockReturnValue(throwError(() => new Error('Connection refused')));
    const isHealthy = await provider.checkHealth();
    expect(isHealthy).toBe(false);
  });
});
