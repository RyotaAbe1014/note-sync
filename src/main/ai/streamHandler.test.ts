import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupStreamHandlers } from './streamHandler';

const { onMock, storeGetMock, streamTextMock, createOpenAIMock } = vi.hoisted(() => ({
  onMock: vi.fn(),
  storeGetMock: vi.fn(),
  streamTextMock: vi.fn(),
  createOpenAIMock: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: {
    on: onMock,
  },
}));

vi.mock('electron-store', () => ({
  default: vi.fn().mockImplementation(() => ({
    get: storeGetMock,
  })),
}));

vi.mock('ai', () => ({
  streamText: streamTextMock,
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: createOpenAIMock,
}));

describe('setupStreamHandlers', () => {
  const mockEvent = {
    sender: {
      id: 1,
      send: vi.fn(),
      getURL: vi.fn().mockReturnValue('file:///mock/path'),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ストリーミングハンドラーを登録する', () => {
    setupStreamHandlers();

    expect(onMock).toHaveBeenCalledWith('ai:stream:start', expect.any(Function));
    expect(onMock).toHaveBeenCalledWith('ai:stream:cancel', expect.any(Function));
  });

  it('ストリーミングを正常に開始する', async () => {
    storeGetMock.mockReturnValue({ apiKeys: { openai: 'test-key' } });
    const mockModel = vi.fn();
    createOpenAIMock.mockReturnValue(mockModel);

    const mockTextStream = ['Hello', ' ', 'World'];
    streamTextMock.mockReturnValue({
      textStream: (async function* () {
        for (const chunk of mockTextStream) {
          yield chunk;
        }
      })(),
    });

    setupStreamHandlers();
    const handler = onMock.mock.calls[0][1];

    await handler(mockEvent, 'test prompt');

    expect(createOpenAIMock).toHaveBeenCalledWith({
      apiKey: 'test-key',
    });
    expect(streamTextMock).toHaveBeenCalledWith({
      model: mockModel('gpt-4o'),
      system: expect.stringContaining('日本語で返答'),
      prompt: 'test prompt',
      abortSignal: expect.any(AbortSignal),
    });

    expect(mockEvent.sender.send).toHaveBeenCalledWith('ai:stream:chunk', 'Hello');
    expect(mockEvent.sender.send).toHaveBeenCalledWith('ai:stream:chunk', ' ');
    expect(mockEvent.sender.send).toHaveBeenCalledWith('ai:stream:chunk', 'World');
    expect(mockEvent.sender.send).toHaveBeenCalledWith('ai:stream:end');
  });

  it('APIキーがない場合はエラーを送信する', async () => {
    storeGetMock.mockReturnValue(undefined);

    setupStreamHandlers();
    const handler = onMock.mock.calls[0][1];

    await handler(mockEvent, 'test prompt');

    expect(mockEvent.sender.send).toHaveBeenCalledWith(
      'ai:stream:error',
      'OpenAI API key is not set'
    );
  });

  it('ストリーミングをキャンセルできる', () => {
    setupStreamHandlers();
    const cancelHandler = onMock.mock.calls[1][1];

    cancelHandler(mockEvent);

    expect(mockEvent.sender.send).toHaveBeenCalledWith('ai:stream:end');
  });
});
