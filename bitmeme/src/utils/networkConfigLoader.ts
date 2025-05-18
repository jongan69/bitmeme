import "../../polyfills";
import * as borsh from "@coral-xyz/borsh";
import { Connection, PublicKey } from "@solana/web3.js";
import { getLocalStorage, setLocalStorage } from "./localStorage";

// --- Define your schemas ---
const bootstrapSchema = borsh.struct([
  borsh.publicKey("superOperatorCertificate"),
  borsh.publicKey("chadbufferProgramId"),
  borsh.publicKey("bitcoinSpvProgramId"),
  borsh.publicKey("twoWayPegProgramId"),
  borsh.publicKey("liquidityManagementProgramId"),
  borsh.publicKey("delegatorProgramId"),
  borsh.publicKey("layerCaProgramId"),
]);

const guardianSettingSchema = borsh.struct([
  borsh.u32("seed"),
  borsh.publicKey("guardianCertificate"),
  borsh.publicKey("assetMint"),
  borsh.publicKey("tokenProgramId"),
  borsh.publicKey("splTokenMintAuthority"),
  borsh.publicKey("splTokenBurnAuthority"),
]);

// --- Fetch program IDs from the bootstrapper account ---
export async function fetchZplProgramIds(bootstrapperProgramId: string, rpcUrl: string) {
  const connection = new Connection(rpcUrl);
  const bootstrapAccounts = await connection.getProgramAccounts(new PublicKey(bootstrapperProgramId));
  // console.log("[fetchZplProgramIds] bootstrapAccounts", bootstrapAccounts);
  if (!bootstrapAccounts.length) throw new Error("No bootstrapper accounts found");
  const bootstrapAccountData = bootstrapAccounts[0].account.data;
  // console.log("[fetchZplProgramIds] bootstrapAccountData (raw)", bootstrapAccountData);
  let bootstrapData;
  try {
    bootstrapData = bootstrapSchema.decode(bootstrapAccountData);
    // console.log("[fetchZplProgramIds] Decoded bootstrapData", bootstrapData);
  } catch (err) {
    console.error("[fetchZplProgramIds] Error decoding bootstrapAccountData", err);
    throw err;
  }

  return {
    twoWayPegProgramId: bootstrapData.twoWayPegProgramId.toBase58(),
    liquidityManagementProgramId: bootstrapData.liquidityManagementProgramId.toBase58(),
    delegatorProgramId: bootstrapData.delegatorProgramId.toBase58(),
    bitcoinSpvProgramId: bootstrapData.bitcoinSpvProgramId.toBase58(),
    layerCaProgramId: bootstrapData.layerCaProgramId.toBase58(),
  };
}

// --- Fetch asset mint from the guardian setting account ---
export async function fetchAssetMint(guardianSettingAccountAddress: string, rpcUrl: string) {
  const connection = new Connection(rpcUrl);
  const guardianSettingAccount = await connection.getAccountInfo(new PublicKey(guardianSettingAccountAddress));
  if (!guardianSettingAccount?.data) throw new Error("No data found for guardian setting account");

  // Correctly decode from offset 8
  try {
    const guardianSettingsAccountData = guardianSettingSchema.decode(guardianSettingAccount.data.subarray(8));
    // console.log("[fetchAssetMint] Decoded guardianSettingsAccountData", guardianSettingsAccountData);
    return guardianSettingsAccountData.assetMint.toBase58();
  } catch (err) {
    console.error("[fetchAssetMint] Error decoding guardianSettingAccount data", err);
    throw err;
  }
}

export async function fetchAndCacheZplProgramIdsAndAssetMint(bootstrapperProgramId: string, guardianSettingAccountAddress: string, rpcUrl: string, isDebug: boolean = true) {
  // console.log("fetchAndCacheZplProgramIdsAndAssetMint called", bootstrapperProgramId, guardianSettingAccountAddress, rpcUrl);
  const zplProgramIds = await getLocalStorage("zplProgramIds");
  // console.log("[fetchAndCacheZplProgramIdsAndAssetMint] zplProgramIds", zplProgramIds);
  const assetMint = await getLocalStorage("assetMint");
  // console.log("[fetchAndCacheZplProgramIdsAndAssetMint] assetMint", assetMint);
  if(zplProgramIds && assetMint && !isDebug) {
    console.log("[fetchAndCacheZplProgramIdsAndAssetMint] zplProgramIds and assetMint found in local storage", zplProgramIds, assetMint);
    return {
      zplProgramIds,
      assetMint,
    };
  } else {
    const zplProgramIds = await fetchZplProgramIds(bootstrapperProgramId, rpcUrl);
    // console.log("[fetchAndCacheZplProgramIdsAndAssetMint] zplProgramIds", zplProgramIds);
    setLocalStorage("zplProgramIds", zplProgramIds);
    const assetMint = await fetchAssetMint(guardianSettingAccountAddress, rpcUrl);
    // console.log("[fetchAndCacheZplProgramIdsAndAssetMint] assetMint", assetMint);
    setLocalStorage("assetMint", assetMint);
    return { zplProgramIds, assetMint };
  }
}

