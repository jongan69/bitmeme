import { useStacks } from "@/contexts/StacksWalletProvider";
import { useCallback } from "react";

// Custom hook to mint NFT from image URL
export const useMintNftWithImageUrl = () => {
    const { wallet, generateStxWallet, mintNFT, loadWalletFromLocalStorage } = useStacks();
  
    const mintNftWithImageUrl = useCallback(
      async (imageUrl: string) => {
        // Ensure wallet exists
        let currentWallet = wallet;
        if (!currentWallet) {
          await generateStxWallet();
          await loadWalletFromLocalStorage();
          currentWallet = wallet;
        }
        // Mint NFT with the image URL as metadata
        try {
          // You may want to update mintNFT to accept a metadataUri argument
          // For now, let's assume mintNFT can take an imageUrl
          await mintNFT(imageUrl);
        } catch (err) {
          throw err;
        }
      },
      [wallet, generateStxWallet, mintNFT, loadWalletFromLocalStorage]
    );
  
    return mintNftWithImageUrl;
  };