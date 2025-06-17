import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupDialogHandlers } from './dialogHandlers';

const { handleMock, showOpenDialogMock } = vi.hoisted(() => ({
  handleMock: vi.fn(),
  showOpenDialogMock: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: {
    handle: handleMock,
  },
  dialog: {
    showOpenDialog: showOpenDialogMock,
  },
}));

describe('setupDialogHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ディレクトリ選択が成功した場合パスを返す', async () => {
    showOpenDialogMock.mockResolvedValue({ canceled: false, filePaths: ['/path'] });

    setupDialogHandlers();
    expect(handleMock).toHaveBeenCalledWith('dialog:select-directory', expect.any(Function));

    const handler = handleMock.mock.calls[0][1] as any;
    const mockEvent = {
      sender: {
        getURL: vi.fn().mockReturnValue('file:///mock/path'),
      },
    };
    const result = await handler(mockEvent);

    expect(showOpenDialogMock).toHaveBeenCalled();
    expect(result).toBe('/path');
  });

  it('キャンセルされた場合nullを返す', async () => {
    showOpenDialogMock.mockResolvedValue({ canceled: true, filePaths: [] });

    setupDialogHandlers();
    const handler = handleMock.mock.calls[0][1] as any;
    const mockEvent = {
      sender: {
        getURL: vi.fn().mockReturnValue('file:///mock/path'),
      },
    };
    const result = await handler(mockEvent);

    expect(result).toBeNull();
  });
});
