import { useRef, useCallback, useEffect } from 'react';
import { DEBOUNCE_SAVE } from '../lib/constants';

export function useAutoSave(
  saveFn: (value: string) => void,
  delay = DEBOUNCE_SAVE,
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValue = useRef<string>('');

  const save = useCallback((value: string) => {
    latestValue.current = value;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => saveFn(value), delay);
  }, [saveFn, delay]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        saveFn(latestValue.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return save;
}
