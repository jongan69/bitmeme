"use dom";

import React from "react";

const AboutBitMeme = (_: { dom?: import("expo/dom").DOMProps }) => {
  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        color: "#ffffff",
      }}
    >
      <h1 style={{ color: "#ffffff" }}>About BitMeme</h1>
      <h2>📱 BitMeme – AI-Powered Meme Generator with Lightning Tipping</h2>
      <p>
        <b>BitMeme</b> is a mobile app that empowers users to create hilarious, viral-ready memes using AI, and instantly tip their favorite memes with Bitcoin via the Lightning Network. BitMeme combines OpenAI's advanced language generation, the <a href="https://memegen.link" style={{ color: '#4fc3f7' }}>memegen.link</a> API for meme image rendering, and ZBD for seamless Bitcoin micropayments.
      </p>
      <hr />
      <h2>🔥 Key Features</h2>
      <h3>Meme Generator</h3>
      <ul>
        <li><b>Describe Your Meme:</b> Enter a prompt describing your meme idea (e.g., "when your code finally compiles").</li>
        <li><b>AI-Powered Creation:</b> BitMeme uses OpenAI (gpt-4-turbo) to select the best meme template and generate witty captions.</li>
        <li><b>Instant Rendering:</b> Memes are rendered in real-time using <a href="https://api.memegen.link/images" style={{ color: '#4fc3f7' }}>memegen.link</a> and displayed in the app.</li>
      </ul>
      <h3>Meme Feed & Sharing</h3>
      <ul>
        <li><b>View Your Meme:</b> Instantly see your most recently generated meme.</li>
        <li><b>Regenerate:</b> Not satisfied? Tap "Generate Again" to remix your prompt.</li>
        <li><b>Share & Save:</b> Download or share memes directly from the app using your device's sharing options.</li>
      </ul>
      <h3>Bitcoin Lightning Tipping</h3>
      <ul>
        <li><b>Tip Memes You Love:</b> Each meme features a "⚡ Tip Meme" button.</li>
        <li><b>Seamless Payments:</b> Generate a Lightning invoice (100–1000 sats) via ZBD and pay with your favorite wallet (Phoenix, Breez, Wallet of Satoshi, etc.).</li>
        <li><b>Instant Feedback:</b> Get notified when your tip is successful (e.g., "Thanks for tipping 250 sats!").</li>
      </ul>
      <h3>(Optional) Meme History & Profile</h3>
      <ul>
        <li><b>Your Meme Archive:</b> View a history of your generated memes.</li>
        <li><b>Track Tipping:</b> Optionally see how much you've tipped or received (with Supabase integration).</li>
      </ul>
      <hr />
      <h2>🛠️ Tech Stack & Integrations</h2>
      <table style={{ color: '#ffffff', borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #fff', padding: '4px' }}>Task</th>
            <th style={{ border: '1px solid #fff', padding: '4px' }}>Tool/Service</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #fff', padding: '4px' }}>AI caption & template gen</td>
            <td style={{ border: '1px solid #fff', padding: '4px' }}>OpenAI API (gpt-4-turbo)</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #fff', padding: '4px' }}>Meme image rendering</td>
            <td style={{ border: '1px solid #fff', padding: '4px' }}><a href="https://api.memegen.link" style={{ color: '#4fc3f7' }}>memegen.link</a></td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #fff', padding: '4px' }}>BTC tipping</td>
            <td style={{ border: '1px solid #fff', padding: '4px' }}><a href="https://zbd.dev" style={{ color: '#4fc3f7' }}>ZBD API</a></td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #fff', padding: '4px' }}>Auth / DB (optional)</td>
            <td style={{ border: '1px solid #fff', padding: '4px' }}>Supabase</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #fff', padding: '4px' }}>Mobile frontend</td>
            <td style={{ border: '1px solid #fff', padding: '4px' }}>React Native (Expo)</td>
          </tr>
        </tbody>
      </table>
      <hr />
      <h2>🧠 How It Works</h2>
      <ol>
        <li>Describe your meme idea.</li>
        <li>AI picks a template and writes captions.</li>
        <li>Meme is rendered and shown in the app.</li>
        <li>Share, download, or tip the meme instantly!</li>
      </ol>
      <hr />
      <h2>✨ Design Philosophy</h2>
      <ul>
        <li>Clean, minimal, meme-first UI</li>
        <li>Emphasis on shareability and social fun</li>
        <li>Fast, delightful feedback on every action</li>
      </ul>
      <hr />
      <p>
        BitMeme makes meme creation fun, social, and rewarding—powered by the latest in AI and Bitcoin Lightning technology.
      </p>
    </div>
  );
};

export default AboutBitMeme;
