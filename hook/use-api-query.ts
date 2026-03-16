// hooks/use-api-query.ts
import { apiClient } from "@/lib/api/api-client";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseApiQueryOptions<T> {
  initialData?: T;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
}

export function useApiQuery<T>(
  endpoint: string,
  options: UseApiQueryOptions<T> = {},
) {
  const { initialData, enabled = true, onSuccess, onError } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(
    async (params?: Record<string, any>) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsLoading(true);
      setIsFetching(true);
      setError(null);

      try {
        const queryParams = params
          ? new URLSearchParams(params).toString()
          : "";
        const fullEndpoint = queryParams
          ? `${endpoint}?${queryParams}`
          : endpoint;

        const response = await apiClient.get<T>(fullEndpoint, {
          signal: abortControllerRef.current.signal,
        });

        setData(response.data);
        if (onSuccess) {
          onSuccess(response.data);
        }
        return response.data;
      } catch (error: any) {
        if (error.name !== "AbortError") {
          setError(error);
          if (onError) {
            onError(error);
          }
        }
        throw error;
      } finally {
        setIsLoading(false);
        setIsFetching(false);
        abortControllerRef.current = null;
      }
    },
    [endpoint, onSuccess, onError],
  );

  const refetch = useCallback(
    (params?: Record<string, any>) => {
      return fetchData(params);
    },
    [fetchData],
  );

  useEffect(() => {
    if (enabled) {
      fetchData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
    setData,
  };
}
