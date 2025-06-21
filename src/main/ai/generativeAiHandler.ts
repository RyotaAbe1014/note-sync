import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { ipcMain } from 'electron';

import type { AppSettings } from '../../types/appSettings';
import { IPC_CHANNELS } from '../common/constants';
import { validateSender } from '../common/security/ipcSecurity';

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
  ipcMain.handle(IPC_CHANNELS.AI_GET_INLINE_RESPONSE, async (event, prompt: string) => {
    validateSender(event);
    const openaiKey = await getOpenAIKey();
    if (!openaiKey) {
      throw new Error('OpenAI API key is not set');
    }
    const openaiClient = createOpenAI({
      apiKey: openaiKey,
    });

    const { text } = await generateText({
      model: openaiClient('gpt-4o'),
      system:
        'あなたは優れたエンジニアです。日本語で返答してください。言われたことに対してのみ返信をしてください。',
      prompt: prompt,
    });

    console.log(text);
    return text;
  });
}
