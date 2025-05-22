import ecc from "@bitcoinerlab/secp256k1";
import { PublicKey } from "@solana/web3.js";
import * as bitcoin from "bitcoinjs-lib";
import { sha256, taggedHash } from "bitcoinjs-lib/src/crypto";
import { toXOnly } from "bitcoinjs-lib/src/psbt/bip371";
import ECPairFactory from "ecpair";
import { ECPairInterface } from "ecpair";
import * as nobleSecp256k1 from "@noble/secp256k1";

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
  opts: TweakSignerOpts = { network: bitcoin.networks.testnet }
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

// Helper to create a Taproot-compatible signer using @noble/secp256k1 (for React Native)
export function createNobleTaprootSigner(privateKey: Uint8Array) {
  const xOnlyPubkey = nobleSecp256k1.schnorr.getPublicKey(privateKey); // 32 bytes
  return {
    publicKey: xOnlyPubkey,
    signSchnorr: async (hash: Uint8Array) => {
      const sig = await nobleSecp256k1.schnorr.sign(hash, privateKey);
      return sig;
    },
    sign: async (hash: Uint8Array) => {
      const sig = await nobleSecp256k1.schnorr.sign(hash, privateKey);
      return sig;
    },
  };
}

export const deriveBitcoinWallet = async (
  publicKey: PublicKey,
  bitcoinNetwork: BitcoinNetwork,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<BitcoinWallet | null> => {
  try {
    // console.log('[deriveBitcoinWallet] called with:', { publicKey: publicKey?.toBase58?.(), bitcoinNetwork, signMessageExists: !!signMessage });
    if (publicKey === undefined) {
      console.log('[deriveBitcoinWallet] publicKey is undefined');
      return null;
    }
    const ECPair = ECPairFactory(ecc);
    bitcoin.initEccLib(ecc);
    if (!publicKey) {
      console.log('[deriveBitcoinWallet] Wallet not connected!');
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

    // Create both compressed and uncompressed key pairs
    const keyPairCompressed = ECPair.fromPrivateKey(signature_hash, { compressed: true });
    const keyPairUncompressed = ECPair.fromPrivateKey(signature_hash, { compressed: false });
    const privkey = keyPairCompressed;
    const pubkey = Buffer.from(keyPairCompressed.publicKey).toString("hex");
    const network = convertBitcoinNetwork(bitcoinNetwork);
    // Debug logs for Taproot signing
    const xOnlyPubkey = toXOnly(Buffer.from(keyPairCompressed.publicKey));
    // console.log('[deriveBitcoinWallet] Signer private key (hex):', keyPairCompressed.privateKey && Buffer.from(keyPairCompressed.privateKey).toString('hex'));
    // console.log('[deriveBitcoinWallet] Signer x-only pubkey (hex):', xOnlyPubkey.toString('hex'));
    // Check that privKey produces the x-only pubkey
    if (keyPairCompressed.privateKey) {
      const derivedXOnlyPubkey = nobleSecp256k1.schnorr.getPublicKey(Uint8Array.from(keyPairCompressed.privateKey));
      // console.log('[deriveBitcoinWallet] Derived x-only pubkey from privKey (hex):', Buffer.from(derivedXOnlyPubkey).toString('hex'));
      // console.log('[deriveBitcoinWallet] Internal x-only pubkey (hex):', Buffer.from(xOnlyPubkey).toString('hex'));
      // console.log('[deriveBitcoinWallet] Match:', Buffer.from(derivedXOnlyPubkey).equals(Buffer.from(xOnlyPubkey)));
      if (!Buffer.from(derivedXOnlyPubkey).equals(Buffer.from(xOnlyPubkey))) {
        console.error('[deriveBitcoinWallet] ERROR: Private key does not match internal x-only pubkey!');
      }
    }
    // console.log('[deriveBitcoinWallet] Taproot address from x-only pubkey:', bitcoin.payments.p2tr({ internalPubkey: xOnlyPubkey, network }).address);
    // console.log('[deriveBitcoinWallet] xOnlyPubkey length:', xOnlyPubkey.length);
    // console.log('[deriveBitcoinWallet] keyPair:', { privkey, pubkey });

    const p2pkh =
      bitcoin.payments.p2pkh({
        pubkey: Buffer.from(keyPairCompressed.publicKey),
        network,
      }).address ?? "";
    const p2wpkh =
      bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(keyPairCompressed.publicKey),
        network,
      }).address ?? "";
    const p2tr =
      bitcoin.payments.p2tr({
        internalPubkey: xOnlyPubkey,
        network,
      }).address ?? "";
    // console.log('[deriveBitcoinWallet] addresses:', { p2pkh, p2wpkh, p2tr });

    const tweakKeypair = tweakSigner(
      {
        ...keyPairCompressed,
        privateKey: signature_hash,
        publicKey: Buffer.from(keyPairCompressed.publicKey),
        sign: (hash: Buffer) => Buffer.from(keyPairCompressed.sign(hash)),
        signSchnorr: (hash: Buffer) => Buffer.from(keyPairCompressed.signSchnorr(hash)),
      } as any,
      { network }
    );
    // console.log('[deriveBitcoinWallet] tweakKeypair:', tweakKeypair);

    // Add nobleTaprootSigner
    const nobleTaprootSignerRaw = createNobleTaprootSigner(signature_hash);
    const nobleTaprootSigner = {
      ...nobleTaprootSignerRaw,
      publicKey: Buffer.from(nobleTaprootSignerRaw.publicKey),
      sign: async (hash: Uint8Array) => Buffer.from(await nobleTaprootSignerRaw.sign(hash)),
      signSchnorr: async (hash: Uint8Array) => Buffer.from(await nobleTaprootSignerRaw.signSchnorr(hash)),
    };

    const result = {
      privkeyHex: privkey_hex,
      privkey,
      pubkey,
      p2pkh,
      p2wpkh,
      p2tr,
      tweakSigner: tweakKeypair,
      signer: createTaprootSigner(keyPairCompressed),
      nobleTaprootSigner,
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

// Helper to create a Taproot-compatible signer (x-only pubkey, Schnorr signing)
export function createTaprootSigner(keyPair: ECPairInterface) {
  // Ensure privateKey is a Buffer
  const privKeyBuffer = Buffer.isBuffer(keyPair.privateKey)
    ? keyPair.privateKey
    : Buffer.from(keyPair.privateKey!);

  // Get x-only pubkey
  const xOnlyPubkey = toXOnly(Buffer.from(keyPair.publicKey));
  const publicKeyBuffer = Buffer.isBuffer(xOnlyPubkey) ? xOnlyPubkey : Buffer.from(xOnlyPubkey);
  // console.log('[createTaprootSigner] publicKey is Buffer:', Buffer.isBuffer(publicKeyBuffer));

  return {
    publicKey: publicKeyBuffer,
    privateKey: privKeyBuffer,
    signSchnorr: (hash: Buffer) => {
      // console.log('[createTaprootSigner] signSchnorr called with hash:', hash.toString('hex'));
      if (typeof keyPair.signSchnorr === "function") {
        const sig = keyPair.signSchnorr(hash);
        // console.log('[createTaprootSigner] Schnorr signature:', Buffer.from(sig).toString('hex'));
        return Buffer.from(sig);
      }
      throw new Error("signSchnorr not available on keyPair");
    },
    sign: (hash: Buffer) => {
      if (typeof keyPair.signSchnorr === "function") {
        return Buffer.from(keyPair.signSchnorr(hash));
      }
      throw new Error("signSchnorr not available on keyPair");
    },
  };
}

/**
 * Manually sign a single-input Taproot (P2TR) transaction using @noble/secp256k1.
 * @param psbt - The bitcoinjs-lib PSBT object (with 1 input)
 * @param inputIndex - The input index to sign (usually 0)
 * @param xOnlyPubkey - Buffer (32 bytes) x-only pubkey
 * @param inputValue - Number (satoshis) of the input
 * @param privateKey - Buffer (32 bytes) private key
 * @param network - bitcoinjs-lib network object
 * @returns {Promise<string>} - Signed transaction hex
 */
export async function signTaprootInputWithNoble({
  psbt,
  inputIndex = 0,
  xOnlyPubkey,
  inputValue,
  privateKey,
  network,
}: {
  psbt: bitcoin.Psbt;
  inputIndex?: number;
  xOnlyPubkey: Uint8Array;
  inputValue: number;
  privateKey: Uint8Array;
  network: bitcoin.networks.Network;
}): Promise<string> {
  try {
    psbt.finalizeInput(inputIndex);
    console.log('[DEBUG][signTaprootInputWithNoble] Successfully finalized input', inputIndex);
  } catch (e) {
    console.warn('[DEBUG][signTaprootInputWithNoble] Could not finalize input before extraction:', e);
  }
  let tx;
  let usedCache = false;
  try {
    tx = psbt.extractTransaction(true);
    console.log('[DEBUG][signTaprootInputWithNoble] Used extractTransaction(true)');
  } catch (e) {
    // @ts-ignore
    if (psbt.__CACHE && psbt.__CACHE.__TX) {
      // @ts-ignore
      tx = psbt.__CACHE.__TX;
      usedCache = true;
      console.log('[DEBUG][signTaprootInputWithNoble] Used psbt.__CACHE.__TX');
    } else {
      throw e;
    }
  }
  const prevoutScript = bitcoin.payments.p2tr({ internalPubkey: Buffer.from(xOnlyPubkey), network }).output!;
  const sighashType = bitcoin.Transaction.SIGHASH_DEFAULT;
  const sighash = tx.hashForWitnessV1(
    inputIndex,
    [prevoutScript],
    [inputValue],
    sighashType
  );
  const sighashUint8 = sighash instanceof Uint8Array ? sighash : Uint8Array.from(sighash);
  console.log('[DEBUG][signTaprootInputWithNoble] Sighash:', Buffer.from(sighashUint8).toString('hex'), 'type:', typeof sighashUint8, 'length:', sighashUint8.length);
  console.log('[DEBUG][signTaprootInputWithNoble] prevoutScript:', prevoutScript.toString('hex'));
  const schnorrSig = await nobleSecp256k1.schnorr.sign(sighashUint8, privateKey);
  console.log('[DEBUG][signTaprootInputWithNoble] Schnorr signature:', Buffer.from(schnorrSig).toString('hex'), 'type:', typeof schnorrSig, 'length:', schnorrSig.length);
  await verifyTaprootSchnorrSignature({
    signature: schnorrSig,
    sighash: sighashUint8,
    publicKey: xOnlyPubkey,
  });
  tx.ins[inputIndex].witness = [Buffer.from(schnorrSig)];
  const rawTxHex = tx.toHex();
  console.log('[DEBUG][signTaprootInputWithNoble] Raw transaction hex:', rawTxHex);
  if (!usedCache) {
    try {
      // @ts-expect-error
      const txCache = psbt.__CACHE.__TX;
      txCache.ins[inputIndex].witness = [Buffer.from(schnorrSig)];
      const rawTxHexCache = txCache.toHex();
      console.log('[DEBUG][signTaprootInputWithNoble] Raw transaction hex from __CACHE.__TX:', rawTxHexCache);
    } catch (e) {
      console.warn('[DEBUG][signTaprootInputWithNoble] Error using __CACHE.__TX for witness/serialization:', e);
    }
  }
  return rawTxHex;
}

// Try signing a PSBT using bitcoinjs-lib's signAllInputsAsync with nobleTaprootSigner
export async function tryBitcoinjsLibTaprootSign(psbt: bitcoin.Psbt, nobleTaprootSigner: any) {
  try {
    console.log('[DEBUG][tryBitcoinjsLibTaprootSign] Attempting to sign all inputs with nobleTaprootSigner...');
    await psbt.signAllInputsAsync(nobleTaprootSigner);
    psbt.finalizeAllInputs();
    const signedTxHex = psbt.extractTransaction().toHex();
    console.log('[DEBUG][tryBitcoinjsLibTaprootSign] Signed transaction hex:', signedTxHex);
    return signedTxHex;
  } catch (e) {
    console.error('[DEBUG][tryBitcoinjsLibTaprootSign] Error:', e);
    throw e;
  }
}

// Helper to verify a Taproot Schnorr signature locally
export async function verifyTaprootSchnorrSignature({
  signature,
  sighash,
  publicKey,
}: {
  signature: Uint8Array;
  sighash: Uint8Array;
  publicKey: Uint8Array;
}): Promise<boolean> {
  try {
    const isValid = await nobleSecp256k1.schnorr.verify(signature, sighash, publicKey);
    console.log('[DEBUG][verifyTaprootSchnorrSignature] Signature valid locally:', isValid);
    return isValid;
  } catch (e) {
    console.error('[DEBUG][verifyTaprootSchnorrSignature] Error verifying signature:', e);
    return false;
  }
}
