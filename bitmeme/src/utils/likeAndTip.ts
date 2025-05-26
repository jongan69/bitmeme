import { Chain } from "@/types/network";
import { notifyTx, notifyError, notifyInfo } from "./notification";
import { InteractionType } from "@/types/api";
import { SolanaNetwork, StacksNetwork, BitcoinNetwork } from "@/types/store";
import { PublicKey } from "@solana/web3.js";

  // --- Tip logic ---
  export const handleLikeAndTip = async (meme: any, hasLiked: boolean, removeLike: (id: string) => void, addLike: (id: string) => void, autoTipOn: boolean, solanaAddress: string, bitcoinAddress: string, stacksAddress: string, tipCurrency: string, tipAmount: string, sendBitcoin: (address: string, amount: number) => Promise<string>, stacks: any, transfer: any, network: string) => {
    const bitcoinNetwork = network === "mainnet" ? BitcoinNetwork.Mainnet : BitcoinNetwork.Testnet;
    const solanaNetwork = network === "mainnet" ? SolanaNetwork.Mainnet : SolanaNetwork.Devnet;
    const stacksNetwork = network === "mainnet" ? StacksNetwork.Mainnet : StacksNetwork.Testnet;
    
    if (hasLiked) {
      removeLike(meme.id);
      return;
    }
    addLike(meme.id);
    if (!autoTipOn) return;
    if (!solanaAddress && !bitcoinAddress && !stacksAddress) {
      notifyError("No wallet address found");
      return;
    }
    
    try {
      if (tipCurrency === "STX" && meme.stacksAddress) {
        const txid = await stacks.tipUser(meme.stacksAddress, BigInt(tipAmount));
        if (txid) {
          notifyTx(true, { chain: Chain.Stacks, type: InteractionType.Tip, txId: txid, network: stacksNetwork });
        }
      } else if (tipCurrency === "SOL" && meme.solanaAddress) {
        const txid = await transfer(Number(tipAmount), "SOL", new PublicKey(meme.solanaAddress), true);
        if (txid) {
          notifyTx(true, { chain: Chain.Solana, type: InteractionType.Tip, txId: txid, network: solanaNetwork });
        }
      } else if (tipCurrency === "BTC" && meme.bitcoinAddress) {
        const DUST_THRESHOLD = 330;
        const tipNum = Number(tipAmount);
        if (isNaN(tipNum) || tipNum < DUST_THRESHOLD) {
          console.log(tipNum)
          notifyError(`Tip amount must be a number and at least ${DUST_THRESHOLD} sats (dust threshold)`);
          return;
        }
        const txid = await sendBitcoin(meme.bitcoinAddress, tipNum);
        if (txid) {
          notifyTx(true, { chain: Chain.Bitcoin, type: InteractionType.Tip, txId: txid, network: bitcoinNetwork });
        }
      } else {
        notifyInfo("No address for selected tip currency.");
        console.log("No address for selected tip currency: ", tipCurrency, meme.stacksAddress, meme.solanaAddress, meme.bitcoinAddress);
      }
    } catch (e: any) {
      console.log("Tip failed: ", e);
      notifyError("Tip failed: " + (e && (e.message || typeof e === 'string' ? e : JSON.stringify(e))));
    }
  };
