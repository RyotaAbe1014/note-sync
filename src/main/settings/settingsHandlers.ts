import { ipcMain } from 'electron';
// @ts-ignore
import Store from 'electron-store';

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
};

const appSettingsStore = new Store<AppSettings>({
  name: 'app-settings',
  schema,
});

export function setupAppSettingsHandlers() {
  ipcMain.handle('app:get-settings', async (event) => {
    return appSettingsStore.get('settings');
  });

  ipcMain.handle('app:set-settings', async (event, settings) => {
    appSettingsStore.set('settings', settings);
  });
}
