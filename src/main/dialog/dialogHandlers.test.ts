import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupDialogHandlers } from './dialogHandlers';

let handleMock: ReturnType<typeof vi.fn>;
let showOpenDialogMock: ReturnType<typeof vi.fn>;

vi.mock('electron', () => {
  handleMock = vi.fn();
  showOpenDialogMock = vi.fn();
  return {
    ipcMain: {
      handle: handleMock,
    },
    dialog: {
      showOpenDialog: showOpenDialogMock,
    },
  };
});

describe('setupDialogHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ディレクトリ選択が成功した場合パスを返す', async () => {
    showOpenDialogMock.mockResolvedValue({ canceled: false, filePaths: ['/path'] });

    setupDialogHandlers();
    expect(handleMock).toHaveBeenCalledWith('dialog:select-directory', expect.any(Function));

    const handler = handleMock.mock.calls[0][1] as any;
    const result = await handler({});

    expect(showOpenDialogMock).toHaveBeenCalled();
    expect(result).toBe('/path');
  });

  it('キャンセルされた場合nullを返す', async () => {
    showOpenDialogMock.mockResolvedValue({ canceled: true, filePaths: [] });

    setupDialogHandlers();
    const handler = handleMock.mock.calls[0][1] as any;
    const result = await handler({});

    expect(result).toBeNull();
  });
});
