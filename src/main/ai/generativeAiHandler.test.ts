import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupGenerativeAiHandlers } from './generativeAiHandler';

const { handleMock, storeGetMock, generateTextMock, createOpenAIMock } = vi.hoisted(() => ({
  handleMock: vi.fn(),
  storeGetMock: vi.fn(),
  generateTextMock: vi.fn(),
  createOpenAIMock: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: {
    handle: handleMock,
  },
}));

vi.mock('electron-store', () => ({
  default: vi.fn().mockImplementation(() => ({
    get: storeGetMock,
  })),
}));

vi.mock('ai', () => ({
  generateText: generateTextMock,
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: createOpenAIMock,
}));

describe('setupGenerativeAiHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('OpenAIのレスポンスを返す', async () => {
    storeGetMock.mockReturnValue({ apiKeys: { openai: 'test-key' } });
    const mockModel = vi.fn();
    createOpenAIMock.mockReturnValue(mockModel);
    generateTextMock.mockResolvedValue({ text: '回答' });

    setupGenerativeAiHandlers();
    expect(handleMock).toHaveBeenCalledWith('ai:get-inline-response', expect.any(Function));

    const handler = handleMock.mock.calls[0][1] as any;
    const result = await handler({}, '質問');

    expect(createOpenAIMock).toHaveBeenCalledWith({
      apiKey: 'test-key',
    });
    expect(generateTextMock).toHaveBeenCalledWith({
      model: mockModel('gpt-4o'),
      system: expect.stringContaining('日本語で返答'),
      prompt: '質問',
    });
    expect(result).toBe('回答');
  });

  it('APIキーがない場合はエラーを投げる', async () => {
    storeGetMock.mockReturnValue(undefined);

    setupGenerativeAiHandlers();
    const handler = handleMock.mock.calls[0][1] as any;

    await expect(handler({}, '質問')).rejects.toThrow('OpenAI API key is not set');
  });
});
