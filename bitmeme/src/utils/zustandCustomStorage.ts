import { getLocalStorage, setLocalStorage, removeLocalStorage } from "@/utils/localStorage";

export const zustandCustomStorage = {
  getItem: async (name: string): Promise<string | null> => {
    // Retrieve the raw string value (no TTL/expiry logic for Zustand persist)
    return await getLocalStorage<string>(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    // Store the raw string value
    await setLocalStorage<string>(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await removeLocalStorage(name);
  },
}; 