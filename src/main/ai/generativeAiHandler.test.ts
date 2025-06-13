import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupGenerativeAiHandlers } from './generativeAiHandler';

let handleMock: ReturnType<typeof vi.fn>;
let storeGetMock: ReturnType<typeof vi.fn>;
let openAiCreateMock: ReturnType<typeof vi.fn>;

vi.mock('electron', () => {
  handleMock = vi.fn();
  return {
    ipcMain: {
      handle: handleMock,
    },
  };
});

vi.mock('electron-store', () => {
  storeGetMock = vi.fn();
  return {
    default: vi.fn().mockImplementation(() => ({
      get: storeGetMock,
    })),
  };
});

vi.mock('openai', () => {
  openAiCreateMock = vi.fn();
  return {
    default: vi.fn().mockImplementation(() => ({
      responses: {
        create: openAiCreateMock,
      },
    })),
  };
});

describe('setupGenerativeAiHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('OpenAIのレスポンスを返す', async () => {
    storeGetMock.mockReturnValue({ apiKeys: { openai: 'test-key' } });
    openAiCreateMock.mockResolvedValue({ output_text: '回答' });

    setupGenerativeAiHandlers();
    expect(handleMock).toHaveBeenCalledWith('ai:get-inline-response', expect.any(Function));

    const handler = handleMock.mock.calls[0][1] as any;
    const result = await handler({}, '質問');

    expect(openAiCreateMock).toHaveBeenCalledWith({
      model: 'gpt-4o',
      instructions: expect.stringContaining('日本語で返答'),
      input: '質問',
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
