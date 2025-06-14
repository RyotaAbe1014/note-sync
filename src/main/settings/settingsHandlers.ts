import { ipcMain } from 'electron';

import { AppSettings } from '../../types/appSettings';

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

export function setupAppSettingsHandlers() {
  ipcMain.handle('app:get-settings', async (_) => {
    const store = await initStore();
    return store.get('settings');
  });

  ipcMain.handle('app:set-settings', async (_, settings) => {
    const store = await initStore();
    store.set('settings', settings);
  });
}
