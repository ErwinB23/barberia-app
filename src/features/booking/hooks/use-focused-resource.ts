import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

export function useFocusedResource<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await load();
      if (currentRequestId === requestId.current) setData(result);
    } catch {
      if (currentRequestId === requestId.current) {
        setError('No pudimos cargar la información. Revisa tu conexión e inténtalo nuevamente.');
      }
    } finally {
      if (currentRequestId === requestId.current) setIsLoading(false);
    }
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void reload();
      return () => {
        requestId.current += 1;
      };
    }, [reload]),
  );

  return { data, isLoading, error, reload };
}
