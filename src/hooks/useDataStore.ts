import { useSyncExternalStore } from 'react';
import { subscribe } from '@/lib/dataStore';

export function useDataStore<T>(getSnapshot: () => T): T {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
