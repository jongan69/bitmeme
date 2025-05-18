import { useState, useEffect, useCallback } from "react";
import { getLocalStorage, setLocalStorage } from "@/utils/localStorage";

export function useValuesCopy(id: string): [string, (valuesCopy: string) => void] {
  const [value, setValue] = useState("");

  useEffect(() => {
    getLocalStorage<string>(id).then((stored) => {
      if (stored !== null) setValue(stored);
    });
  }, [id]);

  const setAndStore = useCallback(
    (newValue: string) => {
      setValue(newValue);
      setLocalStorage(id, newValue);
    },
    [id]
  );

  return [value, setAndStore];
}