import { PublicKey } from "@solana/web3.js";
import { useCallback } from "react";

import { convertBitcoinNetwork, deriveHotReserveAddress, UNLOCK_BLOCK_HEIGHT } from "@/bitcoin";
import { getInternalXOnlyPubkeyFromUserWallet } from "@/bitcoin/wallet";
import { useZplClient } from "@/contexts/ZplClientProvider";
import { useNetworkConfig } from "@/hooks/misc/useNetworkConfig";
import usePersistentStore from "@/stores/local/persistentStore";
import { CheckBucketResult } from "@/types/misc";
import { Chain } from "@/types/network";
import { BitcoinWallet } from "@/types/wallet";
import { HotReserveBucketStatus } from "@/types/zplClient";
import { createAxiosInstances } from "@/utils/axios";
import { notifyTx } from "@/utils/notification";

import useTwoWayPegGuardianSettings from "../hermes/useTwoWayPegGuardianSettings";

import { useSolanaWallet } from "@/contexts/SolanaWalletProvider";
import useColdReserveBuckets from "./useColdReserveBuckets";

const useHotReserveBucketActions = (bitcoinWallet: BitcoinWallet | null) => {
  const solanaNetwork = usePersistentStore((state) => state.solanaNetwork);
  const bitcoinNetwork = usePersistentStore((state) => state.bitcoinNetwork);
  const zplClient = useZplClient();
  const networkConfig = useNetworkConfig();
  const { publicKey: solanaPubkey } = useSolanaWallet();

  const { data: twoWayPegGuardianSettings } = useTwoWayPegGuardianSettings();
  const { data: coldReserveBuckets } = useColdReserveBuckets();

  const createHotReserveBucket = useCallback(async () => {
    console.log("[createHotReserveBucket] called");
    if (!zplClient || !bitcoinWallet || !solanaPubkey) {
      console.warn("[createHotReserveBucket] Missing zplClient, bitcoinWallet, or solanaPubkey", { zplClient, bitcoinWallet, solanaPubkey });
      return;
    }
    // console.log(`\n[createHotReserveBucket] zplClient`, zplClient);
    // console.log(`\n[createHotReserveBucket] networkConfig`, networkConfig);
    // console.log(`\n[createHotReserveBucket] twoWayPegGuardianSettings`, twoWayPegGuardianSettings);
    const selectedGuardian = twoWayPegGuardianSettings[0];
    console.log(`\n[createHotReserveBucket] selectedGuardian`, selectedGuardian);

    console.log(`\n[createHotReserveBucket] coldReserveBuckets`, coldReserveBuckets);
    console.log(`\n[createHotReserveBucket] selectedGuardian.address`, selectedGuardian.address);
    coldReserveBuckets.forEach((bucket, idx) => {
      if (bucket.guardianSetting && typeof bucket.guardianSetting.toBase58 === 'function') {
        console.log(`[createHotReserveBucket] bucket[${idx}].guardianSetting.toBase58()`, bucket.guardianSetting.toBase58());
      } else {
        console.log(`[createHotReserveBucket] bucket[${idx}].guardianSetting`, bucket.guardianSetting);
      }
    });

    const coldReserveBucket = coldReserveBuckets.find(
      (bucket: { guardianSetting: { toBase58: () => any; }; }) => bucket.guardianSetting.toBase58() === selectedGuardian.address
    );
    console.log("[createHotReserveBucket] coldReserveBucket", coldReserveBucket);

    if (!coldReserveBucket) {
      console.error("[createHotReserveBucket] Cold Reserve Bucket not found for the guardian setting");
      throw new Error("Cold Reserve Bucket not found for the guardian setting");
    }

    const guardianXOnlyPublicKey = Buffer.from(
      coldReserveBucket.keyPathSpendPublicKey
    );
    console.log("[createHotReserveBucket] guardianXOnlyPublicKey", guardianXOnlyPublicKey);

    const userBitcoinXOnlyPublicKey =
      getInternalXOnlyPubkeyFromUserWallet(bitcoinWallet);
    console.log("[createHotReserveBucket] userBitcoinXOnlyPublicKey", userBitcoinXOnlyPublicKey);

    if (!userBitcoinXOnlyPublicKey) {
      console.error("[createHotReserveBucket] Can't get x-only publickey");
      throw new Error("Can't get x-only publickey");
    }

    const { pubkey: hotReserveBitcoinXOnlyPublicKey } = deriveHotReserveAddress(
      guardianXOnlyPublicKey,
      userBitcoinXOnlyPublicKey,
      UNLOCK_BLOCK_HEIGHT,
      convertBitcoinNetwork(bitcoinNetwork)
    );
    console.log("[createHotReserveBucket] hotReserveBitcoinXOnlyPublicKey", hotReserveBitcoinXOnlyPublicKey);

    if (!hotReserveBitcoinXOnlyPublicKey) {
      console.error("[createHotReserveBucket] Can't get hot reserve x-only publickey");
      throw new Error("Can't get hot reserve x-only publickey");
    }

    const twoWayPegConfiguration = await zplClient.getTwoWayPegConfiguration();
    console.log("[createHotReserveBucket] twoWayPegConfiguration", twoWayPegConfiguration);

    const ix = zplClient.constructCreateHotReserveBucketIx(
      solanaPubkey,
      hotReserveBitcoinXOnlyPublicKey,
      userBitcoinXOnlyPublicKey,
      UNLOCK_BLOCK_HEIGHT,
      new PublicKey(selectedGuardian.address),
      new PublicKey(selectedGuardian.guardian_certificate),
      coldReserveBucket.publicKey,
      twoWayPegConfiguration.layerFeeCollector
    );
    console.log("[createHotReserveBucket] ix", ix);
    const sig = await zplClient.signAndSendTransactionWithInstructions([ix]);
    console.log("[createHotReserveBucket] Transaction signature", sig);

    notifyTx(true, {
      chain: Chain.Solana,
      txId: sig,
      solanaNetwork: solanaNetwork,
    });

    // NOTE: create hot reserve address in cobo so that zeus node can unlock the hot reserve utxo faster (not necessary so catch the error)
    const { aegleApi } = createAxiosInstances(solanaNetwork, bitcoinNetwork);
    aegleApi
      .post(
        `/api/v1/cobo-address`,
        {
          type: "hotReserveBucket",
          hotReserveBucketPda: zplClient
            .deriveHotReserveBucketAddress(hotReserveBitcoinXOnlyPublicKey)
            .toBase58(),
          coldReserveBucketPda: coldReserveBucket.publicKey.toBase58(),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .catch((e) => console.error("[createHotReserveBucket] aegleApi.post error", e));
  }, [
    zplClient,
    solanaPubkey,
    bitcoinWallet,
    bitcoinNetwork,
    solanaNetwork,
    coldReserveBuckets,
    twoWayPegGuardianSettings
  ]);

  const reactivateHotReserveBucket = useCallback(async () => {
    console.log("[reactivateHotReserveBucket] called");
    if (!zplClient) {
      console.warn("[reactivateHotReserveBucket] Missing zplClient");
      return;
    }

    const userBitcoinXOnlyPublicKey =
      getInternalXOnlyPubkeyFromUserWallet(bitcoinWallet);
    console.log("[reactivateHotReserveBucket] userBitcoinXOnlyPublicKey", userBitcoinXOnlyPublicKey);

    if (!userBitcoinXOnlyPublicKey) {
      console.warn("[reactivateHotReserveBucket] Can't get x-only publickey");
      return;
    }

    const hotReserveBuckets =
      await zplClient.getHotReserveBucketsByBitcoinXOnlyPubkey(
        userBitcoinXOnlyPublicKey
      );
    console.log("[reactivateHotReserveBucket] hotReserveBuckets", hotReserveBuckets);

    if (hotReserveBuckets.length === 0) {
      console.warn("[reactivateHotReserveBucket] No hot reserve buckets found");
      return;
    }

    const targetHotReserveBucket = hotReserveBuckets.find(
      (bucket) =>
        bucket.guardianSetting.toBase58() === networkConfig.guardianSetting
    );
    console.log("[reactivateHotReserveBucket] targetHotReserveBucket", targetHotReserveBucket);
    if (!targetHotReserveBucket) {
      console.error("[reactivateHotReserveBucket] Wrong guardian setting");
      throw new Error("Wrong guardian setting");
    }

    const twoWayPegConfiguration = await zplClient.getTwoWayPegConfiguration();
    console.log("[reactivateHotReserveBucket] twoWayPegConfiguration", twoWayPegConfiguration);

    const ix = zplClient.constructReactivateHotReserveBucketIx(
      targetHotReserveBucket.publicKey,
      twoWayPegConfiguration.layerFeeCollector
    );
    console.log("[reactivateHotReserveBucket] ix", ix);

    const sig = await zplClient.signAndSendTransactionWithInstructions([ix]);
    console.log("[reactivateHotReserveBucket] Transaction signature", sig);
    notifyTx(true, {
      chain: Chain.Solana,
      txId: sig,
      solanaNetwork: solanaNetwork,
    });
  }, [zplClient, bitcoinWallet, solanaNetwork, networkConfig.guardianSetting]);

  const checkHotReserveBucketStatus = useCallback(async () => {
    // console.log("[checkHotReserveBucketStatus] called");
    if (!zplClient || !solanaPubkey) {
      console.warn("[checkHotReserveBucketStatus] Missing zplClient or solanaPubkey", { zplClient, solanaPubkey });
      return;
    }

    const userBitcoinXOnlyPublicKey =
      getInternalXOnlyPubkeyFromUserWallet(bitcoinWallet);
    // console.log("[checkHotReserveBucketStatus] userBitcoinXOnlyPublicKey", userBitcoinXOnlyPublicKey);

    if (!userBitcoinXOnlyPublicKey) {
      console.warn("[checkHotReserveBucketStatus] Can't get x-only publickey");
      return;
    }

    const hotReserveBuckets =
      await zplClient.getHotReserveBucketsByBitcoinXOnlyPubkey(
        userBitcoinXOnlyPublicKey
      );
    // console.log("[checkHotReserveBucketStatus] hotReserveBuckets", hotReserveBuckets);

    if (hotReserveBuckets.length === 0)
      return { status: CheckBucketResult.NotFound };

    // NOTE: Regtest and Testnet use the same ZPL with different guardian settings, so we need to set guardian setting in env, and our mechanism only create 1 hot reserve bucket for each bitcoin public key in mainnet.
    const targetHotReserveBucket = hotReserveBuckets.find(
      (bucket) =>
        bucket.guardianSetting.toBase58() === networkConfig.guardianSetting
    );
    console.log("[checkHotReserveBucketStatus] targetHotReserveBucket", targetHotReserveBucket);
    if (!targetHotReserveBucket) {
      console.error("[checkHotReserveBucketStatus] Wrong guardian setting");
      throw new Error("Wrong guardian setting");
    }

    const status = targetHotReserveBucket.status;
    const owner = targetHotReserveBucket.owner;
    const expiredAt = targetHotReserveBucket.expiredAt;
    console.log("[checkHotReserveBucketStatus] status, owner, expiredAt", status, owner, expiredAt);

    if (owner?.toBase58() !== solanaPubkey?.toBase58()) {
      console.warn("[checkHotReserveBucketStatus] Wrong owner", { owner: owner.toBase58(), solanaPubkey: solanaPubkey.toBase58() });
      return { owner: owner.toBase58(), status: CheckBucketResult.WrongOwner };
    }

    if (status === Number(HotReserveBucketStatus.Deactivated)) {
      return {
        status: CheckBucketResult.Deactivated,
      };
    }

    if (Date.now() > expiredAt.toNumber() * 1000) {
      return { status: CheckBucketResult.Expired };
    }

    return { status: CheckBucketResult.Activated };
  }, [zplClient, solanaPubkey, bitcoinWallet, networkConfig.guardianSetting]);

  return {
    createHotReserveBucket,
    reactivateHotReserveBucket,
    checkHotReserveBucketStatus,
  };
};

export default useHotReserveBucketActions;
