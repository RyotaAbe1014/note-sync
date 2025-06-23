import { ipcMain } from 'electron';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { IPC_CHANNELS } from '../common/constants';
import * as cryptoUtils from '../common/crypto/cryptoUtils';
import { setupAppSettingsHandlers } from './settingsHandlers';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

vi.mock('../common/security/ipcSecurity', () => ({
  validateSender: vi.fn(),
}));

// ストアのモックを作成
const mockAppStore = new Map();
const mockCryptoStore = new Map();

vi.mock('electron-store', () => {
  return {
    default: vi.fn().mockImplementation((options) => {
      if (options?.name === 'crypto-settings') {
        return {
          get: vi.fn((key) => mockCryptoStore.get(key)),
          set: vi.fn((key, value) => mockCryptoStore.set(key, value)),
        };
      }
      return {
        get: vi.fn((key) => mockAppStore.get(key)),
        set: vi.fn((key, value) => mockAppStore.set(key, value)),
      };
    }),
  };
});

vi.mock('../common/crypto/cryptoUtils', () => ({
  encrypt: vi.fn(),
  decrypt: vi.fn(),
  generateMasterKey: vi.fn(),
}));

describe('settingsHandlers', () => {
  let handlers: Map<string, (...args: any[]) => any>;

  beforeEach(() => {
    handlers = new Map();
    mockAppStore.clear();
    mockCryptoStore.clear();
    vi.mocked(ipcMain.handle).mockImplementation(
      (channel: string, handler: (...args: any[]) => any) => {
        handlers.set(channel, handler);
      }
    );
    setupAppSettingsHandlers();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('APP_GET_SETTINGS', () => {
    it('暗号化されたAPIキーを復号化して返す', async () => {
      const mockEvent = { sender: {} };
      const encryptedKey = 'encrypted.encryptedData.salt';
      const decryptedKey = 'sk-1234567890';

      // 暗号化されたデータがストアに保存されている状態をシミュレート
      mockAppStore.set('settings', {
        apiKeys: {
          openai: encryptedKey,
        },
      });

      // cryptoモックの設定
      mockCryptoStore.set('masterKey', 'testMasterKey');
      vi.mocked(cryptoUtils.decrypt).mockReturnValue(decryptedKey);

      const handler = handlers.get(IPC_CHANNELS.APP_GET_SETTINGS);
      const result = await handler(mockEvent);

      expect(result.apiKeys.openai).toBe(decryptedKey);
      expect(cryptoUtils.decrypt).toHaveBeenCalledWith('encryptedData', 'testMasterKey', 'salt');
    });

    it('復号化に失敗した場合は空文字を返す', async () => {
      const mockEvent = { sender: {} };
      const encryptedKey = 'encrypted.encryptedData.salt';

      mockAppStore.set('settings', {
        apiKeys: {
          openai: encryptedKey,
        },
      });

      mockCryptoStore.set('masterKey', 'testMasterKey');
      vi.mocked(cryptoUtils.decrypt).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const handler = handlers.get(IPC_CHANNELS.APP_GET_SETTINGS);
      const result = await handler(mockEvent);

      expect(result.apiKeys.openai).toBe('');
    });
  });

  describe('APP_SET_SETTINGS', () => {
    it('APIキーを暗号化して保存する', async () => {
      const mockEvent = { sender: {} };
      const plainKey = 'sk-1234567890';
      const settings = {
        apiKeys: {
          openai: plainKey,
        },
      };

      mockCryptoStore.set('masterKey', 'testMasterKey');
      vi.mocked(cryptoUtils.encrypt).mockReturnValue({
        encrypted: 'encryptedData',
        salt: 'salt',
      });

      const handler = handlers.get(IPC_CHANNELS.APP_SET_SETTINGS);
      await handler(mockEvent, settings);

      expect(cryptoUtils.encrypt).toHaveBeenCalledWith(plainKey, 'testMasterKey');
      expect(mockAppStore.get('settings')).toEqual({
        apiKeys: {
          openai: 'encrypted.encryptedData.salt',
        },
      });
    });

    it('既に暗号化されたキーは再暗号化しない', async () => {
      const mockEvent = { sender: {} };
      const encryptedKey = 'encrypted.encryptedData.salt';
      const settings = {
        apiKeys: {
          openai: encryptedKey,
        },
      };

      const handler = handlers.get(IPC_CHANNELS.APP_SET_SETTINGS);
      await handler(mockEvent, settings);

      expect(cryptoUtils.encrypt).not.toHaveBeenCalled();
      expect(mockAppStore.get('settings')).toEqual(settings);
    });
  });
});
