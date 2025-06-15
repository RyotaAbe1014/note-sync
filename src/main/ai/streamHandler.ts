import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { ipcMain } from 'electron';

import { AppSettings } from '../../types/appSettings';
import { IPC_CHANNELS } from '../constants';
import { validateSender } from '../security/ipcSecurity';

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

// アクティブなストリームを管理するためのMap
const activeStreams = new Map<number, AbortController>();

export function setupStreamHandlers() {
  ipcMain.on(IPC_CHANNELS.AI_STREAM_START, async (event, prompt: string) => {
    validateSender(event);
    const webContentsId = event.sender.id;

    try {
      // 既存のストリームがあればキャンセル
      if (activeStreams.has(webContentsId)) {
        activeStreams.get(webContentsId)?.abort();
        activeStreams.delete(webContentsId);
      }

      const openaiKey = await getOpenAIKey();
      if (!openaiKey) {
        event.sender.send(IPC_CHANNELS.AI_STREAM_ERROR, 'OpenAI API key is not set');
        return;
      }

      // キャンセル用のAbortController
      const abortController = new AbortController();
      activeStreams.set(webContentsId, abortController);

      const openaiClient = createOpenAI({
        apiKey: openaiKey,
      });

      const result = streamText({
        model: openaiClient('gpt-4o'),
        system:
          'あなたは優れたエンジニアです。日本語で返答してください。言われたことに対してのみ返信をしてください。',
        prompt: prompt,
        abortSignal: abortController.signal,
      });

      // textStreamではなく、resultを直接iterateする
      for await (const textPart of result.textStream) {
        // キャンセルされた場合は処理を停止
        if (abortController.signal.aborted) {
          break;
        }

        event.sender.send(IPC_CHANNELS.AI_STREAM_CHUNK, textPart);
      }

      // 正常終了
      activeStreams.delete(webContentsId);
      event.sender.send(IPC_CHANNELS.AI_STREAM_END);
    } catch (error) {
      activeStreams.delete(webContentsId);

      // AbortErrorの場合はキャンセルとして処理
      if (error instanceof Error && error.name === 'AbortError') {
        event.sender.send(IPC_CHANNELS.AI_STREAM_END);
      } else {
        event.sender.send(
          IPC_CHANNELS.AI_STREAM_ERROR,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  });

  ipcMain.on(IPC_CHANNELS.AI_STREAM_CANCEL, (event) => {
    validateSender(event);
    const webContentsId = event.sender.id;

    if (activeStreams.has(webContentsId)) {
      activeStreams.get(webContentsId)?.abort();
      activeStreams.delete(webContentsId);
    }

    event.sender.send(IPC_CHANNELS.AI_STREAM_END);
  });
}
