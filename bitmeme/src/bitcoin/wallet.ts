import ecc from "@bitcoinerlab/secp256k1";
import { PublicKey } from "@solana/web3.js";
import * as bitcoin from "bitcoinjs-lib";
import { sha256, taggedHash } from "bitcoinjs-lib/src/crypto";
import { toXOnly } from "bitcoinjs-lib/src/psbt/bip371";
import ECPairFactory from "ecpair";


import { BitcoinNetwork } from "@/types/store";
import { BitcoinWallet, BitcoinXOnlyPublicKey } from "@/types/wallet";

import { getLocalStorage, removeLocalStorage, setLocalStorage } from "@/utils/localStorage";
import { convertBitcoinNetwork } from ".";
bitcoin.initEccLib(ecc);

export const ECPair = ECPairFactory(ecc);

interface TweakSignerOpts {
  network: bitcoin.networks.Network;
  tapTweak?: TapTweak;
}

type TapTweak = Buffer;

export interface Wallet {
  id: string;
  title: string;
  icon: string;
  type: "connector" | "solana";
  isDetected: boolean;
  url: string;
}

// Ref: https://github.com/Eunovo/taproot-with-bitcoinjs/blob/main/src/index.ts#L236
export function tweakSigner(
  signer: bitcoin.Signer,
  opts: TweakSignerOpts = { network: bitcoin.networks.regtest }
): bitcoin.Signer {
  // @ts-expect-error
  let privateKey: Uint8Array | undefined = signer.privateKey!;
  if (!privateKey) {
    throw new Error("Private key is required for tweaking signer!");
  }
  if (signer.publicKey[0] === 3) {
    privateKey = ecc.privateNegate(privateKey);
  }

  const tweakedPrivateKey = ecc.privateAdd(
    privateKey,
    tapTweakHash(toXOnly(signer.publicKey), opts.tapTweak)
  );
  if (!tweakedPrivateKey) {
    throw new Error("Invalid tweaked private key!");
  }
  const tweakedKeyPair = ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
    network: opts.network,
  });
  return {
    ...tweakedKeyPair,
    publicKey: Buffer.from(tweakedKeyPair.publicKey),
    sign: (hash) => Buffer.from(tweakedKeyPair.sign(hash)),
    signSchnorr: (hash) => Buffer.from(tweakedKeyPair.signSchnorr(hash)),
  };
}

export function tapTweakHash(pubkey: Buffer, h: Buffer | undefined): Buffer {
  return taggedHash("TapTweak", Buffer.concat(h ? [pubkey, h] : [pubkey]));
}

export const deriveBitcoinWallet = async (
  publicKey: PublicKey,
  bitcoinNetwork: BitcoinNetwork,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<BitcoinWallet | null> => {
  try {
    // console.log('[deriveBitcoinWallet] called with:', { publicKey: publicKey?.toBase58?.(), bitcoinNetwork, signMessageExists: !!signMessage });
    if (publicKey === undefined) {
      // console.log('[deriveBitcoinWallet] publicKey is undefined');
      return null;
    }
    const ECPair = ECPairFactory(ecc);
    bitcoin.initEccLib(ecc);
    if (!publicKey) {
      // console.log('[deriveBitcoinWallet] Wallet not connected!');
      throw new Error("Wallet not connected!");
    }
    if (!signMessage) {
      // console.log('[deriveBitcoinWallet] Wallet does not support message signing!');
      throw new Error("Wallet does not support message signing!");
    }
    const message = new TextEncoder().encode(
      `By proceeding, you are authorizing the generation of a Testnet address based on the Solana wallet you've connected. This process does not charge any fees. Connected Solana wallet address:${publicKey.toBase58()}`
    );
    // console.log('[deriveBitcoinWallet] Message to sign:', new TextDecoder().decode(message));

    const signature = await signMessage(message);
    // console.log('[deriveBitcoinWallet] Signature:', Buffer.from(signature).toString('hex'));

    // const isValid = verify(signature, message, publicKey.toBytes());
    // console.log('[deriveBitcoinWallet] Signature valid:', isValid);
    // if (!isValid) throw new Error("Invalid signature!");
    const signature_hash = sha256(Buffer.from(signature));
    const privkey_hex = signature_hash.toString("hex");
    // console.log('[deriveBitcoinWallet] signature_hash:', privkey_hex);

    const keyPair = ECPair.fromPrivateKey(signature_hash);
    const privkey = keyPair;
    const pubkey = Buffer.from(keyPair.publicKey).toString("hex");
    // console.log('[deriveBitcoinWallet] keyPair:', { privkey, pubkey });
    const network = convertBitcoinNetwork(bitcoinNetwork);
    // console.log('[deriveBitcoinWallet] network:', network);

    const p2pkh =
      bitcoin.payments.p2pkh({
        pubkey: Buffer.from(keyPair.publicKey),
        network,
      }).address ?? "";
    const p2wpkh =
      bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(keyPair.publicKey),
        network,
      }).address ?? "";
    const p2tr =
      bitcoin.payments.p2tr({
        internalPubkey: Buffer.from(keyPair.publicKey.subarray(1, 33)),
        network,
      }).address ?? "";
    // console.log('[deriveBitcoinWallet] addresses:', { p2pkh, p2wpkh, p2tr });

    const tweakKeypair = tweakSigner(
      {
        ...keyPair,
        privateKey: signature_hash,
        publicKey: Buffer.from(keyPair.publicKey),
        sign: (hash: Buffer) => Buffer.from(keyPair.sign(hash)),
        signSchnorr: (hash: Buffer) => Buffer.from(keyPair.signSchnorr(hash)),
      } as any,
      { network }
    );
    // console.log('[deriveBitcoinWallet] tweakKeypair:', tweakKeypair);

    const result = {
      privkeyHex: privkey_hex,
      privkey,
      pubkey,
      p2pkh,
      p2wpkh,
      p2tr,
      tweakSigner: tweakKeypair,
      signer: {
        ...keyPair,
        publicKey: Buffer.from(keyPair.publicKey),
        sign: (hash: Buffer) => Buffer.from(keyPair.sign(hash)),
        signSchnorr: (hash: Buffer) => Buffer.from(keyPair.signSchnorr(hash)),
      },
    };
    // console.log('[deriveBitcoinWallet] result:', result);
    return result;
  } catch (error) {
    console.error("[deriveBitcoinWallet] error", `Sign Message failed! ${error}`);
    return null;
  }
};

export const getBitcoinConnectorWallet = (
  pubkey: string,
  bitcoinNetwork: BitcoinNetwork
): BitcoinWallet => {
  const network = convertBitcoinNetwork(bitcoinNetwork);
  const { address: bitcoinAddress } = bitcoin.payments.p2tr({
    internalPubkey: toXOnly(Buffer.from(pubkey, "hex")),
    network,
  });
  return {
    pubkey: pubkey,
    p2tr: bitcoinAddress ?? "",
  };
};




export function getInternalXOnlyPubkeyFromUserWallet(
  bitcoinWallet: BitcoinWallet | null
): BitcoinXOnlyPublicKey | null {
  if (!bitcoinWallet) {
    return null;
  }

  const internalXOnlyPublicKey = toXOnly(
    Buffer.from(bitcoinWallet.pubkey, "hex")
  );

  return internalXOnlyPublicKey;
}

export const checkWalletAvailability = () => ({
  muses: typeof window !== "undefined" && window.muses !== undefined,
});

export const txConfirm = {
  isNotRemind: async () => {
    if (typeof window === "undefined") return false;
    const value = getLocalStorage("tx-confirm-modal-remind");
    return await value === "0";
  },
  setNotRemind: (notRemind: boolean) => {
    if (typeof window === "undefined") return;
    if (notRemind) {
      setLocalStorage("tx-confirm-modal-remind", "0");
    } else {
      removeLocalStorage("tx-confirm-modal-remind");
    }
  },
  reset: () => {
    if (typeof window === "undefined") return;
    removeLocalStorage("tx-confirm-modal-remind");
  },
};
