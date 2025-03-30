import { atom } from 'jotai';

export const toastAtom = atom<{
  message: string;
  type: 'success' | 'error';
}>({ message: '', type: 'success' });
