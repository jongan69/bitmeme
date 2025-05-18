import { WalletService } from "@/contexts/SolanaWalletProvider";
import { BitcoinWallet } from "@/types/wallet";
import { notifyError, notifySuccess } from "./notification";

export const createWallet = async (
  connectDerivedWallet: () => Promise<void>,
  bitcoinWallet: BitcoinWallet | null
): Promise<boolean> => {
  try {
    await WalletService.createWallet();
    await connectDerivedWallet();
    const wallet = await WalletService.loadWallet();
    if (wallet && bitcoinWallet?.p2tr) {
      notifySuccess(`Wallet ${bitcoinWallet.p2tr} loaded!`);
    }
    return true;
  } catch (error) {
    notifyError("Failed to create and load wallet.");
    console.error(error);
    return false;
  }
};

export const loadWallets = async (
  connectDerivedWallet: () => Promise<void>,
  bitcoinWallet: BitcoinWallet | null
): Promise<boolean> => {
  try {
    const wallet = await WalletService.loadWallet();
    if (wallet) {
      await connectDerivedWallet();
      if (bitcoinWallet?.p2tr) {
        notifySuccess(`Wallet ${bitcoinWallet.p2tr} loaded!`);
      }
      return true;
    } else {
      return await createWallet(connectDerivedWallet, bitcoinWallet);
    }
  } catch (error) {
    notifyError("Failed to load wallet.");
    console.error(error);
    return false;
  }
};