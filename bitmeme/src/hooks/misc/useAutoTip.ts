import { useCallback, useEffect, useState } from "react";
import { getLocalStorage, setLocalStorage } from "@/utils/localStorage";

/**
 * useAutoTip - React hook to get and set the autoTipOn setting from local storage
 *
 * @returns [autoTipOn, setAutoTipOn, loading]
 *
 * Usage:
 *   const [autoTipOn, setAutoTipOn, loading] = useAutoTip();
 */
export default function useAutoTip(): [boolean, React.Dispatch<React.SetStateAction<boolean>>, boolean] {
  const [autoTipOn, setAutoTipOnState] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await getLocalStorage<string>("autoTipOn");
      setAutoTipOnState(stored === "true");
      setLoading(false);
    })();
  }, []);

  const setAutoTip: React.Dispatch<React.SetStateAction<boolean>> = useCallback((v) => {
    setAutoTipOnState((prev) => {
      const next = typeof v === 'function' ? (v as (prev: boolean) => boolean)(prev) : v;
      setLocalStorage("autoTipOn", next.toString());
      return next;
    });
  }, []);

  return [autoTipOn, setAutoTip, loading];
} 