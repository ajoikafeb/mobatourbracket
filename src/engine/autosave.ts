import { useEffect, useCallback, useRef } from "react";

export function useUnloadWarning(hasUnsavedChanges: boolean): void {
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);
}

export function useAutoSave(
  saveFn: () => Promise<void>,
  intervalMs: number = 5000,
  enabled: boolean = true
): { saveNow: () => Promise<void> } {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      saveFnRef.current().catch(() => {});
    }, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [intervalMs, enabled]);

  const saveNow = useCallback(async () => {
    await saveFnRef.current();
  }, []);

  return { saveNow };
}
