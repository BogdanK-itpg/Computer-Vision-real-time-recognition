"use client";

import { useState, useCallback, useRef } from "react";
import { modelManager } from "@/lib/detectors/model-manager";

export function useModelManager() {
  const [wasmInitialized, setWasmInitialized] = useState(false);
  const [loadingModels, setLoadingModels] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const initPromise = useRef<Promise<void> | null>(null);

  const initialize = useCallback(async () => {
    if (wasmInitialized) return;
    if (initPromise.current) return initPromise.current;
    setError(null);
    initPromise.current = modelManager.initializeWasm().then(() => {
      setWasmInitialized(true);
    });
    try {
      await initPromise.current;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : e instanceof Event
            ? `Event: ${e.type}`
            : String(e),
      );
      initPromise.current = null;
    }
  }, [wasmInitialized]);

  const loadModel = useCallback(async (type: string) => {
    setLoadingModels((prev) => new Set(prev).add(type));
    setError(null);
    try {
      await modelManager.loadModel(type);
    } catch (e) {
      const detail =
        e instanceof Error
          ? e.message
          : e instanceof Event
            ? `Event: ${e.type}`
            : String(e);
      setError(`Failed to load model: ${type} (${detail})`);
    } finally {
      setLoadingModels((prev) => {
        const next = new Set(prev);
        next.delete(type);
        return next;
      });
    }
  }, []);

  const loadModels = useCallback(
    async (types: string[]) => {
      await Promise.all(types.map((t) => loadModel(t)));
    },
    [loadModel],
  );

  const isModelLoading = useCallback(
    (type: string) => loadingModels.has(type),
    [loadingModels],
  );

  const getLoadedModels = useCallback(() => modelManager.getLoadedTypes(), []);

  return {
    initialize,
    loadModel,
    loadModels,
    isModelLoading,
    getLoadedModels,
    wasmInitialized,
    loadingModels,
    error,
  };
}
