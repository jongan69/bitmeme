import { getRandomValues as expoCryptoGetRandomValues } from "expo-crypto";
import './local-storage'

// eslint-disable-next-line @typescript-eslint/no-require-imports
global.Buffer = require('buffer').Buffer;

// Buffer.prototype.subarray polyfill specific to expo
// See: https://github.com/solana-foundation/anchor/issues/3041
Buffer.prototype.subarray = function subarray(begin: number, end: number) {
    const result = Uint8Array.prototype.subarray.apply(this, [begin, end]);
    Object.setPrototypeOf(result, Buffer.prototype); // Ensures Buffer methods are available
    return result;
  };

// eslint-disable-next-line @typescript-eslint/no-require-imports
global.TextEncoder = require("text-encoding").TextEncoder;

// getRandomValues polyfill
class Crypto {
    getRandomValues = expoCryptoGetRandomValues;
}

const webCrypto = typeof crypto !== "undefined" ? crypto : new Crypto();

(() => {
    if (typeof crypto === "undefined") {
        Object.defineProperty(window, "crypto", {
            configurable: true,
            enumerable: true,
            get: () => webCrypto,
        });
    }
})();