import { getRandomValues as expoCryptoGetRandomValues } from "expo-crypto";
import pbkdf2 from "pbkdf2";

// Polyfill Buffer for all environments
const BufferPolyfill = require('buffer').Buffer;

if (typeof global !== "undefined") {
  (global as any).Buffer = BufferPolyfill;
}
if (typeof window !== "undefined") {
  (window as any).Buffer = BufferPolyfill;
}
if (typeof globalThis !== "undefined") {
  (globalThis as any).Buffer = BufferPolyfill;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
global.Buffer = require('buffer').Buffer;
global.TextEncoder = require("text-encoding").TextEncoder;
global.TextDecoder = require("text-encoding").TextDecoder;

// Buffer.prototype.subarray polyfill specific to expo
// See: https://github.com/solana-foundation/anchor/issues/3041
Buffer.prototype.subarray = function subarray(begin: number, end: number) {
    const result = Uint8Array.prototype.subarray.apply(this, [begin, end]);
    Object.setPrototypeOf(result, Buffer.prototype); // Ensures Buffer methods are available
    return result;
};

// --- Crypto polyfill for Clerk, Solana, Stacks, and Web ---
class Crypto {
    getRandomValues = expoCryptoGetRandomValues;
    pbkdf2 = pbkdf2.pbkdf2;
    pbkdf2Sync = pbkdf2.pbkdf2Sync;
}

// Use the existing crypto if available, otherwise use our polyfill
const webCrypto =
    typeof globalThis.crypto !== "undefined"
        ? globalThis.crypto
        : new Crypto();

// Attach to global for React Native/Node
if (typeof (global as any).crypto === "undefined") {
    (global as any).crypto = webCrypto;
}

// Attach to window for web (if not already present)
if (typeof window !== "undefined" && typeof window.crypto === "undefined") {
    Object.defineProperty(window, "crypto", {
        configurable: true,
        enumerable: true,
        get: () => webCrypto,
    });
}

