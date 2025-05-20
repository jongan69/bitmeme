import "./local-storage";
import 'react-native-url-polyfill/auto';

import { getRandomValues as expoCryptoGetRandomValues } from "expo-crypto";
import { sha256 } from '@noble/hashes/sha2';

// import pbkdf2 from "pbkdf2";

// eslint-disable-next-line @typescript-eslint/no-require-imports
global.Buffer = require('buffer').Buffer;

// Buffer.prototype.subarray polyfill specific to expo
// See: https://github.com/solana-foundation/anchor/issues/3041
Buffer.prototype.subarray = function subarray(begin: number, end: number) {
    const result = Uint8Array.prototype.subarray.apply(this, [begin, end]);
    Object.setPrototypeOf(result, Buffer.prototype); // Ensures Buffer methods are available
    return result;
};

// TextEncoder and TextDecoder polyfill
global.TextEncoder = require("text-encoding").TextEncoder;
global.TextDecoder = require("text-encoding").TextDecoder;

// --- Crypto polyfill for Clerk, Solana, Stacks, and Web ---
class PolyfilledCrypto {
  getRandomValues = expoCryptoGetRandomValues;
  randomUUID = () => { throw new Error('randomUUID not implemented'); };
  subtle = {
    digest: async function (algorithm: string, data: ArrayBuffer) {
      if (algorithm === 'SHA-256' || algorithm === 'SHA256') {
        const hash = sha256(new Uint8Array(data));
        return Uint8Array.from(hash).buffer;
      }
      throw new Error('Only SHA-256 is supported in this polyfill');
    }
  };
}

const webCrypto = typeof crypto !== "undefined" ? crypto : new PolyfilledCrypto();

(() => {
    if (typeof crypto === "undefined") {
        Object.defineProperty(window, "crypto", {
            configurable: true,
            enumerable: true,
            get: () => webCrypto,
        });
    }
})();

if (typeof global.crypto === 'undefined') {
  global.crypto = new PolyfilledCrypto() as any;
}
