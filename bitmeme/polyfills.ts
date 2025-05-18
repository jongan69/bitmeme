import { getRandomValues as expoCryptoGetRandomValues } from "expo-crypto";
import pbkdf2 from "pbkdf2";

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

// Crypto polyfill for Clerk, Solana, Stacks
(global as any).crypto = {
    getRandomValues: expoCryptoGetRandomValues,
    // Minimal crypto shim for Stacks, Since doesnt have subtle so generateWallet will fail
    pbkdf2: pbkdf2.pbkdf2,
    pbkdf2Sync: pbkdf2.pbkdf2Sync,
  };

