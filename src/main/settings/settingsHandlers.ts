import { ipcMain } from 'electron';

import type { AppSettings } from '../../types/appSettings';
import { IPC_CHANNELS } from '../common/constants';
import { decrypt, encrypt, generateMasterKey } from '../common/crypto/cryptoUtils';
import { validateSender } from '../common/security/ipcSecurity';

const MASTER_KEY_NAME = 'masterKey';
const ENCRYPTED_KEY_PREFIX = 'encrypted.';

const schema = {
  rootDirectory: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        default: '',
      },
    },
  },
  git: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        default: '',
      },
      author: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            default: '',
          },
          email: {
            type: 'string',
            default: '',
          },
        },
      },
    },
  },
  apiKeys: {
    type: 'object',
    properties: {
      openai: {
        type: 'string',
        default: '',
      },
    },
  },
  theme: {
    type: 'string',
    default: 'system',
  },
};

let appSettingsStore: any;
let cryptoStore: any;

const initStore = async () => {
  if (!appSettingsStore) {
    const Store = (await import('electron-store')).default;
    appSettingsStore = new Store<AppSettings>({
      name: 'app-settings',
      schema,
    });
  }
  return appSettingsStore;
};

const initCryptoStore = async () => {
  if (!cryptoStore) {
    const Store = (await import('electron-store')).default;
    cryptoStore = new Store({
      name: 'crypto-settings',
      encryptionKey: 'note-sync-crypto-store', // electron-storeの暗号化機能を使用
    });
  }
  return cryptoStore;
};

const getMasterKey = async (): Promise<string> => {
  const crypto = await initCryptoStore();
  let masterKey = crypto.get(MASTER_KEY_NAME);

  if (!masterKey) {
    masterKey = generateMasterKey();
    crypto.set(MASTER_KEY_NAME, masterKey);
  }

  return masterKey;
};

export function setupAppSettingsHandlers() {
  ipcMain.handle(IPC_CHANNELS.APP_GET_SETTINGS, async (event) => {
    validateSender(event);
    const store = await initStore();
    const settings = store.get('settings') || {};

    // 暗号化されたAPIキーを復号化
    if (settings?.apiKeys) {
      const decryptedApiKeys = { ...settings.apiKeys };

      // OpenAI APIキーの復号化
      if (settings.apiKeys.openai && settings.apiKeys.openai.startsWith(ENCRYPTED_KEY_PREFIX)) {
        try {
          const encryptedData = settings.apiKeys.openai.substring(ENCRYPTED_KEY_PREFIX.length);
          const [encrypted, salt] = encryptedData.split('.');
          const masterKey = await getMasterKey();
          decryptedApiKeys.openai = decrypt(encrypted, masterKey, salt);
        } catch (error) {
          console.error('Failed to decrypt OpenAI API key', error);
          decryptedApiKeys.openai = '';
        }
      }

      return {
        ...settings,
        apiKeys: decryptedApiKeys,
      };
    }

    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.APP_SET_SETTINGS, async (event, settings: AppSettings) => {
    validateSender(event);
    const store = await initStore();

    // APIキーを暗号化して保存
    if (settings?.apiKeys) {
      const encryptedApiKeys = { ...settings.apiKeys };

      // OpenAI APIキーの暗号化
      if (settings.apiKeys.openai && !settings.apiKeys.openai.startsWith(ENCRYPTED_KEY_PREFIX)) {
        try {
          const masterKey = await getMasterKey();
          const { encrypted, salt } = encrypt(settings.apiKeys.openai, masterKey);
          encryptedApiKeys.openai = `${ENCRYPTED_KEY_PREFIX}${encrypted}.${salt}`;
        } catch (error) {
          console.error('Failed to encrypt OpenAI API key', error);
        }
      }

      store.set('settings', {
        ...settings,
        apiKeys: encryptedApiKeys,
      });
    } else {
      store.set('settings', settings);
    }
  });
}
