import { useUnifiedWallet } from "@/contexts/UnifiedWalletProvider";
import { useCallback } from "react";
import { mintNFT } from "@/utils/stacksMintNft"; // Adjust this import to your actual mint utility

// Custom hook to mint NFT from image URL
export const useMintNftWithImageUrl = () => {
    const { stacks } = useUnifiedWallet();

    const mintNftWithImageUrl = useCallback(
      async (imageUrl: string) => {
        if (!stacks?.privateKey) throw new Error("Stacks wallet not loaded");
        // Call your mintNFT utility, passing the privateKey/address and imageUrl
        try {
          const txid = await mintNFT(stacks.privateKey, imageUrl); // Adjust as needed
          return txid;
        } catch (err) {
          throw err;
        }
      },
      [stacks]
    );

    return mintNftWithImageUrl;
};