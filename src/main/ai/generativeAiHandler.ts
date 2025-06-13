import { ipcMain } from 'electron';
import OpenAI from 'openai';

import { AppSettings } from '../../types/appSettings';

let store: any;

const initStore = async () => {
  if (!store) {
    const Store = (await import('electron-store')).default;
    store = new Store<AppSettings>({
      name: 'app-settings',
    });
  }
  return store;
};

const getOpenAIKey = async () => {
  const storeInstance = await initStore();
  const settings: AppSettings | undefined = storeInstance.get('settings');
  return settings?.apiKeys?.openai;
};

export function setupGenerativeAiHandlers() {
  ipcMain.handle('ai:get-inline-response', async (event, prompt: string) => {
    const openaiKey = await getOpenAIKey();
    if (!openaiKey) {
      throw new Error('OpenAI API key is not set');
    }
    const client = new OpenAI({
      apiKey: openaiKey,
    });

    const response = await client.responses.create({
      model: 'gpt-4o',
      instructions: `あなたは優れたエンジニアです。日本語で返答してください。言われたことに対してのみ返信をしてください。`,
      input: prompt,
    });

    console.log(response.output_text);
    return response.output_text;
  });
}
