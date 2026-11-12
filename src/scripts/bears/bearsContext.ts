import { createContext, useContext } from 'react';
import type { BearWithImage } from './types';

export type BearsState =
  | { status: 'loading' }
  | { status: 'success'; bears: BearWithImage[] }
  | { status: 'empty' }
  | { status: 'error'; message: string };

export interface BearsContextValue {
  state: BearsState;
  reload: () => void;
}

export const BearsContext = createContext<BearsContextValue | null>(null);

export function useBears(): BearsContextValue {
  const value = useContext(BearsContext);
  if (value === null) {
    throw new Error('useBears must be used inside <BearsProvider>');
  }
  return value;
}
