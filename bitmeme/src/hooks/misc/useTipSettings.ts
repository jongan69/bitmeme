import { useCallback, useEffect, useState } from "react";
import { getLocalStorage, setLocalStorage } from "@/utils/localStorage";

/**
 * useTipSettings - React hook to get and set the tipCurrency and tipAmount from local storage
 *
 * @returns [tipCurrency, setTipCurrency, tipAmount, setTipAmount, loading]
 *
 * Usage:
 *   const [tipCurrency, setTipCurrency, tipAmount, setTipAmount, loading] = useTipSettings();
 */
export default function useTipSettings(): [string, (v: string) => void, string, (v: string) => void, boolean] {
  const [tipCurrency, setTipCurrencyState] = useState("STX");
  const [tipAmount, setTipAmountState] = useState("1");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedCurrency = await getLocalStorage<string>("tipCurrency");
      const storedAmount = await getLocalStorage<string>("tipAmount");
      if (storedCurrency && typeof storedCurrency === 'string') setTipCurrencyState(storedCurrency);
      if (typeof storedAmount === 'string') setTipAmountState(storedAmount);
      setLoading(false);
    })();
  }, []);

  const setTipCurrency = useCallback((v: string) => {
    setTipCurrencyState(v);
    setLocalStorage("tipCurrency", v);
  }, []);

  const setTipAmount = useCallback((v: string) => {
    setTipAmountState(v);
    setLocalStorage("tipAmount", v);
  }, []);

  return [tipCurrency, setTipCurrency, tipAmount, setTipAmount, loading];
} 