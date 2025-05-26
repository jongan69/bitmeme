import { makeContractCall, broadcastTransaction, stringAsciiCV } from "@stacks/transactions";
import { STACKS_MAINNET, STACKS_TESTNET } from "@stacks/network";
import { AppNetwork } from "@/types/store";

export async function mintNFT(privateKey: string, imageUrl: string) {
  // You may need to adjust contractAddress, contractName, and functionName
  const appNetwork = process.env.EXPO_PUBLIC_APP_NETWORK || "devnet";
  const stacksNetwork = appNetwork === AppNetwork.Mainnet ? STACKS_MAINNET : STACKS_TESTNET;
  const contractAddress = process.env.EXPO_PUBLIC_STACKS_MINT_CONTRACT!; // Example address
  const contractName = process.env.EXPO_PUBLIC_STACKS_CONTRACT_NAME || "bitmeme-mint";
  const functionName = process.env.EXPO_PUBLIC_STACKS_CONTRACT_FUNCTION || "claim";

  console.log("appNetwork", appNetwork);
  console.log("stacksNetwork", stacksNetwork);
  console.log("contractAddress", contractAddress);
  console.log("contractName", contractName);
  console.log("functionName", functionName);
  console.log("imageUrl", imageUrl);

  const txOptions = {
    contractAddress,
    contractName,
    functionName,
    functionArgs: [stringAsciiCV(imageUrl)],
    senderKey: privateKey,
    network: stacksNetwork,
    validateWithAbi: true,
  };
  const transaction = await makeContractCall(txOptions);
  const response = await broadcastTransaction({ transaction, network: stacksNetwork });
  console.log("response", response);
  if ('error' in response) {
    throw new Error("Minting failed: " + (response as any).reason);
  }
  if ('txid' in response) {
    return response.txid;
  }
  throw new Error("Minting failed: Unknown error");
} 